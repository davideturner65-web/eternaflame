import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/helpers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
  const results = { processed: 0, enriched: 0, errors: 0 }
  const BATCH_SIZE = 10

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, obituary_text')
    .eq('ai_enriched', false)
    .not('obituary_text', 'is', null)
    .limit(BATCH_SIZE)

  if (error || !profiles?.length) {
    return new Response(JSON.stringify({ message: 'No profiles to enrich', ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  for (const profile of profiles) {
    results.processed++
    try {
      const prompt = `You are helping build Eternaflame — a permanent memorial platform ensuring no human being is forgotten. Enrich this profile from the obituary text below.

Return ONLY valid JSON with no markdown, no backticks, no explanation:

{
  "biography": "A warm, human-voiced 2-3 paragraph life story in third person. Write as a story about a person, not a summary. Use their name.",
  "locations": [{ "location_type": "born|raised|lived|worked|died|buried", "city": "", "state_abbreviation": "", "country": "USA" }],
  "occupations": [{ "job_title": "", "employer_name": "", "industry": "", "start_year": null, "end_year": null, "is_primary_career": true, "notes": "" }],
  "education": [{ "institution_name": "", "institution_type": "high_school|university|trade_school|other", "graduation_year": null, "degree": "" }],
  "military": [{ "branch": "", "rank": "", "conflict": "", "service_start_year": null, "service_end_year": null }],
  "affiliations": [{ "affiliation_type": "church|fraternal|civic|veteran|other", "organization_name": "", "denomination": "" }],
  "family_connections": [{ "relation_type": "spouse|child|parent|sibling|grandchild|grandparent", "name_only": "", "surviving": true }],
  "interests": [],
  "birth_year": null,
  "death_year": null,
  "age_at_death": null,
  "gender": "male|female|unknown"
}

Only extract what is clearly stated. Do not invent. Omit unknown fields.

Obituary text:
${profile.obituary_text}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) { results.errors++; continue }

      const aiData = await response.json()
      const rawText = aiData.content?.[0]?.text || ''

      let extracted: Record<string, unknown>
      try {
        extracted = JSON.parse(rawText.replace(/```json|```/g, '').trim())
      } catch {
        results.errors++
        continue
      }

      await supabase.from('profiles').update({
        biography: extracted.biography || null,
        birth_year: extracted.birth_year || null,
        death_year: extracted.death_year || null,
        age_at_death: extracted.age_at_death || null,
        gender: extracted.gender || null,
        interests: extracted.interests || [],
        ai_enriched: true,
        needs_review: false,
      }).eq('id', profile.id)

      const inserts: Promise<unknown>[] = []

      const locations = extracted.locations as { location_type: string; city?: string; state_abbreviation?: string; country?: string }[] | undefined
      if (locations?.length) {
        inserts.push(supabase.from('profile_locations').insert(
          locations.map(l => ({ ...l, profile_id: profile.id }))
        ))
      }

      const occupations = extracted.occupations as { job_title?: string; employer_name?: string; industry?: string; is_primary_career?: boolean; notes?: string }[] | undefined
      if (occupations?.length) {
        inserts.push(supabase.from('profile_occupations').insert(
          occupations.map(o => ({
            ...o,
            employer_name_normalized: (o.employer_name || '').toLowerCase(),
            job_title_normalized: (o.job_title || '').toLowerCase(),
            profile_id: profile.id,
          }))
        ))
      }

      const education = extracted.education as { institution_name?: string; institution_type?: string; graduation_year?: number; degree?: string }[] | undefined
      if (education?.length) {
        inserts.push(supabase.from('profile_education').insert(
          education.map(e => ({
            ...e,
            institution_name_normalized: (e.institution_name || '').toLowerCase(),
            profile_id: profile.id,
          }))
        ))
      }

      const military = extracted.military as { branch?: string; rank?: string; conflict?: string; service_start_year?: number; service_end_year?: number }[] | undefined
      if (military?.length) {
        inserts.push(supabase.from('profile_military').insert(
          military.map(m => ({ ...m, profile_id: profile.id }))
        ))
      }

      const affiliations = extracted.affiliations as { affiliation_type?: string; organization_name?: string; denomination?: string }[] | undefined
      if (affiliations?.length) {
        inserts.push(supabase.from('profile_affiliations').insert(
          affiliations.map(a => ({
            ...a,
            organization_name_normalized: (a.organization_name || '').toLowerCase(),
            profile_id: profile.id,
          }))
        ))
      }

      const familyConnections = extracted.family_connections as { relation_type?: string; name_only?: string; surviving?: boolean }[] | undefined
      if (familyConnections?.length) {
        inserts.push(supabase.from('family_connections').insert(
          familyConnections.map(f => ({
            ...f,
            name_normalized: (f.name_only || '').toLowerCase(),
            connection_source: 'ai_inferred',
            connection_confidence: 0.80,
            profile_id: profile.id,
          }))
        ))
      }

      await Promise.all(inserts)
      results.enriched++

    } catch (err) {
      console.error('Enrichment error for profile', profile.id, err)
      results.errors++
      await supabase.from('profiles').update({ needs_review: true }).eq('id', profile.id)
    }
  }

  await supabase.from('ingestion_log').insert({
    source: 'ai_enrichment',
    profiles_found: results.processed,
    profiles_created: results.enriched,
    errors: results.errors,
    notes: `Enriched ${results.enriched} profiles with AI`,
  })

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
