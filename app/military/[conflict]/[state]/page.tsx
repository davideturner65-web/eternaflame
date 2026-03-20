import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile } from "@/types/profile";

export const revalidate = 86400;

interface Props { params: { conflict: string; state: string } }

const CONFLICT_NAMES: Record<string, string> = {
  "world-war-ii": "World War II",
  "vietnam-war": "Vietnam War",
  "korean-war": "Korean War",
  "world-war-i": "World War I",
  "gulf-war": "Gulf War",
  "iraq-war": "Iraq War",
  "afghanistan": "Afghanistan",
  "cold-war-era": "Cold War Era",
  "peacetime": "Peacetime",
};

function stateSlugToName(slug: string): string {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function getData(conflictName: string, stateName: string) {
  try {
    const supabase = createClient();

    // Get profile_ids that served in this conflict
    const { data: milData } = await supabase
      .from("profile_military")
      .select("profile_id")
      .eq("conflict", conflictName);

    if (!milData?.length) return { profiles: [], total: 0 };

    const milIds = milData.map(m => m.profile_id);

    // Filter to those with a location in this state
    const { data: locData, count } = await supabase
      .from("profile_locations")
      .select("profile_id", { count: "exact" })
      .in("profile_id", milIds)
      .eq("state_province", stateName);

    if (!locData?.length) return { profiles: [], total: 0 };

    const profileIds = [...new Set(locData.map(l => l.profile_id))].slice(0, 24);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug, first_name, last_name, birth_year, death_year, personality_summary, interests, privacy")
      .in("id", profileIds)
      .eq("privacy", "public");

    return { profiles: (profiles ?? []) as Profile[], total: count ?? 0 };
  } catch { return { profiles: [], total: 0 }; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const conflictName = CONFLICT_NAMES[params.conflict] ?? params.conflict;
  const stateName = stateSlugToName(params.state);
  const supabase = createClient();
  const { data: milData } = await supabase.from("profile_military").select("profile_id").eq("conflict", conflictName);
  const milIds = (milData ?? []).map((m: { profile_id: string }) => m.profile_id);
  let count = 0;
  if (milIds.length) {
    const { count: c } = await supabase.from("profile_locations")
      .select("*", { count: "exact", head: true }).in("profile_id", milIds).eq("state_province", stateName);
    count = c ?? 0;
  }
  return {
    title: `${conflictName} Veterans from ${stateName} | Eternaflame`,
    description: `${count.toLocaleString()} ${conflictName} veterans from ${stateName} are preserved in the Eternaflame record. Browse their lives, service records, and family histories.`,
    alternates: { canonical: `https://eternaflame.org/military/${params.conflict}/${params.state}/` },
  };
}

export default async function ConflictStatePage({ params }: Props) {
  const conflictName = CONFLICT_NAMES[params.conflict];
  if (!conflictName) return null;
  const stateName = stateSlugToName(params.state);
  const { profiles, total } = await getData(conflictName, stateName);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <nav className="text-sm text-warm-tertiary mb-8">
        <Link href="/military/" className="hover:text-flame transition-colors">Military</Link>
        <span className="mx-2">›</span>
        <Link href={`/military/${params.conflict}/`} className="hover:text-flame transition-colors">{conflictName}</Link>
        <span className="mx-2">›</span>
        <span className="text-warm-secondary">{stateName}</span>
      </nav>

      <p className="small-caps mb-2">Veterans in the record</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-3 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        {conflictName} Veterans from {stateName}
      </h1>
      <p className="text-warm-secondary text-lg mb-10">
        {total.toLocaleString()} veterans in the record
      </p>

      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-warm-tertiary">
            No {conflictName} veterans from {stateName} in the record yet.{" "}
            <Link href="/create" className="text-flame hover:underline">Add someone who served</Link>
          </p>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between">
        <Link href={`/military/${params.conflict}/`} className="text-warm-tertiary text-sm hover:text-warm-secondary transition-colors">
          &larr; All {conflictName} veterans
        </Link>
        <Link href="/search" className="text-flame text-sm hover:underline">Search all lives &rarr;</Link>
      </div>
    </div>
  );
}
