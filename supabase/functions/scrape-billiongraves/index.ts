import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseDateSafe, extractYearFromDate, corsHeaders } from '../_shared/helpers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const BG_API_KEY = Deno.env.get('BILLIONGRAVES_API_KEY')
  if (!BG_API_KEY) {
    return new Response(JSON.stringify({ error: 'BILLIONGRAVES_API_KEY not set' }), { status: 500 })
  }

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  for (let page = 0; page < 5; page++) {
    try {
      const response = await fetch(
        `https://billiongraves.com/api/search/record?api_key=${BG_API_KEY}&rows=50&start=${page * 50}&sort=date_added+desc`,
        { headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' }, signal: AbortSignal.timeout(10000) }
      )
      if (!response.ok) { results.errors++; continue }

      const data = await response.json()
      const records = data.results || []
      results.found += records.length

      for (const record of records) {
        const bgId = String(record.id || '')
        if (!bgId) { results.skipped++; continue }

        const bgUrl = `https://billiongraves.com/grave/${record.slug || bgId}`
        const { data: existing } = await supabase.from('profiles').select('id').eq('obituary_url', bgUrl).maybeSingle()
        if (existing) { results.skipped++; continue }

        const firstName = (record.first_name || '').trim()
        const lastName = (record.last_name || '').trim()
        if (!firstName || !lastName) { results.skipped++; continue }

        const birthDate = parseDateSafe(record.birth_date)
        const deathDate = parseDateSafe(record.death_date)

        const { data: profile, error } = await supabase.from('profiles').insert({
          first_name: firstName, last_name: lastName,
          middle_name: record.middle_name || null, maiden_name: record.maiden_name || null,
          birth_date: birthDate, birth_year: extractYearFromDate(birthDate),
          death_date: deathDate, death_year: extractYearFromDate(deathDate),
          obituary_source: 'BillionGraves', obituary_url: bgUrl,
          auto_ingested: true, ingestion_source: 'billiongraves',
          ingestion_confidence: 0.80, privacy: 'public',
        }).select('id').single()

        if (error || !profile) { results.errors++; continue }

        if (record.cemetery_name || record.latitude) {
          await supabase.from('profile_locations').insert({
            profile_id: profile.id, location_type: 'buried',
            cemetery_name: record.cemetery_name || null,
            city: record.city || null, state_abbreviation: record.state || null,
            country: record.country || 'USA',
            latitude: record.latitude || null, longitude: record.longitude || null,
          })

          if (record.latitude && record.longitude) {
            await supabase.from('geo_pins').insert({
              profile_id: profile.id, pin_type: 'buried',
              label: `Buried at ${record.cemetery_name || 'cemetery'}`,
              city: record.city || null, state_province: record.state || null,
              latitude: record.latitude, longitude: record.longitude,
              privacy: 'public',
            })
          }
        }

        results.created++
      }

      await new Promise(r => setTimeout(r, 300))
    } catch { results.errors++ }
  }

  await supabase.from('ingestion_log').insert({
    source: 'billiongraves', profiles_found: results.found,
    profiles_created: results.created, profiles_skipped: results.skipped,
    errors: results.errors, duration_seconds: Math.round((Date.now() - startTime) / 1000),
  })

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
