import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Browse Lives by Location | Eternaflame",
  description: "Browse every life in the Eternaflame record by location — state, county, and city. Millions of lives, searchable and free.",
  alternates: { canonical: "https://eternaflame.org/lives/" },
};

const US_STATES = [
  ["Alabama", "alabama"], ["Alaska", "alaska"], ["Arizona", "arizona"], ["Arkansas", "arkansas"],
  ["California", "california"], ["Colorado", "colorado"], ["Connecticut", "connecticut"],
  ["Delaware", "delaware"], ["Florida", "florida"], ["Georgia", "georgia"],
  ["Hawaii", "hawaii"], ["Idaho", "idaho"], ["Illinois", "illinois"], ["Indiana", "indiana"],
  ["Iowa", "iowa"], ["Kansas", "kansas"], ["Kentucky", "kentucky"], ["Louisiana", "louisiana"],
  ["Maine", "maine"], ["Maryland", "maryland"], ["Massachusetts", "massachusetts"],
  ["Michigan", "michigan"], ["Minnesota", "minnesota"], ["Mississippi", "mississippi"],
  ["Missouri", "missouri"], ["Montana", "montana"], ["Nebraska", "nebraska"],
  ["Nevada", "nevada"], ["New Hampshire", "new-hampshire"], ["New Jersey", "new-jersey"],
  ["New Mexico", "new-mexico"], ["New York", "new-york"], ["North Carolina", "north-carolina"],
  ["North Dakota", "north-dakota"], ["Ohio", "ohio"], ["Oklahoma", "oklahoma"],
  ["Oregon", "oregon"], ["Pennsylvania", "pennsylvania"], ["Rhode Island", "rhode-island"],
  ["South Carolina", "south-carolina"], ["South Dakota", "south-dakota"],
  ["Tennessee", "tennessee"], ["Texas", "texas"], ["Utah", "utah"],
  ["Vermont", "vermont"], ["Virginia", "virginia"], ["Washington", "washington"],
  ["West Virginia", "west-virginia"], ["Wisconsin", "wisconsin"], ["Wyoming", "wyoming"],
];

async function getStateCounts(): Promise<Record<string, number>> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profile_locations")
      .select("state_province, profile_id")
      .not("state_province", "is", null);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const s = (row.state_province as string).trim();
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  } catch { return {}; }
}

export default async function LivesPage() {
  const stateCounts = await getStateCounts();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://eternaflame.org" },
      { "@type": "ListItem", position: 2, name: "Lives", item: "https://eternaflame.org/lives/" },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <p className="small-caps mb-2">Browse by location</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        Lives in the Record
      </h1>
      <p className="text-warm-secondary text-lg mb-12">
        Browse by state, county, and city. Every life remembered, searchable and free.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {US_STATES.map(([name, slug]) => {
          const count = stateCounts[name] ?? 0;
          return (
            <Link key={slug} href={`/lives/${slug}/`}
              className="card-surface rounded-card p-4 hover:shadow-flame hover:border-[rgba(245,158,11,0.25)] transition-all duration-200">
              <p className="text-warm-primary font-medium text-sm" style={{ fontFamily: "var(--font-playfair)" }}>
                {name}
              </p>
              {count > 0 && (
                <p className="text-warm-tertiary text-xs mt-1">{count.toLocaleString()} lives</p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link href="/search" className="text-flame hover:underline">
          Search the full record &rarr;
        </Link>
      </div>
    </div>
  );
}
