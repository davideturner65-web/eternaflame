import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("privacy", "public");

  if (!count) return NextResponse.json({ profile: null });

  const offset = Math.floor(Math.random() * count);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, middle_name, nickname, birth_year, death_year, birth_date, death_date, age_at_death, personality_summary, biography, interests, privacy")
    .eq("privacy", "public")
    .range(offset, offset)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also fetch child data for the discover card
  const pid = data?.id;
  const [locResult, milResult, occResult] = await Promise.all([
    supabase.from("profile_locations").select("*").eq("profile_id", pid).eq("is_current", true).limit(1),
    supabase.from("profile_military").select("branch, rank, conflict").eq("profile_id", pid).limit(1),
    supabase.from("profile_occupations").select("job_title, employer_name, notes").eq("profile_id", pid).eq("is_primary_career", true).limit(1),
  ]);

  return NextResponse.json({
    profile: data,
    location: locResult.data?.[0] ?? null,
    military: milResult.data?.[0] ?? null,
    occupation: occResult.data?.[0] ?? null,
  });
}
