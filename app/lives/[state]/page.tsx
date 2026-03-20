import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile, ProfileLocation } from "@/types/profile";

export const revalidate = 86400;

interface Props { params: { state: string } }

function stateSlugToName(slug: string): string {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function getStateData(stateName: string) {
  try {
    const supabase = createClient();

    const { data: locData, count } = await supabase
      .from("profile_locations")
      .select("profile_id, city, county, state_province", { count: "exact" })
      .eq("state_province", stateName)
      .not("profile_id", "is", null);

    if (!locData?.length) return null;

    const profileIds = [...new Set(locData.map(l => l.profile_id))].slice(0, 24);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug, first_name, last_name, birth_year, death_year, birth_date, death_date, personality_summary, interests, privacy")
      .in("id", profileIds)
      .eq("privacy", "public");

    // Get county counts for sub-navigation
    const countyCounts: Record<string, number> = {};
    for (const l of locData) {
      if (l.county) countyCounts[l.county] = (countyCounts[l.county] ?? 0) + 1;
    }
    const topCounties = Object.entries(countyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    return {
      profiles: (profiles ?? []) as Profile[],
      total: count ?? 0,
      topCounties,
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateName = stateSlugToName(params.state);
  const supabase = createClient();
  const { count } = await supabase
    .from("profile_locations")
    .select("*", { count: "exact", head: true })
    .eq("state_province", stateName);
  const countStr = (count ?? 0).toLocaleString();
  return {
    title: `Lives Remembered in ${stateName} | Eternaflame`,
    description: `${countStr} lives from ${stateName} are preserved in the Eternaflame record. Browse memorial profiles, family histories, and life stories from across the state.`,
    alternates: { canonical: `https://eternaflame.org/lives/${params.state}/` },
  };
}

export default async function StatePage({ params }: Props) {
  const stateName = stateSlugToName(params.state);
  const data = await getStateData(stateName);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://eternaflame.org" },
      { "@type": "ListItem", position: 2, name: "Lives", item: "https://eternaflame.org/lives/" },
      { "@type": "ListItem", position: 3, name: stateName, item: `https://eternaflame.org/lives/${params.state}/` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="text-sm text-warm-tertiary mb-8">
        <Link href="/lives/" className="hover:text-flame transition-colors">Lives</Link>
        <span className="mx-2">›</span>
        <span className="text-warm-secondary">{stateName}</span>
      </nav>

      <p className="small-caps mb-2">Browse by location</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-3 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        Lives Remembered in {stateName}
      </h1>
      {data && (
        <p className="text-warm-secondary text-lg mb-10">
          {data.total.toLocaleString()} people in the record
        </p>
      )}

      {/* County sub-navigation */}
      {data?.topCounties && data.topCounties.length > 0 && (
        <div className="mb-12">
          <p className="text-warm-tertiary text-xs uppercase tracking-widest mb-3">Browse by county</p>
          <div className="flex flex-wrap gap-2">
            {data.topCounties.map(([county, count]) => (
              <Link key={county}
                href={`/lives/${params.state}/${county.toLowerCase().replace(/\s+/g, "-").replace(/\scounty$/i, "")}-county/`}
                className="text-sm px-3 py-1.5 rounded-pill border border-[rgba(245,158,11,0.25)] text-warm-secondary hover:text-flame hover:border-flame transition-all">
                {county} <span className="text-warm-tertiary">({count.toLocaleString()})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profile grid */}
      {data?.profiles && data.profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-warm-tertiary">
            No lives in the record from {stateName} yet. Know someone from here?{" "}
            <Link href="/create" className="text-flame hover:underline">Add them</Link>
          </p>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between">
        <Link href="/lives/" className="text-warm-tertiary text-sm hover:text-warm-secondary transition-colors">
          &larr; All states
        </Link>
        <Link href="/search" className="text-flame text-sm hover:underline">
          Search all lives &rarr;
        </Link>
      </div>
    </div>
  );
}
