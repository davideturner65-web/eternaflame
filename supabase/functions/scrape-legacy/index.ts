import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseNameParts, parseDateSafe, extractYearFromDate, extractLocationFromText, cleanText, corsHeaders } from '../_shared/helpers.ts'

const STATES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'new-hampshire','new-jersey','new-mexico','new-york','north-carolina',
  'north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island',
  'south-carolina','south-dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west-virginia','wisconsin','wyoming'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  for (const state of STATES) {
    try {
      const feedUrl = `https://www.legacy.com/ns/obituaries/${state}/rss.aspx`
      const response = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' },
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) { results.errors++; continue }

      const xml = await response.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
      results.found += items.length

      for (const item of items) {
        try {
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
            death_date_approximate: true,
            death_year: extractYearFromDate(deathDate),
            personality_summary: cleanText(description, 500) || null,
            obituary_text: cleanText(description, 2000),
            obituary_source: 'Legacy.com',
            obituary_url: link,
            auto_ingested: true,
            ingestion_source: 'legacy',
            ingestion_confidence: 0.70,
            needs_review: false,
            privacy: 'public',
          }).select('id').single()

          if (error || !profile) { results.errors++; continue }

          if (city && stateAbbr) {
            await supabase.from('profile_locations').insert({
              profile_id: profile.id,
              location_type: 'lived',
              city,
              state_abbreviation: stateAbbr,
              is_current: true,
            })
          }

          results.created++
        } catch { results.errors++ }
      }

      await new Promise(r => setTimeout(r, 200))
    } catch { results.errors++ }
  }

  await supabase.from('ingestion_log').insert({
    source: 'legacy',
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
  })

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
