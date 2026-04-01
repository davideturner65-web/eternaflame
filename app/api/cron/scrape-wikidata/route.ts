import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * scrape-wikidata (Wikipedia Deaths by Year Category)
 *
 * Uses Wikipedia's Category API to list people from "Category:YYYY deaths"
 * then fetches a brief extract for each. Fast, reliable, no SPARQL timeouts.
 * Rotates through years daily. Each run processes one year category.
 */

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const WP_API = "https://en.wikipedia.org/w/api.php";

// Years to rotate through — most recent first
const YEARS = [
  2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016,
  2015, 2014, 2013, 2012, 2011, 2010, 2005, 2000, 1995, 1990,
];

// Fetch all pages in a Wikipedia category (up to limit)
async function getCategoryMembers(
  year: number,
  continueToken?: string,
  limit = 200
): Promise<{ pages: { pageid: number; title: string }[]; continueToken?: string }> {
  const params = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${year} deaths`,
    cmtype: "page",
    cmlimit: String(limit),
    cmnamespace: "0",
    format: "json",
    origin: "*",
  });
  if (continueToken) params.set("cmcontinue", continueToken);

  const res = await fetch(`${WP_API}?${params}`, {
    headers: { "User-Agent": "EternaflameBot/1.0 (https://eternaflame.org; bot@eternaflame.org)" },
  });
  if (!res.ok) throw new Error(`Category API ${res.status}`);
  const data = await res.json();

  return {
    pages: data.query?.categorymembers ?? [],
    continueToken: data.continue?.cmcontinue,
  };
}

// Fetch extracts + birth/death dates for a batch of page titles
async function getPageData(titles: string[]): Promise<Record<string, {
  extract?: string;
  birth?: string;
  death?: string;
  description?: string;
}>> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts|pageprops|categories",
    exintro: "1",
    exchars: "600",
    explaintext: "1",
    ppprop: "wikibase_item",
    titles: titles.join("|"),
    format: "json",
    origin: "*",
  });

  const res = await fetch(`${WP_API}?${params}`, {
    headers: { "User-Agent": "EternaflameBot/1.0 (https://eternaflame.org; bot@eternaflame.org)" },
  });
  if (!res.ok) return {};
  const data = await res.json();

  const result: Record<string, { extract?: string; birth?: string; death?: string; wikidata_id?: string }> = {};
  for (const page of Object.values(data.query?.pages ?? {}) as Record<string, {
    title?: string; extract?: string; pageprops?: { wikibase_item?: string };
    categories?: { title: string }[];
  }>[]) {
    if (!page.title) continue;
    const extract = page.extract ?? "";
    const wikidata_id = (page.pageprops as { wikibase_item?: string } | undefined)?.wikibase_item ?? undefined;

    // Parse birth year from categories like "Category:1945 births"
    const birthCat = page.categories?.find((c) => c.title.match(/\d{4} births/));
    const deathCat = page.categories?.find((c) => c.title.match(/\d{4} deaths/));
    const birth = birthCat?.title.match(/(\d{4})/)?.[1];
    const death = deathCat?.title.match(/(\d{4})/)?.[1];

    result[page.title] = { extract: extract || undefined, birth, death, wikidata_id };
  }
  return result;
}

// Parse "FirstName LastName" from a Wikipedia article title
function splitName(title: string): { first: string; last: string; middle: string | null } | null {
  // Strip disambiguation like "John Smith (politician)"
  const clean = title.replace(/\s*\(.*\)$/, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.length === 2) return { first: parts[0], last: parts[1], middle: null };
  return { first: parts[0], last: parts[parts.length - 1], middle: parts.slice(1, -1).join(" ") };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const yearIndex = parseInt(searchParams.get("year_index") ?? String(dayOfYear % YEARS.length));
  const year = parseInt(searchParams.get("year") ?? String(YEARS[yearIndex]));
  const continueToken = searchParams.get("continue") ?? undefined;
  const batchSize = Math.min(parseInt(searchParams.get("batch") ?? "100"), 200);

  const results = { year, found: 0, created: 0, skipped: 0, errors: 0 };
  const startTime = Date.now();

  try {
    const { pages } = await getCategoryMembers(year, continueToken, batchSize);
    results.found = pages.length;
    console.log(`Wikipedia Category:${year} deaths — ${pages.length} pages`);

    if (pages.length === 0) {
      return NextResponse.json({ ...results, message: "No pages found" });
    }

    // Fetch extracts in batches of 20 (Wikipedia API limit for extracts)
    const CHUNK = 20;
    for (let i = 0; i < pages.length; i += CHUNK) {
      const chunk = pages.slice(i, i + CHUNK);
      const titles = chunk.map((p) => p.title);

      let pageData: Record<string, { extract?: string; birth?: string; death?: string; wikidata_id?: string }> = {};
      try {
        pageData = await getPageData(titles);
      } catch (e) {
        console.error("getPageData error:", e);
      }

      for (const page of chunk) {
        try {
          const name = splitName(page.title);
          if (!name) { results.skipped++; continue; }

          const data = pageData[page.title] ?? {};
          const wikidataId = data.wikidata_id ?? null;
          const wpUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;

          // Dedupe by Wikipedia URL or wikidata_id
          const dedupeQuery = supabase.from("profiles").select("id").eq("obituary_url", wpUrl);
          const { data: existing } = await dedupeQuery.maybeSingle();
          if (existing) { results.skipped++; continue; }

          if (wikidataId) {
            const { data: existingWd } = await supabase.from("profiles").select("id").eq("wikidata_id", wikidataId).maybeSingle();
            if (existingWd) { results.skipped++; continue; }
          }

          const birthYear = data.birth ? parseInt(data.birth) : null;
          const deathYear = data.death ? parseInt(data.death) : year;
          const biography = data.extract?.trim() || null;

          const { data: profile, error } = await supabase.from("profiles").insert({
            first_name: name.first,
            last_name: name.last,
            middle_name: name.middle,
            birth_year: birthYear,
            death_year: deathYear,
            biography,
            wikidata_id: wikidataId,
            obituary_source: "Wikipedia",
            obituary_url: wpUrl,
            auto_ingested: true,
            ingestion_source: "wikidata",
            ingestion_confidence: 0.92,
            privacy: "public",
          }).select("id").single();

          if (error || !profile) {
            console.error("Insert error:", error?.message, "for", page.title);
            results.errors++;
            continue;
          }

          results.created++;
        } catch (e) {
          console.error("Row error:", e);
          results.errors++;
        }
      }

      // Polite gap between chunks
      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (e) {
    console.error("Fatal:", e);
    results.errors++;
  }

  await supabase.from("ingestion_log").insert({
    source: "wikipedia-deaths",
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `Year: ${year}, batch: ${batchSize}`,
  });

  return NextResponse.json(results);
}
