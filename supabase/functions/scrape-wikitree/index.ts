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

  for (let page = 0; page < 5; page++) {
    try {
      const params = new URLSearchParams({
        action: 'getWatchlist', onlyLiving: '0', excludeLiving: '1',
        order: 'date', limit: '50', start: String(page * 50), format: 'json',
        fields: 'Id,Name,FirstName,LastName,MiddleName,Nicknames,BirthDate,DeathDate,BirthLocation,DeathLocation,BirthYear,DeathYear,Spouses',
      })

      const response = await fetch(`https://api.wikitree.com/api.php?${params}`, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' },
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) { results.errors++; continue }

      const data = await response.json()
      const profiles = data[0]?.profile || []
      results.found += profiles.length

      for (const wt of profiles) {
        const wtId = wt.Name || wt.Id
        if (!wtId) { results.skipped++; continue }

        const wtUrl = `https://www.wikitree.com/wiki/${wtId}`
        const { data: existing } = await supabase.from('profiles').select('id').eq('obituary_url', wtUrl).maybeSingle()
        if (existing) { results.skipped++; continue }

        const firstName = (wt.FirstName || '').trim()
        const lastName = (wt.LastName || '').trim()
        if (!firstName || !lastName) { results.skipped++; continue }

        const birthDate = parseDateSafe(wt.BirthDate)
        const deathDate = parseDateSafe(wt.DeathDate)

        const { data: profile, error } = await supabase.from('profiles').insert({
          first_name: firstName, last_name: lastName,
          middle_name: wt.MiddleName || null, nickname: wt.Nicknames || null,
          birth_date: birthDate, birth_year: wt.BirthYear || extractYearFromDate(birthDate),
          death_date: deathDate, death_year: wt.DeathYear || extractYearFromDate(deathDate),
          obituary_source: 'WikiTree', obituary_url: wtUrl,
          auto_ingested: true, ingestion_source: 'wikidata',
          ingestion_confidence: 0.90, privacy: 'public',
        }).select('id').single()

        if (error || !profile) { results.errors++; continue }

        if (wt.BirthLocation) {
          const parts = wt.BirthLocation.split(',').map((s: string) => s.trim())
          await supabase.from('profile_locations').insert({
            profile_id: profile.id, location_type: 'born',
            city: parts[0] || null, state_province: parts[1] || null,
            country: parts[parts.length - 1] || 'USA',
          })
        }

        if (wt.DeathLocation) {
          const parts = wt.DeathLocation.split(',').map((s: string) => s.trim())
          await supabase.from('profile_locations').insert({
            profile_id: profile.id, location_type: 'died',
            city: parts[0] || null, state_province: parts[1] || null,
            country: parts[parts.length - 1] || 'USA',
          })
        }

        if (wt.Spouses) {
          const familyInserts = Object.values(wt.Spouses as Record<string, { FirstName?: string; LastName?: string }>)
            .filter((s) => s.FirstName && s.LastName)
            .map((s) => ({
              profile_id: profile.id, relation_type: 'spouse',
              name_only: `${s.FirstName} ${s.LastName}`,
              name_normalized: `${s.FirstName} ${s.LastName}`.toLowerCase(),
              connection_source: 'record_match', connection_confidence: 0.90,
            }))
          if (familyInserts.length > 0) {
            await supabase.from('family_connections').insert(familyInserts)
          }
        }

        results.created++
      }

      await new Promise(r => setTimeout(r, 500))
    } catch { results.errors++ }
  }

  await supabase.from('ingestion_log').insert({
    source: 'wikitree', profiles_found: results.found,
    profiles_created: results.created, profiles_skipped: results.skipped,
    errors: results.errors, duration_seconds: Math.round((Date.now() - startTime) / 1000),
  })

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
