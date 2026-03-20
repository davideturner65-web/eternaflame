import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Schools & Alumni in the Record | Eternaflame",
  description: "Browse memorial profiles by school and university. Find alumni in the Eternaflame record — free, permanent, searchable.",
  alternates: { canonical: "https://eternaflame.org/schools/" },
};

async function getTopSchools() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profile_education")
      .select("institution_name, institution_name_normalized");

    const counts: Record<string, { name: string; count: number }> = {};
    for (const row of data ?? []) {
      const key = row.institution_name_normalized ?? row.institution_name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (key && row.institution_name) {
        if (!counts[key]) counts[key] = { name: row.institution_name, count: 0 };
        counts[key].count++;
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 48)
      .map(([slug, { name, count }]) => ({ slug, name, count }));
  } catch { return []; }
}

export default async function SchoolsPage() {
  const schools = await getTopSchools();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <p className="small-caps mb-2">Browse by school</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        Schools in the Record
      </h1>
      <p className="text-warm-secondary text-lg mb-12">
        Find alumni from any institution in the Eternaflame record.
      </p>

      {schools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {schools.map(({ slug, name, count }) => (
            <Link key={slug} href={`/schools/${slug}/`}
              className="card-surface rounded-card p-5 hover:shadow-flame hover:border-[rgba(245,158,11,0.25)] transition-all duration-200 group">
              <p className="text-warm-primary font-medium group-hover:text-flame transition-colors"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {name}
              </p>
              <p className="text-warm-tertiary text-sm mt-1">{count.toLocaleString()} alumni</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-warm-tertiary">
            No schools in the record yet.{" "}
            <Link href="/create" className="text-flame hover:underline">Add someone and include their education</Link>
          </p>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/search" className="text-flame hover:underline text-sm">
          Search the full record &rarr;
        </Link>
      </div>
    </div>
  );
}
