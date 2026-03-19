import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search the Record",
  description: "Search Eternaflame's permanent index of human lives by name, place, or any detail.",
};

interface SearchPageProps {
  searchParams: { q?: string; filter?: string };
}

async function searchProfiles(query: string): Promise<Profile[]> {
  try {
    const supabase = createClient();

    if (!query.trim()) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("privacy", "public")
        .eq("profile_status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .eq("profile_status", "published")
      .textSearch("full_text_search", query, { type: "plain" })
      .limit(50);

    return data ?? [];
  } catch {
    return [];
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? "";
  const results = await searchProfiles(query);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <p className="text-[#C4A869] small-caps mb-2">Search</p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#E7E0D5] mb-8"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Search the Record
        </h1>

        {/* Search form */}
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, place, or any detail..."
              autoFocus
              className="w-full px-5 py-3.5 rounded-button bg-[rgba(196,164,105,0.05)] border border-[rgba(196,164,105,0.2)] text-[#E7E0D5] placeholder-[#78716C] focus:outline-none focus:border-[#C4A869] transition-colors text-base"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-button text-[#1C1917] font-semibold text-base whitespace-nowrap hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Results count */}
      {query && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[#78716C] text-sm">
            {results.length === 0
              ? `No lives found matching "${query}"`
              : `${results.length} ${results.length === 1 ? "life" : "lives"} found`}
          </p>
        </div>
      )}

      {!query && (
        <p className="text-[#78716C] text-sm mb-6">
          Showing {results.length} most recently added lives
        </p>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="card-surface rounded-card p-10 text-center">
          <p
            className="text-xl text-[#A8A29E] mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            No one found matching &ldquo;{query}&rdquo;
          </p>
          <p className="text-[#78716C] text-sm mb-6">
            They may not be in the record yet.
          </p>
          <Link
            href={`/create`}
            className="inline-block px-6 py-3 rounded-button text-[#1C1917] font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}
          >
            Add them to the record
          </Link>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
