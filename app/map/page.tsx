import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "The Globe of Human Memory | Eternaflame",
  description: "Every life in the Eternaflame record, mapped. Watch the amber lights of human existence spread across the earth — growing every day.",
};

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

async function getTotalCount() {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("privacy", "public");
    return count ?? 0;
  } catch { return 0; }
}

export default async function MapPage() {
  const totalCount = await getTotalCount();

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Full-screen globe */}
      <section className="flex-1 relative flex flex-col">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.04) 0%, transparent 70%)",
        }} />

        <div className="relative z-10 flex flex-col items-center justify-center text-center pt-16 pb-6 px-4">
          <p className="small-caps mb-3">The record, mapped</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Every life, mapped.
          </h1>
          <p className="mt-4 text-warm-secondary max-w-lg">
            Each amber light is a life in the record. Drag to explore. Watch the constellation grow.
          </p>
        </div>

        <div className="flex-1 relative min-h-[500px] px-4 pb-8">
          <Globe
            height={600}
            showCounter={true}
            totalCount={totalCount}
          />
        </div>

        {totalCount > 0 && (
          <div className="text-center pb-12 px-4">
            <p className="text-warm-tertiary text-sm">
              {totalCount.toLocaleString()} lives in the record — growing every day
            </p>
          </div>
        )}
      </section>

      {/* Browse by cluster */}
      <section className="border-t border-[rgba(245,158,11,0.08)] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl text-warm-primary font-semibold mb-8 text-center"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Browse by region
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              "Arkansas", "Texas", "California", "Florida",
              "New York", "Pennsylvania", "Ohio", "Georgia",
            ].map(state => (
              <Link key={state}
                href={`/lives/${state.toLowerCase().replace(/\s+/g, "-")}/`}
                className="card-surface rounded-card px-4 py-3 text-center text-warm-secondary hover:text-flame transition-all duration-200 hover:shadow-flame text-sm">
                {state}
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/lives/" className="text-flame text-sm hover:underline">
              Browse all states &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Military filter */}
      <section className="border-t border-[rgba(245,158,11,0.08)] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl text-warm-primary font-semibold mb-8 text-center"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Filter by conflict
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["World War II", "world-war-ii"],
              ["Vietnam War", "vietnam-war"],
              ["Korean War", "korean-war"],
              ["Gulf War", "gulf-war"],
              ["Iraq War", "iraq-war"],
              ["Afghanistan", "afghanistan"],
            ].map(([label, slug]) => (
              <Link key={slug}
                href={`/military/${slug}/`}
                className="card-surface rounded-card px-4 py-3 text-center text-warm-secondary hover:text-flame transition-all duration-200 hover:shadow-flame text-sm">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
