import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import DiscoverCard from "@/components/ui/DiscoverCard";
import { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getRecentProfiles(): Promise<Profile[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("privacy", "public")
      .eq("profile_status", "published")
      .order("created_at", { ascending: false })
      .limit(6);
    return data ?? [];
  } catch {
    return [];
  }
}

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

export default async function Home() {
  const [recentProfiles, featuredProfile] = await Promise.all([
    getRecentProfiles(),
    getRandomProfile(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(196,164,105,0.07) 0%, transparent 70%)",
          }}
        />

        <p className="text-[#C4A869] text-xs tracking-[0.2em] uppercase mb-5 font-semibold">
          An index of every human life
        </p>

        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#E7E0D5] leading-tight max-w-3xl"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          You will not be forgotten.
        </h1>

        <p className="mt-6 text-[#A8A29E] text-lg sm:text-xl max-w-2xl leading-relaxed">
          In three generations, everyone who knew you will be gone. We&rsquo;re building the reason
          that stops being true.{" "}
          <span className="text-[#E7E0D5]">
            Remembering someone shouldn&rsquo;t cost anything.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link
            href="/create"
            className="px-7 py-3.5 rounded-button text-[#1C1917] font-semibold text-base transition-all duration-200 hover:opacity-90 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}
          >
            Remember Someone — Free
          </Link>
          <Link
            href="/search"
            className="px-7 py-3.5 rounded-button text-[#E7E0D5] font-semibold text-base border border-[rgba(196,164,105,0.4)] hover:border-[#C4A869] hover:text-[#C4A869] transition-all duration-200"
          >
            Search the Record
          </Link>
        </div>
      </section>

      <div className="w-full border-t border-[rgba(196,164,105,0.1)]" />

      {/* Discover a Life */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-[#C4A869] small-caps mb-1">Discover a life</p>
            <h2
              className="text-2xl sm:text-3xl text-[#E7E0D5] font-semibold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Meet someone you&rsquo;ve never known
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-sm text-[#A8A29E] hover:text-[#C4A869] transition-colors hidden sm:block"
          >
            Browse all lives &rarr;
          </Link>
        </div>

        {featuredProfile ? (
          <DiscoverCard profile={featuredProfile} />
        ) : (
          <div className="card-surface rounded-card p-10 text-center text-[#78716C]">
            <p>No profiles yet. Be the first to remember someone.</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <Link
            href="/discover"
            className="text-sm text-[#C4A869] border border-[rgba(196,164,105,0.3)] px-4 py-2 rounded-button hover:bg-[rgba(196,164,105,0.08)] transition-all"
          >
            Discover someone else
          </Link>
          <Link
            href="/discover"
            className="text-sm text-[#A8A29E] hover:text-[#E7E0D5] transition-colors sm:hidden"
          >
            Browse all lives &rarr;
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[rgba(196,164,105,0.1)] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-[#C4A869] small-caps mb-2 text-center">How it works</p>
          <h2
            className="text-2xl sm:text-3xl text-[#E7E0D5] font-semibold text-center mb-12"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            A life preserved in three steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: "01",
                title: "Create a profile",
                body: "Add your loved one's name, dates, story, and the places that mattered to them. Completely free.",
              },
              {
                number: "02",
                title: "Build their story",
                body: "Family and friends add memories, connect relatives, and pin locations on the map. A life, not just a listing.",
              },
              {
                number: "03",
                title: "Remembered forever",
                body: "Their profile lives on permanently — searchable, enrichable, and one day, transmitted to the stars.",
              },
            ].map((step) => (
              <div key={step.number} className="card-surface rounded-card p-7">
                <p
                  className="text-3xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-playfair)",
                    background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {step.number}
                </p>
                <h3
                  className="text-[#E7E0D5] text-lg font-semibold mb-3"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {step.title}
                </h3>
                <p className="text-[#A8A29E] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Remembered */}
      {recentProfiles.length > 0 && (
        <section className="border-t border-[rgba(196,164,105,0.1)] py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="text-[#C4A869] small-caps mb-1">Recently remembered</p>
                <h2
                  className="text-2xl sm:text-3xl text-[#E7E0D5] font-semibold"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Lives added to the record
                </h2>
              </div>
              <Link
                href="/search"
                className="text-sm text-[#A8A29E] hover:text-[#C4A869] transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} size="md" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission Quote */}
      <section className="border-t border-[rgba(196,164,105,0.1)] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-xl sm:text-2xl text-[#A8A29E] italic leading-relaxed"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            &ldquo;The ones who came before us deserve to be more than a name nobody recognizes on a
            headstone nobody visits.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}
