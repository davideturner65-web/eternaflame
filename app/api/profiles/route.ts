import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// GET /api/profiles?q=&limit=20&offset=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const db = supabase();

  let query = db
    .from("profiles")
    .select("id, first_name, last_name, middle_name, nickname, birth_year, death_year, birth_date, death_date, age_at_death, personality_summary, interests, privacy, ingestion_source, obituary_source, created_at")
    .eq("privacy", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profiles: data ?? [] });
}

// POST /api/profiles — create a new profile with child records
export async function POST(request: Request) {
  const authClient = createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const db = supabase();

  if (!body.first_name?.trim() || !body.last_name?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  const interestList: string[] = typeof body.interests === "string"
    ? body.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(body.interests) ? body.interests : [];

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .insert({
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      middle_name: body.middle_name?.trim() || null,
      nickname: body.nickname?.trim() || null,
      name_suffix: body.suffix?.trim() || null,
      birth_date: body.birth_date || null,
      birth_year: body.birth_date ? new Date(body.birth_date).getFullYear() : null,
      death_date: body.death_date || null,
      death_year: body.death_date ? new Date(body.death_date).getFullYear() : null,
      personality_summary: body.personality?.trim() || null,
      interests: interestList.length > 0 ? interestList : null,
      obituary_source: body.obituary_source?.trim() || null,
      obituary_url: body.obituary_url?.trim() || null,
      privacy: body.privacy ?? "public",
      auto_ingested: false,
      ingestion_source: "manual",
      ingestion_confidence: 1.0,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Insert failed" }, { status: 500 });
  }

  const pid = profile.id;
  const tasks: PromiseLike<unknown>[] = [];

  // Locations
  const locationInserts = [];
  if (body.birth_place?.trim()) {
    locationInserts.push({ profile_id: pid, location_type: "born", city: body.birth_place.trim() });
  }
  if (body.residence?.trim()) {
    locationInserts.push({ profile_id: pid, location_type: "lived", city: body.residence.trim(), is_current: true });
  }
  if (body.burial_place?.trim()) {
    locationInserts.push({ profile_id: pid, location_type: "buried", city: body.burial_place.trim() });
  }
  if (locationInserts.length > 0) {
    tasks.push(db.from("profile_locations").insert(locationInserts).then(() => {}));
  }

  // Military
  if (body.military_branch?.trim()) {
    tasks.push(db.from("profile_military").insert({
      profile_id: pid,
      branch: body.military_branch.trim(),
      rank: body.military_rank?.trim() || null,
      conflict: body.military_conflict?.trim() || null,
      service_start_year: body.military_years ? parseInt(body.military_years.split(/[-–]/)[0]) : null,
      service_end_year: body.military_years ? parseInt(body.military_years.split(/[-–]/)[1]) : null,
    }).then(() => {}));
  }

  // Education
  if (body.education?.trim()) {
    tasks.push(db.from("profile_education").insert({
      profile_id: pid,
      institution_name: body.education.trim(),
      institution_name_normalized: body.education.trim().toLowerCase(),
    }).then(() => {}));
  }

  // Occupation
  if (body.career?.trim()) {
    tasks.push(db.from("profile_occupations").insert({
      profile_id: pid,
      notes: body.career.trim(),
      is_primary_career: true,
    }).then(() => {}));
  }

  // Faith / affiliation
  if (body.faith?.trim()) {
    tasks.push(db.from("profile_affiliations").insert({
      profile_id: pid,
      affiliation_type: "church",
      organization_name: body.faith.trim(),
      organization_name_normalized: body.faith.trim().toLowerCase(),
    }).then(() => {}));
  }

  // Family connections
  if (Array.isArray(body.family_members) && body.family_members.length > 0) {
    const familyRows = body.family_members
      .filter((f: { name?: string }) => f.name?.trim())
      .map((f: { name: string; relation_type: string; surviving: boolean }) => ({
        profile_id: pid,
        relation_type: f.relation_type,
        name_only: f.name.trim(),
        name_normalized: f.name.trim().toLowerCase(),
        surviving: f.surviving ?? true,
        connection_source: "manual",
        connection_confidence: 1.0,
      }));
    if (familyRows.length > 0) {
      tasks.push(db.from("family_connections").insert(familyRows).then(() => {}));
    }
  }

  await Promise.all(tasks);

  return NextResponse.json({ profile: { id: pid } }, { status: 201 });
}
