import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { nameToSlug, corsHeaders } from '../_shared/helpers.ts'

const BATCH_SIZE = 8
const FETCH_TIMEOUT_MS = 10000
const MIN_TEXT_LENGTH = 200

/**
 * URL patterns to try, in order of likelihood.
 * Most funeral home CMS platforms use /obituaries/{slug}/.
 */
function candidateUrls(domain: string, slug: string): string[] {
  return [
    `${domain}/obituaries/${slug}/`,
    `${domain}/obituaries/${slug}`,
    `${domain}/obituary/${slug}/`,
    `${domain}/obits/${slug}/`,
    `${domain}/memorials/${slug}/`,
  ]
}

/**
 * Extract the main article text from HTML.
 * Tries semantic containers first, falls back to paragraph aggregation.
 */
function extractMainText(html: string): string {
  // Strip noise blocks
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')

  // Try semantic content containers
  const containerPatterns = [
    /<article[^>]*>([\s\S]+?)<\/article>/i,
    /<main[^>]*>([\s\S]+?)<\/main>/i,
    /<div[^>]*class="[^"]*(?:obituary|obit|article-body|story-body|entry-content|post-content|content-body|tribute-body)[^"]*"[^>]*>([\s\S]+?)<\/div>/i,
    /<div[^>]*id="[^"]*(?:obituary|obit|article|content|story)[^"]*"[^>]*>([\s\S]+?)<\/div>/i,
  ]

  let candidate = ''
  for (const pattern of containerPatterns) {
    const match = cleaned.match(pattern)
    if (match) { candidate = match[0]; break }
  }

  // Fall back: collect all substantial <p> tags
  if (!candidate) {
    const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? []
    candidate = paragraphs
      .map(p => p.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 40)
      .join('\n\n')
  } else {
    candidate = candidate.replace(/<[^>]+>/g, ' ')
  }

  return candidate
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000)
}

/**
 * Try each candidate URL until we get a real obituary page.
 * Returns { url, text } on success, null on failure.
 */
async function fetchObituaryText(
  candidates: string[],
  firstName: string,
  lastName: string,
): Promise<{ url: string; text: string } | null> {
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Eternaflame Memorial Index (eternaflame.org) — archiving obituaries for free permanent preservation',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if ([401, 403, 429, 503].includes(response.status)) return null
      if (!response.ok) continue

      const html = await response.text()
      const text = extractMainText(html)

      // Sanity check: page must contain the person's name and have real content
      const hasName = text.toLowerCase().includes(firstName.toLowerCase()) ||
                      text.toLowerCase().includes(lastName.toLowerCase())
      if (text.length >= MIN_TEXT_LENGTH && hasName) {
        return { url, text }
      }
    } catch {
      // Timeout or network error — try next pattern
      continue
    }
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { processed: 0, fetched: 0, blocked: 0, no_domain: 0, failed: 0 }
  const startTime = Date.now()

  // Only process profiles that have a source domain (new profiles going forward)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, middle_name, obituary_source_domain')
    .not('obituary_source_domain', 'is', null)
    .is('obituary_text', null)
    .eq('needs_review', true)
    .limit(BATCH_SIZE)

  if (error || !profiles?.length) {
    return new Response(
      JSON.stringify({ message: 'No profiles pending text fetch', ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  for (const profile of profiles) {
    results.processed++

    const slug = nameToSlug(profile.first_name, profile.last_name, profile.middle_name)
    const candidates = candidateUrls(profile.obituary_source_domain, slug)

    const result = await fetchObituaryText(candidates, profile.first_name, profile.last_name)

    if (!result) {
      results.failed++
      continue
    }

    await supabase.from('profiles').update({
      obituary_text: result.text,
      // If we resolved to the actual page URL, update it
      obituary_url: result.url,
    }).eq('id', profile.id)

    results.fetched++

    // Small delay between profiles to be respectful
    await new Promise(r => setTimeout(r, 300))
  }

  await supabase.from('ingestion_log').insert({
    source: 'fetch_obituary_text',
    profiles_found: results.processed,
    profiles_created: results.fetched,
    profiles_skipped: results.blocked + results.no_domain,
    errors: results.failed,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `Fetched full text for ${results.fetched}/${results.processed} profiles`,
  })

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
