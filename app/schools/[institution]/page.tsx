import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ui/ProfileCard";
import { Profile } from "@/types/profile";

export const revalidate = 86400;

interface Props { params: { institution: string } }

function slugToName(slug: string): string {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function getSchoolData(institutionSlug: string) {
  try {
    const supabase = createClient();

    // Try normalized name first, then fuzzy
    const { data: eduData, count } = await supabase
      .from("profile_education")
      .select("profile_id, institution_name, graduation_year", { count: "exact" })
      .or(`institution_name_normalized.eq.${institutionSlug},institution_name_normalized.ilike.%${institutionSlug.replace(/-/g, "%")}%`);

    if (!eduData?.length) return null;

    const institutionName = eduData[0].institution_name;
    const profileIds = [...new Set(eduData.map(e => e.profile_id))].slice(0, 24);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug, first_name, last_name, birth_year, death_year, personality_summary, interests, privacy")
      .in("id", profileIds)
      .eq("privacy", "public");

    return {
      institutionName,
      profiles: (profiles ?? []) as Profile[],
      total: count ?? 0,
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getSchoolData(params.institution);
  const name = data?.institutionName ?? slugToName(params.institution);
  const count = data?.total ?? 0;
  return {
    title: `${name} Alumni | Eternaflame Memorial Record`,
    description: `${count.toLocaleString()} ${name} alumni preserved in the Eternaflame record. Browse memorial profiles and life stories of alumni remembered forever.`,
    alternates: { canonical: `https://eternaflame.org/schools/${params.institution}/` },
  };
}

export default async function SchoolPage({ params }: Props) {
  const data = await getSchoolData(params.institution);
  const institutionName = data?.institutionName ?? slugToName(params.institution);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
      <nav className="text-sm text-warm-tertiary mb-8">
        <Link href="/schools/" className="hover:text-flame transition-colors">Schools</Link>
        <span className="mx-2">›</span>
        <span className="text-warm-secondary">{institutionName}</span>
      </nav>

      <p className="small-caps mb-2">Alumni in the record</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary mb-3 leading-tight"
        style={{ fontFamily: "var(--font-playfair)" }}>
        {institutionName} Alumni
      </h1>
      {data && (
        <p className="text-warm-secondary text-lg mb-10">
          {data.total.toLocaleString()} alumni in the record
        </p>
      )}

      {data?.profiles && data.profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-card p-10 text-center">
          <p className="text-warm-tertiary">
            No {institutionName} alumni in the record yet. Know an alum?{" "}
            <Link href="/create" className="text-flame hover:underline">Add them</Link>
          </p>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between">
        <Link href="/schools/" className="text-warm-tertiary text-sm hover:text-warm-secondary transition-colors">
          &larr; All schools
        </Link>
        <Link href="/search" className="text-flame text-sm hover:underline">Search all lives &rarr;</Link>
      </div>
    </div>
  );
}
