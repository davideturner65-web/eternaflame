import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseDateSafe, extractYearFromDate, corsHeaders } from '../_shared/helpers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  let offset = 0
  try { const body = await req.json(); offset = body.offset || 0 } catch {}

  const PAGES_PER_RUN = 10
  const PAGE_SIZE = 20

  for (let page = 0; page < PAGES_PER_RUN; page++) {
    try {
      const params = new URLSearchParams({
        orderby: 'dateAdded', rows: String(PAGE_SIZE),
        offset: String(offset + page * PAGE_SIZE), memorialtype: 'deceased',
      })

      const response = await fetch(`https://www.findagrave.com/memorial/search?${params}`, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) { results.errors++; continue }

      const html = await response.text()
      const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)

      for (const match of jsonLdMatches) {
        try {
          const data = JSON.parse(match[1])
          if (data['@type'] !== 'Person') continue

          const fagId = data.url?.split('/memorial/')?.[1]?.split('/')?.[0]
          if (!fagId) continue

          const { data: existing } = await supabase.from('profiles').select('id').eq('findagrave_id', fagId).maybeSingle()
          if (existing) { results.skipped++; continue }

          const nameParts = (data.name || '').trim().split(/\s+/).filter(Boolean)
          if (nameParts.length < 2) { results.skipped++; continue }

          results.found++
          const birthDate = parseDateSafe(data.birthDate)
          const deathDate = parseDateSafe(data.deathDate)
          const address = data.address || {}
          const city = address.addressLocality || null
          const stateAbbr = address.addressRegion || null
          const country = address.addressCountry || 'USA'
          const cemetery = data.memberOf?.name || null

          const { data: profile, error } = await supabase.from('profiles').insert({
            first_name: nameParts[0],
            last_name: nameParts[nameParts.length - 1],
            middle_name: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null,
            birth_date: birthDate, birth_year: extractYearFromDate(birthDate),
            death_date: deathDate, death_year: extractYearFromDate(deathDate),
            findagrave_id: fagId,
            obituary_source: 'Find A Grave', obituary_url: data.url || null,
            auto_ingested: true, ingestion_source: 'findagrave',
            ingestion_confidence: 0.85, privacy: 'public',
          }).select('id').single()

          if (error || !profile) { results.errors++; continue }

          if (city || cemetery) {
            await supabase.from('profile_locations').insert({
              profile_id: profile.id, location_type: 'buried',
              city, state_abbreviation: stateAbbr, country, cemetery_name: cemetery,
            })
          }

          results.created++
        } catch { results.errors++ }
      }

      await new Promise(r => setTimeout(r, 500))
    } catch { results.errors++ }
  }

  await supabase.from('ingestion_log').insert({
    source: 'findagrave', profiles_found: results.found,
    profiles_created: results.created, profiles_skipped: results.skipped,
    errors: results.errors, duration_seconds: Math.round((Date.now() - startTime) / 1000),
  })

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
