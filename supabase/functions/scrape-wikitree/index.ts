import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseDateSafe, extractYearFromDate, corsHeaders } from '../_shared/helpers.ts'

/**
 * scrape-wikitree
 *
 * Uses the WikiTree public searchPerson API to discover deceased people.
 * No auth required. Rotates through common surnames daily so we cover
 * different name pools over time without hammering any one query.
 *
 * WikiTree has ~30M profiles. Most are deceased historical records.
 * Data quality: high — community-curated genealogy data.
 */

const WIKITREE_API = 'https://api.wikitree.com/api.php'

// Common surnames rotated daily — mix of US, UK, European, and global
const SURNAME_GROUPS: string[][] = [
  ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'],
  ['Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Hernandez'],
  ['Anderson', 'Taylor', 'Thomas', 'Jackson', 'White'],
  ['Harris', 'Martin', 'Thompson', 'Robinson', 'Clark'],
  ['Lewis', 'Walker', 'Hall', 'Allen', 'Young'],
  ['King', 'Wright', 'Scott', 'Green', 'Baker'],
  ['Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts'],
  ['Turner', 'Phillips', 'Campbell', 'Parker', 'Evans'],
  ['Edwards', 'Collins', 'Stewart', 'Morris', 'Rogers'],
  ['Murphy', 'Cook', 'Morgan', 'Peterson', 'Cooper'],
  ['Reed', 'Bailey', 'Bell', 'Gonzalez', 'Butler'],
  ['Ward', 'Cox', 'Diaz', 'Richardson', 'Wood'],
  ['Watson', 'Brooks', 'Kelly', 'Sanders', 'Price'],
  ['Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson'],
  ['Coleman', 'Jenkins', 'Perry', 'Powell', 'Long'],
  ['Patterson', 'Hughes', 'Flores', 'Washington', 'Butler'],
  ['Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander'],
  ['Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers'],
  ['Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace'],
  ['West', 'Cole', 'Jordan', 'Owens', 'Reynolds'],
  ['Fischer', 'Müller', 'Schneider', 'Weber', 'Meyer'],
  ['Dubois', 'Dupont', 'Bernard', 'Moreau', 'Laurent'],
  ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano'],
  ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Christensen'],
]

