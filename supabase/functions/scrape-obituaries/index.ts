import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseNameParts, parseDateSafe, extractYearFromDate, extractLocationFromText, cleanText, corsHeaders } from '../_shared/helpers.ts'

const FEEDS = [
  'https://www.obituaries.com/rss/recent',
  'https://www.obituaries.com/rss/today',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  for (const feedUrl of FEEDS) {
    try {
      const response = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' },
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) { results.errors++; continue }

      const xml = await response.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
      results.found += items.length

      for (const item of items) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                      item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

        if (!title || !link) { results.skipped++; continue }

        const { data: existing } = await supabase.from('profiles').select('id').eq('obituary_url', link).maybeSingle()
        if (existing) { results.skipped++; continue }

        const { firstName, lastName, middleName } = parseNameParts(title)
        if (!firstName || !lastName) { results.skipped++; continue }

        const deathDate = parseDateSafe(pubDate)
        const { city, stateAbbr } = extractLocationFromText(description)

        const { data: profile, error } = await supabase.from('profiles').insert({
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          death_date: deathDate,
          death_year: extractYearFromDate(deathDate),
          personality_summary: cleanText(description, 500),
          obituary_text: cleanText(description, 2000),
          obituary_source: 'Obituaries.com',
          obituary_url: link,
          auto_ingested: true,
          ingestion_source: 'obituaries_com',
          ingestion_confidence: 0.70,
          privacy: 'public',
        }).select('id').single()

        if (error || !profile) { results.errors++; continue }

        if (city && stateAbbr) {
          await supabase.from('profile_locations').insert({
            profile_id: profile.id, location_type: 'lived',
            city, state_abbreviation: stateAbbr, is_current: true,
          })
        }

        results.created++
      }
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

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
