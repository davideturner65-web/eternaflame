import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/helpers.ts'

/**
 * scrape-wikidata
 *
 * Queries Wikidata SPARQL for deceased people.
 * Single lean query — no per-profile detail lookups (those time out).
 * AI enrichment will fill in the rest hourly via enrich-profiles.
 * Rotates through death-year windows daily.
 */

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

const DEATH_YEAR_WINDOWS = [
  { from: 2025, to: 2025 },
  { from: 2024, to: 2024 },
  { from: 2023, to: 2023 },
  { from: 2022, to: 2022 },
  { from: 2021, to: 2021 },
  { from: 2019, to: 2020 },
  { from: 2016, to: 2018 },
  { from: 2010, to: 2015 },
  { from: 2000, to: 2009 },
  { from: 1980, to: 1999 },
]

function buildQuery(fromYear: number, toYear: number, offset: number, limit: number): string {
  return `SELECT DISTINCT ?person ?personLabel ?birthDate ?deathDate ?genderLabel ?birthPlaceLabel ?deathPlaceLabel ?occupationLabel WHERE {
  ?person wdt:P31 wd:Q5 ;
          wdt:P570 ?deathDate .
  BIND(YEAR(?deathDate) AS ?deathYear)
  FILTER(?deathYear >= ${fromYear} && ?deathYear <= ${toYear})
  OPTIONAL { ?person wdt:P569 ?birthDate }
  OPTIONAL { ?person wdt:P21 ?gender }
  OPTIONAL { ?person wdt:P19 ?birthPlace }
  OPTIONAL { ?person wdt:P20 ?deathPlace }
  OPTIONAL { ?person wdt:P106 ?occupation }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?deathDate)
LIMIT ${limit}
OFFSET ${offset}`
}

function parseDate(val: string | undefined): string | null {
  if (!val) return null
  const m = val.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function extractYear(d: string | null): number | null {
  if (!d) return null
  const m = d.match(/(\d{4})/)
  return m ? parseInt(m[1]) : null
}

function extractQid(uri: string): string | null {
  const m = uri.match(/Q\d+$/)
  return m ? m[0] : null
}

function splitName(fullName: string): { first: string; last: string; middle: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '', middle: null }
  if (parts.length === 1) return { first: parts[0], last: parts[0], middle: null }
  if (parts.length === 2) return { first: parts[0], last: parts[1], middle: null }
  return { first: parts[0], last: parts[parts.length - 1], middle: parts.slice(1, -1).join(' ') }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let body: { window_index?: number; offset?: number; limit?: number } = {}
  try { body = await req.json() } catch {}

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const windowIndex = body.window_index ?? (dayOfYear % DEATH_YEAR_WINDOWS.length)
  const win = DEATH_YEAR_WINDOWS[windowIndex]
  const offset = body.offset ?? 0
  const limit = Math.min(body.limit ?? 100, 200)

  const results = { found: 0, created: 0, skipped: 0, errors: 0, window: `${win.from} → ${win.to}` }
  const startTime = Date.now()

  try {
    const query = buildQuery(win.from, win.to, offset, limit)
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EternaflameBot/1.0 (https://eternaflame.org; bot@eternaflame.org) memorial-indexer',
        'Accept': 'application/sparql-results+json',
      },
      signal: AbortSignal.timeout(55000),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('SPARQL error:', response.status, text.slice(0, 500))
      throw new Error(`SPARQL ${response.status}`)
    }

    const data = await response.json()
    const rows: Record<string, { value: string }>[] = data.results?.bindings ?? []
    results.found = rows.length
    console.log(`Got ${rows.length} rows from Wikidata`)

    for (const row of rows) {
      try {
        const qid = extractQid(row.person?.value ?? '')
        if (!qid) { results.skipped++; continue }

        const label = row.personLabel?.value ?? ''
        if (/^Q\d+$/.test(label)) { results.skipped++; continue }

        const { data: existing } = await supabase
          .from('profiles').select('id').eq('wikidata_id', qid).maybeSingle()
        if (existing) { results.skipped++; continue }

        const { first, last, middle } = splitName(label)
        if (!first || !last) { results.skipped++; continue }

        const birthDate = parseDate(row.birthDate?.value)
        const deathDate = parseDate(row.deathDate?.value)
        const gender = (row.genderLabel?.value ?? '').toLowerCase()
        const birthPlace = row.birthPlaceLabel?.value ?? null
        const deathPlace = row.deathPlaceLabel?.value ?? null
        const occupation = row.occupationLabel?.value ?? null

        const { data: profile, error } = await supabase.from('profiles').insert({
          first_name: first,
          last_name: last,
          middle_name: middle,
          birth_date: birthDate,
          birth_year: extractYear(birthDate),
          death_date: deathDate,
          death_year: extractYear(deathDate),
          gender: gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'unknown',
          wikidata_id: qid,
          obituary_source: 'Wikidata',
          obituary_url: `https://www.wikidata.org/wiki/${qid}`,
          auto_ingested: true,
          ingestion_source: 'wikidata',
          ingestion_confidence: 0.95,
          privacy: 'public',
        }).select('id').single()

        if (error || !profile) {
          console.error('Insert error:', error?.message)
          results.errors++
          continue
        }

        const pid = profile.id
        const locs = []
        if (birthPlace) locs.push({ profile_id: pid, location_type: 'born', city: birthPlace })
        if (deathPlace) locs.push({ profile_id: pid, location_type: 'died', city: deathPlace })
        if (locs.length > 0) await supabase.from('profile_locations').insert(locs)

        if (occupation) {
          await supabase.from('profile_occupations').insert({
            profile_id: pid, notes: occupation, is_primary_career: true,
          })
        }

        results.created++
      } catch (e) {
        console.error('Row error:', e)
        results.errors++
      }
    }
  } catch (e) {
    console.error('Fatal:', e)
    results.errors++
  }

  await supabase.from('ingestion_log').insert({
    source: 'wikidata',
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `Window: ${results.window}, offset: ${offset}`,
  })

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
