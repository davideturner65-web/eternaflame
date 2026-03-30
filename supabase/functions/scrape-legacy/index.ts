import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseNameParts, parseDateSafe, extractYearFromDate, corsHeaders } from '../_shared/helpers.ts'

// Google News RSS — obituary searches by state grouping.
// Each run processes one batch of states to stay within Supabase Edge Function timeouts.
// Rotates through all 50 states across daily runs using the day-of-year as offset.
const STATE_GROUPS: string[][] = [
  ['Arkansas','Texas','Oklahoma','Louisiana','Mississippi'],
  ['California','Oregon','Washington','Nevada','Arizona'],
  ['Florida','Georgia','Alabama','South Carolina','North Carolina'],
  ['New York','Pennsylvania','New Jersey','Connecticut','Massachusetts'],
  ['Ohio','Michigan','Indiana','Illinois','Wisconsin'],
  ['Tennessee','Kentucky','Virginia','West Virginia','Maryland'],
  ['Missouri','Kansas','Iowa','Nebraska','Minnesota'],
  ['Colorado','Utah','Idaho','Montana','Wyoming'],
  ['Alaska','Hawaii','New Mexico','North Dakota','South Dakota'],
  ['Delaware','Rhode Island','Vermont','New Hampshire','Maine'],
]

function extractNameFromTitle(title: string): string {
  // Patterns: "Obituary | John Smith of City, ST"
  //           "John Smith Obituary - Source"
  //           "John Smith - City, ST - Source"
  return title
    .replace(/obituary\s*[\|:–-]\s*/i, '')
    .replace(/\s*[\|–-]\s*.+$/, '')           // strip source/location after dash
    .replace(/\s+of\s+.+$/i, '')              // strip "of City, State"
    .replace(/,\s*[A-Z]{2}\s*$/,'')           // strip trailing ", ST"
    .replace(/\s+obituary\s*$/i, '')          // strip trailing "Obituary"
    .trim()
}

function extractLocationFromTitle(title: string): { city: string | null; stateAbbr: string | null } {
  // "of Little Rock, Arkansas" or "of Little Rock, AR"
  const ofMatch = title.match(/\bof\s+([A-Z][a-zA-Z\s]+),\s*([A-Za-z]{2,})\b/i)
  if (ofMatch) {
    const maybeState = ofMatch[2].trim()
    const stateAbbr = STATE_ABBR_MAP[maybeState.toLowerCase()] ?? (maybeState.length === 2 ? maybeState.toUpperCase() : null)
    return { city: ofMatch[1].trim(), stateAbbr }
  }
  // "City, ST" pattern anywhere in title
  const cityState = title.match(/\b([A-Z][a-zA-Z\s]{2,}),\s*([A-Z]{2})\b/)
  if (cityState) return { city: cityState[1].trim(), stateAbbr: cityState[2] }
  return { city: null, stateAbbr: null }
}

const STATE_ABBR_MAP: Record<string, string> = {
  alabama:'AL', alaska:'AK', arizona:'AZ', arkansas:'AR', california:'CA',
  colorado:'CO', connecticut:'CT', delaware:'DE', florida:'FL', georgia:'GA',
  hawaii:'HI', idaho:'ID', illinois:'IL', indiana:'IN', iowa:'IA', kansas:'KS',
  kentucky:'KY', louisiana:'LA', maine:'ME', maryland:'MD', massachusetts:'MA',
  michigan:'MI', minnesota:'MN', mississippi:'MS', missouri:'MO', montana:'MT',
  nebraska:'NE', nevada:'NV', 'new hampshire':'NH', 'new jersey':'NJ',
  'new mexico':'NM', 'new york':'NY', 'north carolina':'NC', 'north dakota':'ND',
  ohio:'OH', oklahoma:'OK', oregon:'OR', pennsylvania:'PA', 'rhode island':'RI',
  'south carolina':'SC', 'south dakota':'SD', tennessee:'TN', texas:'TX',
  utah:'UT', vermont:'VT', virginia:'VA', washington:'WA', 'west virginia':'WV',
  wisconsin:'WI', wyoming:'WY',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results = { found: 0, created: 0, skipped: 0, errors: 0 }
  const startTime = Date.now()

  // Pick today's state group by day-of-year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const stateGroup = STATE_GROUPS[dayOfYear % STATE_GROUPS.length]

  for (const stateName of stateGroup) {
    try {
      const query = encodeURIComponent(`"obituary" ${stateName}`)
      const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
      const response = await fetch(feedUrl, {
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
          const link = item.match(/<link>(.*?)<\/link>/)?.[1]
            ?? item.match(/<link\/>(.*?)<\/link>/)?.[1] ?? ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
          const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? 'Google News'

          if (!rawTitle || !link) { results.skipped++; continue }
          // Skip if not clearly an obituary entry
          if (!/obituar/i.test(rawTitle) && !/\bof\s+[A-Z]/i.test(rawTitle)) {
            results.skipped++; continue
          }

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
            ingestion_source: 'legacy',
            ingestion_confidence: 0.65,
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
              state_province: stateName,
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
    source: 'legacy',
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `States: ${stateGroup.join(', ')}`,
  })

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
