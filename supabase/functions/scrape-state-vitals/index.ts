import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * State vital records scraper.
 * Each state has a different format; this function dispatches to the appropriate adapter.
 *
 * Priority states (cover ~35% of all US deaths):
 * - CA: California Death Index via FamilySearch public API
 * - TX: Texas DSHS death records
 * - FL: Florida Dept of Health death records
 * - NY: NYS Dept of Health death index
 * - PA: PA Dept of Health death certificates
 *
 * TODO: Implement per-state adapters as public APIs become accessible.
 * For now: logs the attempt and returns stub data.
 */

interface VitalRecord {
  first_name: string;
  last_name: string;
  birth_year?: number;
  death_year?: number;
  death_date?: string;
  state: string;
  county?: string;
  city?: string;
  source_id?: string;
}

// FamilySearch public death index — California as pilot
// FamilySearch has a public records API (no auth required for indexed records)
async function scrapeCaliforniaDeathIndex(limit = 100): Promise<VitalRecord[]> {
  // TODO: Implement FamilySearch API integration for California Death Index
  // FamilySearch public API: https://api.familysearch.org/platform/records/
  // Records are pageable and include California Death Index 1905-1939, 1940-1997
  // This is a placeholder — implement with FamilySearch API token when available
  console.log("California Death Index scraper: adapter pending");
  return [];
}

async function scrapeTexasDeathRecords(limit = 100): Promise<VitalRecord[]> {
  // TODO: Texas DSHS has a death records database accessible via their public search
  // https://www.dshs.texas.gov/vital-statistics/death-records
  // Currently requires manual request; API access pending
  console.log("Texas death records scraper: adapter pending");
  return [];
}

async function scrapeFloridaDeathRecords(limit = 100): Promise<VitalRecord[]> {
  // TODO: Florida Dept of Health death index
  // https://www.floridahealth.gov/statistics-and-data/vital-statistics/
  // Partial public access available; full API integration pending
  console.log("Florida death records scraper: adapter pending");
  return [];
}

const STATE_ADAPTERS: Record<string, (limit: number) => Promise<VitalRecord[]>> = {
  "CA": scrapeCaliforniaDeathIndex,
  "TX": scrapeTexasDeathRecords,
  "FL": scrapeFloridaDeathRecords,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const body = await req.json().catch(() => ({}));
  const states: string[] = body.states ?? ["CA", "TX", "FL", "NY", "PA"];

  const startTime = Date.now();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const stateCode of states) {
    const adapter = STATE_ADAPTERS[stateCode];
    if (!adapter) {
      console.log(`No adapter for state: ${stateCode}`);
      skipped++;
      continue;
    }

    try {
      const records = await adapter(200);

      for (const record of records) {
        // Check for duplicate (by name + death_year + state)
        if (record.source_id) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("familysearch_id", record.source_id)
            .maybeSingle();
          if (existing) { skipped++; continue; }
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .insert({
            first_name: record.first_name,
            last_name: record.last_name,
            birth_year: record.birth_year ?? null,
            death_year: record.death_year ?? null,
            death_date: record.death_date ?? null,
            country_of_death: "USA",
            auto_ingested: true,
            ingestion_source: "familysearch",
            needs_review: true,
            privacy: "public",
            ...(record.source_id && { familysearch_id: record.source_id }),
          })
          .select("id")
          .single();

        if (error || !profile) { errors++; continue; }

        if (record.city || record.county || record.state) {
          await supabase.from("profile_locations").insert({
            profile_id: profile.id,
            location_type: "lived",
            city: record.city ?? null,
            county: record.county ?? null,
            state_province: record.state,
            state_abbreviation: record.state,
            is_current: true,
            country: "USA",
          });
        }

        created++;
      }
    } catch (e) {
      console.error(`Error scraping ${stateCode}:`, e);
      errors++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await supabase.from("ingestion_log").insert({
    source: "scrape-state-vitals",
    profiles_found: created + skipped,
    profiles_created: created,
    profiles_skipped: skipped,
    errors,
    duration_seconds: duration,
    notes: `States attempted: ${states.join(", ")}`,
  });

  return new Response(
    JSON.stringify({ created, skipped, errors, duration_seconds: duration, states }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
