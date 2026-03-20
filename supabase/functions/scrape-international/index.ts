import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * International sources scraper.
 *
 * Tier 1 — English-speaking countries with accessible public death records.
 * See upgrade prompt for full source list and implementation notes.
 *
 * Implementation approach:
 * - England & Wales: FreeBMD death index
 * - Ireland: IrishGenealogy.ie civil registration
 * - Australia: NSW/VIC BDM registries
 * - New Zealand: NZ BDM historical records
 * - Canada: Ontario vital statistics
 *
 * For Tier 3 (non-English): records are passed to AI enrichment which handles
 * translation automatically via Claude with a translation instruction prepended.
 *
 * TODO: Implement per-country adapters as public APIs are confirmed accessible.
 */

interface InternationalRecord {
  first_name: string;
  last_name: string;
  birth_year?: number;
  death_year?: number;
  country: string;
  country_code: string;
  jurisdiction?: string;
  city?: string;
  district?: string;
  source_id?: string;
  primary_language?: string;
}

// FreeBMD — England & Wales death index
// https://www.freebmd.org.uk — publicly accessible, pageable
async function scrapeEnglandWales(limit = 100): Promise<InternationalRecord[]> {
  // TODO: FreeBMD has a CGI search interface; scraping requires respecting rate limits
  // and their terms of service. Implement with polite 2-second delays between requests.
  // Fields available: Surname, First name, Age/Year of birth, Quarter, Year, District.
  console.log("FreeBMD (England & Wales) scraper: adapter pending");
  return [];
}

// IrishGenealogy.ie — civil registration records
// https://www.irishgenealogy.ie/en/ — free public API
async function scrapeIreland(limit = 100): Promise<InternationalRecord[]> {
  // TODO: IrishGenealogy.ie has a JSON API for civil registration records
  // https://civilrecords.irishgenealogy.ie/churchrecords/images-civil-deaths.jsp
  // Deaths from 1864 onward; recent deaths have privacy restrictions.
  console.log("Ireland civil registration scraper: adapter pending");
  return [];
}

// Australia — NSW BDM
async function scrapeAustralia(limit = 100): Promise<InternationalRecord[]> {
  // TODO: NSW BDM has a publicly searchable database
  // https://www.bdm.nsw.gov.au/pages/deaths/search-deaths.html
  // VIC BDM is similar. Start with NSW as it has the most accessible interface.
  console.log("Australia BDM scraper: adapter pending");
  return [];
}

// New Zealand BDM
async function scrapeNewZealand(limit = 100): Promise<InternationalRecord[]> {
  // TODO: NZ BDM historical records
  // https://www.bdmhistoricalrecords.dia.govt.nz
  // Recent records have privacy restrictions (typically 50+ years for deaths)
  console.log("New Zealand BDM scraper: adapter pending");
  return [];
}

const COUNTRY_ADAPTERS: Record<string, {
  fn: (limit: number) => Promise<InternationalRecord[]>;
  country: string;
  country_code: string;
  annual_deaths: number;
}> = {
  "GB-ENG": { fn: scrapeEnglandWales, country: "England & Wales", country_code: "GB", annual_deaths: 600000 },
  "IE": { fn: scrapeIreland, country: "Ireland", country_code: "IE", annual_deaths: 32000 },
  "AU": { fn: scrapeAustralia, country: "Australia", country_code: "AU", annual_deaths: 170000 },
  "NZ": { fn: scrapeNewZealand, country: "New Zealand", country_code: "NZ", annual_deaths: 35000 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const body = await req.json().catch(() => ({}));
  const countryCodes: string[] = body.countries ?? Object.keys(COUNTRY_ADAPTERS);

  const startTime = Date.now();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const code of countryCodes) {
    const adapter = COUNTRY_ADAPTERS[code];
    if (!adapter) { skipped++; continue; }

    try {
      const records = await adapter.fn(200);

      for (const record of records) {
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
            country_of_death: record.country,
            primary_language: record.primary_language ?? "English",
            record_jurisdiction: record.jurisdiction ?? record.country,
            auto_ingested: true,
            ingestion_source: "import",
            needs_review: true,
            privacy: "public",
            ...(record.source_id && { familysearch_id: record.source_id }),
          })
          .select("id")
          .single();

        if (error || !profile) { errors++; continue; }

        if (record.city || record.district) {
          await supabase.from("profile_locations").insert({
            profile_id: profile.id,
            location_type: "lived",
            city: record.city ?? record.district ?? null,
            county: record.district ?? null,
            country: record.country,
            country_code: record.country_code,
            is_current: true,
          });
        }

        created++;
      }
    } catch (e) {
      console.error(`Error scraping ${code}:`, e);
      errors++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await supabase.from("ingestion_log").insert({
    source: "scrape-international",
    profiles_found: created + skipped,
    profiles_created: created,
    profiles_skipped: skipped,
    errors,
    duration_seconds: duration,
    notes: `Countries attempted: ${countryCodes.join(", ")}`,
  });

  return new Response(
    JSON.stringify({ created, skipped, errors, duration_seconds: duration }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
