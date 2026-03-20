import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile, ProfileLocation } from "@/types/profile";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Obituary Search | Eternaflame",
  description: "Search millions of lives in the Eternaflame record. Find obituaries, memorial profiles, and family histories — free, forever, no paywall.",
  alternates: { canonical: "https://eternaflame.org/search" },
};

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() ?? "";
  const supabase = createClient();

  let profiles: Profile[] = [];
  const locationMap: Record<string, ProfileLocation> = {};

  try {
    let q = supabase
      .from("profiles")
      .select("id, first_name, last_name, middle_name, nickname, birth_year, death_year, birth_date, death_date, personality_summary, interests, privacy, created_at")
      .eq("privacy", "public")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query) {
      q = q.textSearch("search_vector", query, { type: "websearch" });
    }

    const { data } = await q;
    profiles = (data ?? []) as Profile[];

    if (profiles.length > 0) {
      const ids = profiles.map(p => p.id);
      const { data: locs } = await supabase
        .from("profile_locations")
        .select("*")
        .in("profile_id", ids)
        .eq("is_current", true);
      for (const loc of locs ?? []) {
        if (!locationMap[loc.profile_id]) locationMap[loc.profile_id] = loc as ProfileLocation;
      }
    }
  } catch {}

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <p className="text-[#C4A869] small-caps mb-2">Search</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#E7E0D5] mb-8"
          style={{ fontFamily: "var(--font-playfair)" }}>
          Search the Record
        </h1>

        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, place, military service, career..."
              autoFocus
              className="w-full px-5 py-3.5 rounded-button bg-[rgba(196,164,105,0.05)] border border-[rgba(196,164,105,0.2)] text-[#E7E0D5] placeholder-[#78716C] focus:outline-none focus:border-[#C4A869] transition-colors text-base"
            />
          </div>
          <button type="submit"
            className="px-6 py-3.5 rounded-button text-[#1C1917] font-semibold text-base whitespace-nowrap hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
            Search
          </button>
        </form>
      </div>

      {query && (
        <p className="text-[#78716C] text-sm mb-6">
          {profiles.length === 0
            ? `No lives found matching "${query}"`
            : `${profiles.length} ${profiles.length === 1 ? "life" : "lives"} found`}
        </p>
      )}

      {!query && (
        <p className="text-[#78716C] text-sm mb-6">
          Showing {profiles.length} most recently added lives
        </p>
      )}

      {query && profiles.length === 0 && (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-xl text-[#A8A29E] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            No one found matching &ldquo;{query}&rdquo;
          </p>
          <p className="text-[#78716C] text-sm mb-6">They may not be in the record yet.</p>
          <Link href="/create"
            className="inline-block px-6 py-3 rounded-button text-[#1C1917] font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
            Add them to the record
          </Link>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} location={locationMap[profile.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
