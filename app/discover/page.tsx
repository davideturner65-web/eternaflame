import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DiscoverCard from "@/components/ui/DiscoverCard";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Lives",
  description: "Explore the permanent record. Meet someone you've never known.",
};

export const revalidate = 60;

async function getRandomProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("privacy", "public")
      .eq("profile_status", "published");

    if (!count) return null;

    const offset = Math.floor(Math.random() * count);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .eq("profile_status", "published")
      .range(offset, offset)
      .single();

    return data ?? null;
  } catch {
    return null;
  }
}

async function getBrowseData(): Promise<{
  locations: string[];
  militaryBranches: string[];
  interests: string[];
}> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("residence, military_branch, interests")
      .eq("privacy", "public")
      .eq("profile_status", "published");

    if (!data) return { locations: [], militaryBranches: [], interests: [] };

    const locations = Array.from(new Set(data.map((p) => p.residence).filter(Boolean))) as string[];
    const militaryBranches = Array.from(
      new Set(data.map((p) => p.military_branch).filter(Boolean))
    ) as string[];
    const allInterests = data.flatMap((p) => p.interests ?? []);
    const interests = Array.from(new Set(allInterests)).slice(0, 20);

    return { locations, militaryBranches, interests };
  } catch {
    return { locations: [], militaryBranches: [], interests: [] };
  }
}

async function getFilteredProfiles(filter: string, value: string): Promise<Profile[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .eq("profile_status", "published");

    if (filter === "location") {
      query = query.eq("residence", value);
    } else if (filter === "military") {
      query = query.eq("military_branch", value);
    } else if (filter === "interest") {
      query = query.contains("interests", [value]);
    }

    const { data } = await query.limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

interface DiscoverPageProps {
  searchParams: { filter?: string; value?: string };
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const activeFilter = searchParams.filter ?? "";
  const activeValue = searchParams.value ?? "";

  const [featuredProfile, browseData] = await Promise.all([
    getRandomProfile(),
    getBrowseData(),
  ]);

  const filteredProfiles =
    activeFilter && activeValue
      ? await getFilteredProfiles(activeFilter, activeValue)
      : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#C4A869] small-caps mb-2">Discover</p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#E7E0D5]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Meet someone you&rsquo;ve never known
        </h1>
      </div>

      {/* Featured random profile */}
      {featuredProfile ? (
        <>
          <DiscoverCard profile={featuredProfile} />
          <div className="mt-5">
            <Link
              href="/discover"
              className="text-sm text-[#C4A869] border border-[rgba(196,164,105,0.3)] px-4 py-2 rounded-button hover:bg-[rgba(196,164,105,0.08)] transition-all"
            >
              Discover someone else
            </Link>
          </div>
        </>
      ) : (
        <div className="card-surface rounded-card p-10 text-center text-[#78716C]">
          <p>No profiles in the record yet.</p>
          <Link
            href="/create"
            className="mt-4 inline-block text-sm text-[#C4A869] hover:underline"
          >
            Add the first one &rarr;
          </Link>
        </div>
      )}

      {/* Browse by attribute */}
      <div className="mt-16 space-y-10">
        <h2
          className="text-xl text-[#E7E0D5] font-semibold"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Browse by
        </h2>

        {/* By Location */}
        {browseData.locations.length > 0 && (
          <div>
            <p className="text-[#78716C] small-caps mb-3">Location</p>
            <div className="flex flex-wrap gap-2">
              {browseData.locations.map((loc) => (
                <Link
                  key={loc}
                  href={`/discover?filter=location&value=${encodeURIComponent(loc)}`}
                  className={`text-sm px-3 py-1.5 rounded-pill border transition-all ${
                    activeFilter === "location" && activeValue === loc
                      ? "bg-[rgba(196,164,105,0.2)] border-[#C4A869] text-[#C4A869]"
                      : "border-[rgba(196,164,105,0.25)] text-[#A8A29E] hover:border-[#C4A869] hover:text-[#C4A869]"
                  }`}
                >
                  {loc}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* By Military */}
        {browseData.militaryBranches.length > 0 && (
          <div>
            <p className="text-[#78716C] small-caps mb-3">Military Service</p>
            <div className="flex flex-wrap gap-2">
              {browseData.militaryBranches.map((branch) => (
                <Link
                  key={branch}
                  href={`/discover?filter=military&value=${encodeURIComponent(branch)}`}
                  className={`text-sm px-3 py-1.5 rounded-pill border transition-all ${
                    activeFilter === "military" && activeValue === branch
                      ? "bg-[rgba(196,164,105,0.2)] border-[#C4A869] text-[#C4A869]"
                      : "border-[rgba(196,164,105,0.25)] text-[#A8A29E] hover:border-[#C4A869] hover:text-[#C4A869]"
                  }`}
                >
                  {branch}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* By Interest */}
        {browseData.interests.length > 0 && (
          <div>
            <p className="text-[#78716C] small-caps mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {browseData.interests.map((interest) => (
                <Link
                  key={interest}
                  href={`/discover?filter=interest&value=${encodeURIComponent(interest)}`}
                  className={`text-sm px-3 py-1.5 rounded-pill border transition-all ${
                    activeFilter === "interest" && activeValue === interest
                      ? "bg-[rgba(196,164,105,0.2)] border-[#C4A869] text-[#C4A869]"
                      : "border-[rgba(196,164,105,0.25)] text-[#A8A29E] hover:border-[#C4A869] hover:text-[#C4A869]"
                  }`}
                >
                  {interest}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filtered results */}
      {filteredProfiles.length > 0 && (
        <div className="mt-12">
          <p className="text-[#78716C] text-sm mb-6">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? "life" : "lives"} found
            {activeValue && (
              <span className="text-[#A8A29E]"> — {activeValue}</span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} size="md" />
            ))}
          </div>
        </div>
      )}

      {activeFilter && activeValue && filteredProfiles.length === 0 && (
        <div className="mt-12 card-surface rounded-card p-8 text-center text-[#78716C]">
          No profiles found for &ldquo;{activeValue}&rdquo;.
        </div>
      )}
    </div>
  );
}
