import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google News RSS — obituary searches targeting funeral-home-published notices.
// These capture entries that don't appear in state-specific searches.
const FUNERAL_HOME_FEEDS = [
  { name: "Google News – funeral home", url: "https://news.google.com/rss/search?q=%22funeral+home%22+obituary&hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News – services", url: "https://news.google.com/rss/search?q=%22memorial+service%22+obituary&hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News – graveside", url: "https://news.google.com/rss/search?q=%22graveside+service%22+obituary&hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News – visitation", url: "https://news.google.com/rss/search?q=%22visitation%22+obituary&hl=en-US&gl=US&ceid=US:en" },
  { name: "Google News – survivors", url: "https://news.google.com/rss/search?q=%22survived+by%22+obituary&hl=en-US&gl=US&ceid=US:en" },
];

interface ParsedEntry {
  first_name: string;
  last_name: string;
  obituary_text: string | null;
  obituary_url: string;
  obituary_source: string;
  birth_year: number | null;
  death_year: number | null;
  city: string | null;
  state: string | null;
}

function extractNameFromTitle(title: string): string {
  return title
    .replace(/obituary\s*[\|:–-]\s*/i, "")
    .replace(/\s*[\|–-]\s*.+$/, "")
    .replace(/\s+of\s+.+$/i, "")
    .replace(/,\s*[A-Z]{2}\s*$/, "")
    .replace(/\s+obituary\s*$/i, "")
    .trim();
}

function parseNameParts(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "—" };
  const last_name = parts.pop()!;
  return { first_name: parts.join(" "), last_name };
}

function extractYear(text: string): number | null {
  const m = text.match(/\b(19[0-9]{2}|20[0-2][0-9])\b/g);
  return m ? parseInt(m[0]) : null;
}

function extractLocation(text: string): { city: string | null; state: string | null } {
  const m = text.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/);
  if (m) return { city: m[1].trim(), state: m[2] };
  return { city: null, state: null };
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRSSEntries(xml: string, sourceName: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  for (const item of items.slice(0, 50)) {
    const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ?? "";
    const desc = item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? "";

    const cleanTitle = cleanText(title);
    const cleanDesc = cleanText(desc);

    if (!cleanTitle || cleanTitle.length < 3) continue;

    // Extract clean name (strips source after pipe/dash, location, age suffix)
    const nameRaw = extractNameFromTitle(cleanTitle.split(",")[0].trim());
    if (!nameRaw) continue;

    const { first_name, last_name } = parseNameParts(nameRaw);
    // Skip entries with no real last name or a numeric last name (e.g. age "84")
    if (!first_name || !last_name || last_name === "—" || /^\d/.test(last_name)) continue;
    const loc = extractLocation(cleanDesc + " " + cleanTitle);
    const yearMatch = cleanDesc.match(/\b(19[0-9]{2}|20[0-2][0-9])\b/g);

    let birth_year: number | null = null;
    let death_year: number | null = null;
    if (yearMatch && yearMatch.length >= 2) {
      const years = yearMatch.map(Number).sort();
      birth_year = years[0];
      death_year = years[years.length - 1];
    } else if (yearMatch && yearMatch.length === 1) {
      death_year = parseInt(yearMatch[0]);
    }

    entries.push({
      first_name,
      last_name,
      obituary_text: cleanDesc.slice(0, 5000) || null,
      obituary_url: link.trim(),
      obituary_source: sourceName,
      birth_year,
      death_year,
      city: loc.city,
      state: loc.state,
    });
  }
  return entries;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const startTime = Date.now();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const feed of FUNERAL_HOME_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Eternaflame/1.0 (memorial index; contact@eternaflame.org)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { errors++; continue; }
      const xml = await res.text();
      const entries = parseRSSEntries(xml, feed.name);

      for (const entry of entries) {
        if (!entry.obituary_url) { skipped++; continue; }

        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("obituary_url", entry.obituary_url)
          .maybeSingle();

        if (existing) { skipped++; continue; }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            first_name: entry.first_name,
            last_name: entry.last_name,
            birth_year: entry.birth_year,
            death_year: entry.death_year,
            obituary_text: entry.obituary_text,
            obituary_url: entry.obituary_url,
            obituary_source: entry.obituary_source,
            auto_ingested: true,
            ingestion_source: "legacy", // reuse legacy enum value for funeral homes
            needs_review: true,
            privacy: "public",
          })
          .select("id")
          .single();

        if (profileErr || !profile) { errors++; continue; }

        if (entry.city || entry.state) {
          await supabase.from("profile_locations").insert({
            profile_id: profile.id,
            location_type: "lived",
            city: entry.city,
            state_province: entry.state,
            state_abbreviation: entry.state,
            is_current: true,
            country: "USA",
          });
        }

        created++;
      }
    } catch (e) {
      console.error(`Feed error for ${feed.name}:`, e);
      errors++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await supabase.from("ingestion_log").insert({
    source: "scrape-funeralhomes",
    profiles_found: created + skipped,
    profiles_created: created,
    profiles_skipped: skipped,
    errors,
    duration_seconds: duration,
  });

  return new Response(
    JSON.stringify({ created, skipped, errors, duration_seconds: duration }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
