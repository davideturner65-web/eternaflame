import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import DiscoverCard from "@/components/ui/DiscoverCard";
import { Profile, ProfileLocation, ProfileMilitary, ProfileOccupation } from "@/types/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eternaflame — An Index of Every Human Life",
  description: "A free, permanent index of every human life. Search for someone you've lost, remember someone you love, or start building your own record while you're alive. Free forever.",
  openGraph: {
    title: "Eternaflame — An Index of Every Human Life",
    description: "A free, permanent index of every human life. Search for someone you've lost, remember someone you love, or start building your own record while you're alive. Free forever.",
  },
};

async function getRecentProfiles(): Promise<Profile[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, slug, first_name, last_name, middle_name, nickname, birth_year, death_year, birth_date, death_date, personality_summary, interests, privacy, created_at")
      .eq("privacy", "public")
      .order("created_at", { ascending: false })
      .limit(6);
    return (data ?? []) as Profile[];
  } catch { return []; }
}

async function getTotalCount(): Promise<number> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("privacy", "public");
    return count ?? 0;
  } catch { return 0; }
}

async function getDiscoverProfile(): Promise<{
  profile: Profile | null;
  location: ProfileLocation | null;
  military: ProfileMilitary | null;
  occupation: ProfileOccupation | null;
}> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("privacy", "public");
    if (!count) return { profile: null, location: null, military: null, occupation: null };
    const offset = Math.floor(Math.random() * count);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .range(offset, offset)
      .single();
    if (!data) return { profile: null, location: null, military: null, occupation: null };
    const [locR, milR, occR] = await Promise.all([
      supabase.from("profile_locations").select("*").eq("profile_id", data.id).eq("is_current", true).limit(1),
      supabase.from("profile_military").select("*").eq("profile_id", data.id).limit(1),
      supabase.from("profile_occupations").select("*").eq("profile_id", data.id).eq("is_primary_career", true).limit(1),
    ]);
    return {
      profile: data as Profile,
      location: (locR.data?.[0] ?? null) as ProfileLocation | null,
      military: (milR.data?.[0] ?? null) as ProfileMilitary | null,
      occupation: (occR.data?.[0] ?? null) as ProfileOccupation | null,
    };
  } catch { return { profile: null, location: null, military: null, occupation: null }; }
}

async function getRecentLocations(profiles: Profile[]): Promise<Record<string, ProfileLocation>> {
  if (!profiles.length) return {};
  try {
    const supabase = createClient();
    const ids = profiles.map(p => p.id);
    const { data } = await supabase
      .from("profile_locations")
      .select("*")
      .in("profile_id", ids)
      .eq("is_current", true);
    const map: Record<string, ProfileLocation> = {};
    for (const loc of data ?? []) {
      if (!map[loc.profile_id]) map[loc.profile_id] = loc as ProfileLocation;
    }
    return map;
  } catch { return {}; }
}

