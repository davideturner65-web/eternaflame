import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile } from "@/types/profile";

export const revalidate = 86400;

interface Props { params: { conflict: string } }

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

const US_STATE_ABBRS = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["FL","Florida"],
  ["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],
  ["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],
  ["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],
  ["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],
  ["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],
  ["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],
  ["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],
  ["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

async function getConflictData(conflictName: string) {
  try {
    const supabase = createClient();
    const { data: milData, count } = await supabase
      .from("profile_military")
      .select("profile_id", { count: "exact" })
      .eq("conflict", conflictName);

    if (!milData?.length) return { profiles: [], total: 0 };

    const profileIds = milData.map(m => m.profile_id).slice(0, 24);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug, first_name, last_name, birth_year, death_year, personality_summary, interests, privacy")
      .in("id", profileIds)
      .eq("privacy", "public");

    return { profiles: (profiles ?? []) as Profile[], total: count ?? 0 };
  } catch { return { profiles: [], total: 0 }; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = CONFLICT_NAMES[params.conflict] ?? params.conflict;
  const supabase = createClient();
  const { count } = await supabase
    .from("profile_military")
    .select("*", { count: "exact", head: true })
    .eq("conflict", name);
  const countStr = (count ?? 0).toLocaleString();
  return {
    title: `${name} Veterans | Eternaflame Memorial Record`,
    description: `${countStr} ${name} veterans preserved in the Eternaflame record. Browse memorial profiles by state, branch, and unit. Free, permanent, searchable.`,
    alternates: { canonical: `https://eternaflame.org/military/${params.conflict}/` },
  };
}

export default async function ConflictPage({ params }: Props) {
  const conflictName = CONFLICT_NAMES[params.conflict];
  if (!conflictName) return null;
  const { profiles, total } = await getConflictData(conflictName);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://eternaflame.org" },
      { "@type": "ListItem", position: 2, name: "Military", item: "https://eternaflame.org/military/" },
      { "@type": "ListItem", position: 3, name: conflictName, item: `https://eternaflame.org/military/${params.conflict}/` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-warm-tertiary mb-8">
        <Link href="/military/" className="hover:text-flame transition-colors">Military</Link>
        <span className="mx-2">›</span>
        <span className="text-warm-secondary">{conflictName}</span>
      </nav>

      <p className="small-caps mb-2">Veterans in the record</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-3 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        {conflictName} Veterans in the Record
      </h1>
      <p className="text-warm-secondary text-lg mb-10">
        {total.toLocaleString()} veterans preserved in the Eternaflame record
      </p>

      {/* Browse by state sub-navigation */}
      <div className="mb-10">
        <p className="text-warm-tertiary text-xs uppercase tracking-widest mb-3">Browse by state</p>
        <div className="flex flex-wrap gap-2">
          {US_STATE_ABBRS.slice(0, 10).map(([abbr, name]) => (
            <Link key={abbr}
              href={`/military/${params.conflict}/${name.toLowerCase().replace(/\s+/g, "-")}/`}
              className="text-sm px-3 py-1.5 rounded-pill border border-[rgba(245,158,11,0.2)] text-warm-secondary hover:text-flame hover:border-flame transition-all">
              {name}
            </Link>
          ))}
          <span className="text-warm-tertiary text-sm px-3 py-1.5">+ more states &rarr;</span>
        </div>
      </div>

      {profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-warm-tertiary">
            No {conflictName} veterans in the record yet. Know someone who served?{" "}
            <Link href="/create" className="text-flame hover:underline">Add them</Link>
          </p>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between">
        <Link href="/military/" className="text-warm-tertiary text-sm hover:text-warm-secondary transition-colors">
          &larr; All conflicts
        </Link>
        <Link href="/search" className="text-flame text-sm hover:underline">
          Search all lives &rarr;
        </Link>
      </div>
    </div>
  );
}
