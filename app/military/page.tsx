import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Veterans in the Record | Eternaflame Military Memorial",
  description: "Browse every veteran in the Eternaflame record by conflict, state, and branch. Honoring all who served — free, permanent, searchable.",
  alternates: { canonical: "https://eternaflame.org/military/" },
};

const CONFLICTS = [
  ["World War II", "world-war-ii"],
  ["Vietnam War", "vietnam-war"],
  ["Korean War", "korean-war"],
  ["World War I", "world-war-i"],
  ["Gulf War", "gulf-war"],
  ["Iraq War", "iraq-war"],
  ["Afghanistan", "afghanistan"],
  ["Cold War Era", "cold-war-era"],
  ["Peacetime", "peacetime"],
];

async function getConflictCounts(): Promise<Record<string, number>> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profile_military")
      .select("conflict");
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.conflict) counts[row.conflict] = (counts[row.conflict] ?? 0) + 1;
    }
    return counts;
  } catch { return {}; }
}

export default async function MilitaryPage() {
  const counts = await getConflictCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <p className="small-caps mb-2">Veterans in the record</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        All Who Served
      </h1>
      <p className="text-warm-secondary text-lg mb-12">
        {total > 0 ? `${total.toLocaleString()} veterans` : "Veterans"} in the Eternaflame record. Free, permanent, searchable.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {CONFLICTS.map(([name, slug]) => {
          const count = counts[name] ?? 0;
          return (
            <Link key={slug} href={`/military/${slug}/`}
              className="card-surface rounded-card p-6 hover:shadow-flame hover:border-[rgba(245,158,11,0.25)] transition-all duration-200 group">
              <h2 className="text-warm-primary font-semibold text-lg group-hover:text-flame transition-colors"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {name}
              </h2>
              {count > 0 ? (
                <p className="text-warm-tertiary text-sm mt-1">{count.toLocaleString()} veterans</p>
              ) : (
                <p className="text-warm-tertiary text-sm mt-1">Add to the record</p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link href="/create" className="text-flame hover:underline text-sm">
          Add a veteran to the record &rarr;
        </Link>
      </div>
    </div>
  );
}
