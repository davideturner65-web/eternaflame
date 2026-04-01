import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const WIKITREE_API = "https://api.wikitree.com/api.php";

const SURNAME_GROUPS: string[][] = [
  ["Smith", "Johnson", "Williams", "Brown", "Jones"],
  ["Garcia", "Martinez", "Rodriguez", "Lopez", "Hernandez"],
  ["Anderson", "Taylor", "Thomas", "Jackson", "White"],
  ["Harris", "Martin", "Thompson", "Robinson", "Clark"],
  ["Lewis", "Walker", "Hall", "Allen", "Young"],
  ["King", "Wright", "Scott", "Green", "Baker"],
  ["Nelson", "Carter", "Mitchell", "Perez", "Roberts"],
  ["Turner", "Phillips", "Campbell", "Parker", "Evans"],
  ["Edwards", "Collins", "Stewart", "Morris", "Rogers"],
  ["Murphy", "Cook", "Morgan", "Peterson", "Cooper"],
  ["Reed", "Bailey", "Bell", "Gonzalez", "Butler"],
  ["Ward", "Cox", "Diaz", "Richardson", "Wood"],
  ["Watson", "Brooks", "Kelly", "Sanders", "Price"],
  ["Bennett", "Barnes", "Ross", "Henderson", "Coleman"],
  ["Jenkins", "Perry", "Powell", "Long", "Patterson"],
  ["Hughes", "Flores", "Washington", "Simmons", "Foster"],
  ["Bryant", "Alexander", "Russell", "Griffin", "Hayes"],
  ["Ford", "Hamilton", "Graham", "Sullivan", "Wallace"],
  ["West", "Cole", "Jordan", "Owens", "Reynolds"],
  ["Fischer", "Müller", "Schneider", "Weber", "Meyer"],
  ["Nielsen", "Jensen", "Hansen", "Pedersen", "Christensen"],
  ["Rossi", "Ferrari", "Esposito", "Bianchi", "Romano"],
  ["Dubois", "Dupont", "Bernard", "Moreau", "Laurent"],
  ["Park", "Kim", "Lee", "Choi", "Wilson"],
];

const FIELDS = [
  "Id", "Name", "FirstName", "MiddleName", "LastNameAtBirth", "LastNameCurrent",
  "Nicknames", "BirthDate", "DeathDate", "BirthLocation", "DeathLocation",
  "BirthYear", "DeathYear", "Gender", "IsLiving", "Spouses",
].join(",");

function parseDateSafe(val: string): string | null {
  if (!val || val === "0000-00-00") return null;
  const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function extractYear(d: string | null): number | null {
  if (!d) return null;
  const m = d.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const groupIndex = parseInt(searchParams.get("group_index") ?? String(dayOfYear % SURNAME_GROUPS.length));
  const surnames = SURNAME_GROUPS[groupIndex];
  const limitPerName = Math.min(parseInt(searchParams.get("limit_per_name") ?? "50"), 100);

  const results = { found: 0, created: 0, skipped: 0, errors: 0, surnames: surnames.join(", ") };
  const startTime = Date.now();

  for (const lastName of surnames) {
    try {
      const params = new URLSearchParams({
        action: "searchPerson",
        LastName: lastName,
        is_living: "0",
        limit: String(limitPerName),
        fields: FIELDS,
        format: "json",
      });

      const response = await fetch(`${WIKITREE_API}?${params}`, {
        headers: { "User-Agent": "EternaflameBot/1.0 (https://eternaflame.org; bot@eternaflame.org)" },
      });

      if (!response.ok) { results.errors++; continue; }

      const data = await response.json();
      const matches: Record<string, unknown>[] = data?.[0]?.matches ?? [];
      results.found += matches.length;

      for (const wt of matches) {
        try {
          if (wt.IsLiving === 1 || wt.IsLiving === "1") { results.skipped++; continue; }

          const wtId = String(wt.Name || wt.Id || "");
          if (!wtId) { results.skipped++; continue; }

          const wtUrl = `https://www.wikitree.com/wiki/${wtId}`;
          const { data: existing } = await supabase
            .from("profiles").select("id").eq("obituary_url", wtUrl).maybeSingle();
          if (existing) { results.skipped++; continue; }

          const firstName = String(wt.FirstName ?? "").trim();
          const lastNameBirth = String(wt.LastNameAtBirth ?? wt.LastNameCurrent ?? lastName).trim();
          if (!firstName || !lastNameBirth) { results.skipped++; continue; }

          const birthDate = parseDateSafe(String(wt.BirthDate ?? ""));
          const deathDate = parseDateSafe(String(wt.DeathDate ?? ""));
          const deathYear = (wt.DeathYear as number | null) || extractYear(deathDate);
          if (!deathYear) { results.skipped++; continue; }

          const gender = String(wt.Gender ?? "").toLowerCase();

          const { data: profile, error } = await supabase.from("profiles").insert({
            first_name: firstName,
            last_name: lastNameBirth,
            middle_name: String(wt.MiddleName ?? "").trim() || null,
            nickname: String(wt.Nicknames ?? "").trim() || null,
            birth_date: birthDate,
            birth_year: (wt.BirthYear as number | null) || extractYear(birthDate),
            death_date: deathDate,
            death_year: deathYear,
            gender: gender === "male" ? "male" : gender === "female" ? "female" : "unknown",
            obituary_source: "WikiTree",
            obituary_url: wtUrl,
            auto_ingested: true,
            ingestion_source: "wikidata",
            ingestion_confidence: 0.90,
            privacy: "public",
          }).select("id").single();

          if (error || !profile) { results.errors++; continue; }

          const pid = profile.id;
          const locs = [];
          if (wt.BirthLocation) {
            const parts = String(wt.BirthLocation).split(",").map((s: string) => s.trim());
            locs.push({ profile_id: pid, location_type: "born", city: parts[0] || null, state_province: parts[1] || null, country: parts[parts.length - 1] || null });
          }
          if (wt.DeathLocation) {
            const parts = String(wt.DeathLocation).split(",").map((s: string) => s.trim());
            locs.push({ profile_id: pid, location_type: "died", city: parts[0] || null, state_province: parts[1] || null, country: parts[parts.length - 1] || null });
          }
          if (locs.length > 0) await supabase.from("profile_locations").insert(locs);

          if (wt.Spouses && typeof wt.Spouses === "object") {
            const familyRows = Object.values(wt.Spouses as Record<string, { FirstName?: string; LastNameAtBirth?: string; LastNameCurrent?: string }>)
              .filter((s) => s.FirstName && (s.LastNameAtBirth || s.LastNameCurrent))
              .map((s) => ({
                profile_id: pid,
                relation_type: "spouse",
                name_only: `${s.FirstName} ${s.LastNameAtBirth || s.LastNameCurrent}`.trim(),
                name_normalized: `${s.FirstName} ${s.LastNameAtBirth || s.LastNameCurrent}`.trim().toLowerCase(),
                connection_source: "record_match",
                connection_confidence: 0.90,
              }));
            if (familyRows.length > 0) await supabase.from("family_connections").insert(familyRows);
          }

          results.created++;
        } catch (e) {
          console.error("Row error:", e);
          results.errors++;
        }
      }

      // Polite delay between surnames
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`Error fetching ${lastName}:`, e);
      results.errors++;
    }
  }

  await supabase.from("ingestion_log").insert({
    source: "wikitree",
    profiles_found: results.found,
    profiles_created: results.created,
    profiles_skipped: results.skipped,
    errors: results.errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
    notes: `Surnames: ${results.surnames}`,
  });

  return NextResponse.json(results);
}