export default async function Home() {
  const [recentProfiles, discover, totalCount] = await Promise.all([
    getRecentProfiles(),
    getDiscoverProfile(),
    getTotalCount(),
  ]);
  const locationMap = await getRecentLocations(recentProfiles);

  return (
    <div className="flex flex-col animate-fade-in">

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-28 sm:py-40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }} />
        <p className="text-flame text-xs tracking-[0.2em] uppercase mb-5 font-medium">
          An index of every human life
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-warm-primary leading-tight max-w-3xl"
          style={{ fontFamily: "var(--font-playfair)" }}>
          You will not be forgotten.
        </h1>
        <p className="mt-7 text-warm-secondary text-lg sm:text-xl max-w-xl leading-relaxed">
          In three generations, everyone who knew you will be gone.
          We&rsquo;re building the reason that stops being true.{" "}
          <span className="text-warm-primary">Remembering someone shouldn&rsquo;t cost anything.</span>
        </p>
        {totalCount > 0 && (
          <p className="mt-4 text-warm-tertiary text-sm">
            {totalCount.toLocaleString()} lives in the record
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link href="/create"
            className="px-8 py-4 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
            Remember Someone — Free
          </Link>
          <Link href="/start"
            className="px-8 py-4 rounded-button text-warm-primary font-semibold text-base border border-[rgba(245,158,11,0.35)] hover:border-flame hover:text-flame transition-all duration-200">
            Start Your Eternaflame
          </Link>
        </div>
        <Link href="/search" className="mt-5 text-sm text-warm-tertiary hover:text-warm-secondary transition-colors">
          Search the record &rarr;
        </Link>
      </section>

      <div className="w-full border-t border-[rgba(245,158,11,0.08)]" />

      {/* The 70% Mission */}
      <section className="py-20 border-b border-[rgba(245,158,11,0.08)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="small-caps mb-4">Why we exist</p>
          <h2 className="text-2xl sm:text-3xl text-warm-primary font-semibold mb-8"
            style={{ fontFamily: "var(--font-playfair)" }}>
            The 70%
          </h2>
          <p className="text-warm-secondary text-lg leading-relaxed">
            About 70% of people who die never get a published obituary. They couldn&rsquo;t afford the $500 newspaper fee.
            They didn&rsquo;t have family nearby. They simply slipped through the cracks.
          </p>
          <p className="text-warm-secondary text-lg leading-relaxed mt-5">
            Every other memorial platform waits for an obituary to exist before it does anything.
            Eternaflame pulls from public death records, vital statistics, and government registries to make sure
            every person — regardless of income, location, or circumstance — has a place in the record.
          </p>
          <p className="text-warm-primary text-xl font-medium mt-8" style={{ fontFamily: "var(--font-playfair)" }}>
            Remembering someone shouldn&rsquo;t be a luxury.
          </p>
        </div>
      </section>

      {/* Discover */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="small-caps mb-2">Discover a life</p>
            <h2 className="text-2xl sm:text-3xl text-warm-primary font-semibold"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Meet someone you&rsquo;ve never known
            </h2>
          </div>
          <Link href="/discover" className="text-sm text-warm-secondary hover:text-flame transition-colors hidden sm:block">
            Browse all lives &rarr;
          </Link>
        </div>

        {discover.profile ? (
          <DiscoverCard
            profile={discover.profile}
            location={discover.location}
            military={discover.military}
            occupation={discover.occupation}
          />
        ) : (
          <div className="card-surface rounded-card p-10 text-center text-warm-tertiary">
            <p>The record is still growing. Check back soon.</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Link href="/discover"
            className="text-sm text-flame border border-[rgba(245,158,11,0.3)] px-4 py-2 rounded-button hover:bg-[rgba(245,158,11,0.08)] transition-all">
            Meet someone else
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[rgba(245,158,11,0.08)] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="small-caps mb-2 text-center">How it works</p>
          <h2 className="text-2xl sm:text-3xl text-warm-primary font-semibold text-center mb-12"
            style={{ fontFamily: "var(--font-playfair)" }}>
            A life preserved in three steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { number: "01", title: "Add them to the record", body: "Name, dates, story, and the places that mattered. Completely free. Takes minutes." },
              { number: "02", title: "Build their story", body: "Family and friends add memories, connect relatives, and pin locations. A life, not just a listing." },
              { number: "03", title: "Remembered forever", body: "Their profile lives on permanently — searchable, enrichable, and one day, transmitted to the stars." },
            ].map((step) => (
              <div key={step.number} className="card-surface rounded-card p-7 transition-all duration-200 hover:shadow-flame">
                <p className="text-3xl font-bold mb-4" style={{
                  fontFamily: "var(--font-playfair)",
                  background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {step.number}
                </p>
                <h3 className="text-warm-primary text-lg font-semibold mb-3"
                  style={{ fontFamily: "var(--font-playfair)" }}>{step.title}</h3>
                <p className="text-warm-secondary leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Remembered */}
      {recentProfiles.length > 0 && (
        <section className="border-t border-[rgba(245,158,11,0.08)] py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="small-caps mb-2">Recently remembered</p>
                <h2 className="text-2xl sm:text-3xl text-warm-primary font-semibold"
                  style={{ fontFamily: "var(--font-playfair)" }}>
                  Lives added to the record
                </h2>
              </div>
              <Link href="/search" className="text-sm text-warm-secondary hover:text-flame transition-colors">
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} location={locationMap[profile.id] ?? null} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission Quote */}
      <section className="border-t border-[rgba(245,158,11,0.08)] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xl sm:text-2xl text-warm-secondary italic leading-relaxed"
            style={{ fontFamily: "var(--font-playfair)" }}>
            &ldquo;The ones who came before us deserve to be more than a name nobody recognizes on a headstone nobody visits.&rdquo;
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create"
              className="px-8 py-3.5 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              Remember Someone — Free
            </Link>
            <Link href="/start"
              className="px-8 py-3.5 rounded-button text-warm-primary font-semibold text-base border border-[rgba(245,158,11,0.35)] hover:border-flame hover:text-flame transition-all duration-200">
              Start Your Eternaflame
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
