import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { generateProfileSlug } from "@/lib/slugs";
import type { Profile, ProfileLocation } from "@/types/profile";

interface Props { params: { id: string } }

/**
 * Legacy profile URL — /profile/[uuid]
 * 301 redirects to the canonical slug URL.
 */
export default async function ProfileRedirectPage({ params }: Props) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, first_name, last_name, birth_year, death_year, privacy")
    .eq("id", params.id)
    .eq("privacy", "public")
    .single();

  if (!profile) notFound();

  // Use stored slug if available; otherwise generate on the fly
  let slugPath = (profile as Profile & { slug?: string }).slug;

  if (!slugPath) {
    const { data: locs } = await supabase
      .from("profile_locations")
      .select("city, state_abbreviation")
      .eq("profile_id", profile.id)
      .order("is_current", { ascending: false })
      .limit(1);

    slugPath = generateProfileSlug(profile as Profile, locs?.[0] as ProfileLocation | null);
  }

  redirect(`/${slugPath}`, 301 as never);
}
