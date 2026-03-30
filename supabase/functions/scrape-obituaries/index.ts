import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseNameParts, parseDateSafe, extractYearFromDate, corsHeaders } from '../_shared/helpers.ts'

// Google News RSS — broader obituary queries to catch entries not caught by state search
const FEEDS = [
  { url: 'https://news.google.com/rss/search?q="passed+away"+obituary&hl=en-US&gl=US&ceid=US:en', label: 'passed away' },
  { url: 'https://news.google.com/rss/search?q="in+loving+memory"+obituary&hl=en-US&gl=US&ceid=US:en', label: 'in loving memory' },
]

function extractNameFromTitle(title: string): string {
  return title
    .replace(/obituary\s*[\|:–-]\s*/i, '')
    .replace(/\s*[\|–-]\s*.+$/, '')
    .replace(/\s+of\s+.+$/i, '')
    .replace(/,\s*[A-Z]{2}\s*$/, '')
    .replace(/\s+obituary\s*$/i, '')
    .trim()
}

function extractLocationFromTitle(title: string): { city: string | null; stateAbbr: string | null } {
  const ofMatch = title.match(/\bof\s+([A-Z][a-zA-Z\s]+),\s*([A-Za-z]{2,})\b/i)
  if (ofMatch) {
    const s = ofMatch[2].trim()
    const stateAbbr = s.length === 2 ? s.toUpperCase() : null
    return { city: ofMatch[1].trim(), stateAbbr }
  }
  const cityState = title.match(/\b([A-Z][a-zA-Z\s]{2,}),\s*([A-Z]{2})\b/)
  if (cityState) return { city: cityState[1].trim(), stateAbbr: cityState[2] }
  return { city: null, stateAbbr: null }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  for (const feed of FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' },
        signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) { results.errors++; continue }

      const xml = await response.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
      results.found += items.length

      for (const item of items) {
        try {
          const rawTitle = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
            ?.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1') ?? ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
          const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? 'Google News'

          if (!rawTitle || !link) { results.skipped++; continue }

          const { data: existing } = await supabase.from('profiles')
            .select('id').eq('obituary_url', link).maybeSingle()
          if (existing) { results.skipped++; continue }

          const nameRaw = extractNameFromTitle(rawTitle)
          const { firstName, lastName, middleName } = parseNameParts(nameRaw)
          if (!firstName || !lastName || lastName === '—') { results.skipped++; continue }

          const { city, stateAbbr } = extractLocationFromTitle(rawTitle)
          const deathDate = parseDateSafe(pubDate)

          const { data: profile, error } = await supabase.from('profiles').insert({
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            death_date: deathDate,
            death_date_approximate: true,
            death_year: extractYearFromDate(deathDate),
            obituary_source: source,
            obituary_url: link,
            auto_ingested: true,
            ingestion_source: 'obituaries_com',
            ingestion_confidence: 0.60,
            needs_review: true,
            privacy: 'public',
          }).select('id').single()

          if (error || !profile) { results.errors++; continue }

          if (city && stateAbbr) {
            await supabase.from('profile_locations').insert({
              profile_id: profile.id,
              location_type: 'lived',
              city,
              state_abbreviation: stateAbbr,
              country: 'USA',
              is_current: true,
            })
          }

          results.created++
        } catch { results.errors++ }
      }

      await new Promise(r => setTimeout(r, 500))
    } catch { results.errors++ }
  }

  await supabase.from('ingestion_log').insert({
    source: 'obituaries_com',
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
  })

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