const FIELDS = [
  'Id', 'Name', 'FirstName', 'MiddleName', 'LastNameAtBirth', 'LastNameCurrent',
  'Nicknames', 'BirthDate', 'DeathDate', 'BirthLocation', 'DeathLocation',
  'BirthYear', 'DeathYear', 'Gender', 'IsLiving', 'Father', 'Mother', 'Spouses',
].join(',')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let body: { group_index?: number; limit_per_name?: number } = {}
  try { body = await req.json() } catch {}

  // Rotate surname group daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const groupIndex = body.group_index ?? (dayOfYear % SURNAME_GROUPS.length)
  const surnames = SURNAME_GROUPS[groupIndex]
  const limitPerName = body.limit_per_name ?? 50

  const results = { found: 0, created: 0, skipped: 0, errors: 0, surnames: surnames.join(', ') }
  const startTime = Date.now()

  for (const lastName of surnames) {
    try {
      const params = new URLSearchParams({
        action: 'searchPerson',
        LastName: lastName,
        is_living: '0',
        limit: String(limitPerName),
        fields: FIELDS,
        format: 'json',
      })

      const response = await fetch(`${WIKITREE_API}?${params}`, {
        headers: { 'User-Agent': 'Eternaflame Memorial Index (eternaflame.org)' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) { results.errors++; continue }

      const data = await response.json()
      // searchPerson returns an array; first element has a "matches" key
      const matches: Record<string, unknown>[] = data?.[0]?.matches ?? []
      results.found += matches.length

      for (const wt of matches) {
        try {
          // Skip living people (extra guard)
          if (wt.IsLiving === 1 || wt.IsLiving === '1') { results.skipped++; continue }

          const wtId = String(wt.Name || wt.Id || '')
          if (!wtId) { results.skipped++; continue }

          const wtUrl = `https://www.wikitree.com/wiki/${wtId}`

          // Dedupe by WikiTree URL
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('obituary_url', wtUrl)
            .maybeSingle()
          if (existing) { results.skipped++; continue }

          const firstName = String(wt.FirstName ?? '').trim()
          const lastNameBirth = String(wt.LastNameAtBirth ?? wt.LastNameCurrent ?? lastName).trim()
          if (!firstName || !lastNameBirth) { results.skipped++; continue }

          const birthDate = parseDateSafe(String(wt.BirthDate ?? ''))
          const deathDate = parseDateSafe(String(wt.DeathDate ?? ''))
          const birthYear = (wt.BirthYear as number | null) || extractYearFromDate(birthDate)
          const deathYear = (wt.DeathYear as number | null) || extractYearFromDate(deathDate)

          // Skip if no death year at all — likely incomplete record
          if (!deathYear) { results.skipped++; continue }

          const gender = String(wt.Gender ?? '').toLowerCase()

          const { data: profile, error } = await supabase.from('profiles').insert({
            first_name: firstName,
            last_name: lastNameBirth,
            middle_name: String(wt.MiddleName ?? '').trim() || null,
            nickname: String(wt.Nicknames ?? '').trim() || null,
            birth_date: birthDate,
            birth_year: birthYear,
            death_date: deathDate,
            death_year: deathYear,
            gender: gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'unknown',
            obituary_source: 'WikiTree',
            obituary_url: wtUrl,
            auto_ingested: true,
            ingestion_source: 'wikidata', // reuse existing enum value
            ingestion_confidence: 0.90,
            privacy: 'public',
          }).select('id').single()

          if (error || !profile) { results.errors++; continue }

          const pid = profile.id
          const locationInserts = []

          if (wt.BirthLocation) {
            const parts = String(wt.BirthLocation).split(',').map((s: string) => s.trim())
            locationInserts.push({
              profile_id: pid,
              location_type: 'born',
              city: parts[0] || null,
              state_province: parts[1] || null,
              country: parts[parts.length - 1] || null,
            })
          }

          if (wt.DeathLocation) {
            const parts = String(wt.DeathLocation).split(',').map((s: string) => s.trim())
            locationInserts.push({
              profile_id: pid,
              location_type: 'died',
              city: parts[0] || null,
              state_province: parts[1] || null,
              country: parts[parts.length - 1] || null,
            })
          }

          if (locationInserts.length > 0) {
            await supabase.from('profile_locations').insert(locationInserts)
          }

          // Spouse connections
          if (wt.Spouses && typeof wt.Spouses === 'object') {
            const familyRows = Object.values(wt.Spouses as Record<string, { FirstName?: string; LastNameAtBirth?: string; LastNameCurrent?: string }>)
              .filter((s) => s.FirstName && (s.LastNameAtBirth || s.LastNameCurrent))
              .map((s) => ({
                profile_id: pid,
                relation_type: 'spouse',
                name_only: `${s.FirstName} ${s.LastNameAtBirth || s.LastNameCurrent}`.trim(),
                name_normalized: `${s.FirstName} ${s.LastNameAtBirth || s.LastNameCurrent}`.trim().toLowerCase(),
                connection_source: 'record_match',
                connection_confidence: 0.90,
              }))
            if (familyRows.length > 0) {
              await supabase.from('family_connections').insert(familyRows)
            }
          }

          results.created++
        } catch (e) {
          console.error('Row error:', e)
          results.errors++
        }
      }

      // Polite delay between surname queries
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error(`Error fetching surname ${lastName}:`, e)
      results.errors++
    }
  }

  await supabase.from('ingestion_log').insert({
    source: 'wikitree',
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `Surnames: ${results.surnames}`,
  })

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
