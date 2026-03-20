import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DiscoverCard from "@/components/ui/DiscoverCard";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile, ProfileLocation, ProfileMilitary } from "@/types/profile";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover a Life You've Never Known | Eternaflame",
  description: "Meet a stranger whose life is now part of the permanent record. Every person here was real, lived fully, and deserves to be remembered.",
  alternates: { canonical: "https://eternaflame.org/discover" },
};

async function getRandomProfile(): Promise<{ profile: Profile; location: ProfileLocation | null; military: ProfileMilitary | null } | null> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("privacy", "public");

    if (!count) return null;

    const offset = Math.floor(Math.random() * count);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .range(offset, offset)
      .single();

    if (!data) return null;

    const [{ data: locationData }, { data: militaryData }] = await Promise.all([
      supabase.from("profile_locations").select("*").eq("profile_id", data.id).limit(1).maybeSingle(),
      supabase.from("profile_military").select("*").eq("profile_id", data.id).limit(1).maybeSingle(),
    ]);

    return { profile: data, location: locationData ?? null, military: militaryData ?? null };
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
    const [{ data: locData }, { data: milData }, { data: profileData }] = await Promise.all([
      supabase.from("profile_locations").select("city").not("city", "is", null).limit(200),
      supabase.from("profile_military").select("branch").not("branch", "is", null).limit(200),
      supabase.from("profiles").select("interests").eq("privacy", "public").not("interests", "is", null).limit(200),
    ]);

    const locations = Array.from(new Set((locData ?? []).map((l: { city: string }) => l.city).filter(Boolean))).slice(0, 20) as string[];
    const militaryBranches = Array.from(new Set((milData ?? []).map((m: { branch: string }) => m.branch).filter(Boolean))) as string[];
    const allInterests = (profileData ?? []).flatMap((p: { interests: string[] | null }) => p.interests ?? []);
    const interests = Array.from(new Set(allInterests)).slice(0, 20) as string[];

    return { locations, militaryBranches, interests };
  } catch {
    return { locations: [], militaryBranches: [], interests: [] };
  }
}

async function getFilteredProfiles(filter: string, value: string): Promise<{ profile: Profile; location: ProfileLocation | null }[]> {
  try {
    const supabase = createClient();

    if (filter === "location") {
      const { data: locationRows } = await supabase
        .from("profile_locations")
        .select("profile_id, city, state_abbreviation")
        .eq("city", value)
        .limit(20);

      if (!locationRows?.length) return [];

      const profileIds = locationRows.map((l: { profile_id: string }) => l.profile_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("privacy", "public")
        .in("id", profileIds);

      return (profiles ?? []).map((p: Profile) => ({
        profile: p,
        location: locationRows.find((l: { profile_id: string; city?: string; state_abbreviation?: string }) => l.profile_id === p.id) as ProfileLocation | null,
      }));
    }

    if (filter === "military") {
      const { data: milRows } = await supabase
        .from("profile_military")
        .select("profile_id")
        .eq("branch", value)
        .limit(20);

      if (!milRows?.length) return [];

      const profileIds = milRows.map((m: { profile_id: string }) => m.profile_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("privacy", "public")
        .in("id", profileIds);

      const locMap = new Map<string, ProfileLocation>();
      if (profiles?.length) {
        const { data: locs } = await supabase
          .from("profile_locations")
          .select("*")
          .in("profile_id", profileIds)
          .limit(50);
        (locs ?? []).forEach((l: ProfileLocation) => { if (!locMap.has(l.profile_id)) locMap.set(l.profile_id, l); });
      }

      return (profiles ?? []).map((p: Profile) => ({ profile: p, location: locMap.get(p.id) ?? null }));
    }

    if (filter === "interest") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("privacy", "public")
        .contains("interests", [value])
        .limit(20);

      if (!profiles?.length) return [];

      const profileIds = profiles.map((p: Profile) => p.id);
      const locMap = new Map<string, ProfileLocation>();
      const { data: locs } = await supabase
        .from("profile_locations")
        .select("*")
        .in("profile_id", profileIds)
        .limit(50);
      (locs ?? []).forEach((l: ProfileLocation) => { if (!locMap.has(l.profile_id)) locMap.set(l.profile_id, l); });

      return profiles.map((p: Profile) => ({ profile: p, location: locMap.get(p.id) ?? null }));
    }

    return [];
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

  const [featured, browseData] = await Promise.all([
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
      {featured ? (
        <>
          <DiscoverCard
            profile={featured.profile}
            location={featured.location}
            military={featured.military}
          />
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
            {filteredProfiles.map(({ profile, location }) => (
              <ProfileCard key={profile.id} profile={profile} location={location} size="md" />
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
