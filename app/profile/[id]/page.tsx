import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Profile, ProfileLocation, ProfileMilitary, ProfileEducation,
  ProfileOccupation, ProfileAffiliation, FamilyConnection, Memory,
  getDisplayName, getInitials, formatDate, formatLifespan, getPrimaryLocation,
} from "@/types/profile";

export const dynamic = "force-dynamic";

interface Props { params: { id: string }; searchParams: { new?: string } }

async function getProfileFull(id: string) {
  try {
    const supabase = createClient();
    const [
      { data: profile },
      { data: locations },
      { data: military },
      { data: education },
      { data: occupations },
      { data: affiliations },
      { data: family },
      { data: memories },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).eq("privacy", "public").single(),
      supabase.from("profile_locations").select("*").eq("profile_id", id),
      supabase.from("profile_military").select("*").eq("profile_id", id),
      supabase.from("profile_education").select("*").eq("profile_id", id),
      supabase.from("profile_occupations").select("*").eq("profile_id", id),
      supabase.from("profile_affiliations").select("*").eq("profile_id", id),
      supabase.from("family_connections").select("*").eq("profile_id", id),
      supabase.from("memories").select("*").eq("profile_id", id).eq("is_approved", true).order("created_at", { ascending: false }),
    ]);
    if (!profile) return null;
    return {
      profile: profile as Profile,
      locations: (locations ?? []) as ProfileLocation[],
      military: (military ?? []) as ProfileMilitary[],
      education: (education ?? []) as ProfileEducation[],
      occupations: (occupations ?? []) as ProfileOccupation[],
      affiliations: (affiliations ?? []) as ProfileAffiliation[],
      family: (family ?? []) as FamilyConnection[],
      memories: (memories ?? []) as Memory[],
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getProfileFull(params.id);
  if (!result) return { title: "Profile not found" };
  const name = getDisplayName(result.profile);
  const lifespan = formatLifespan(result.profile);
  const description = result.profile.personality_summary
    ? `"${result.profile.personality_summary}" — ${name}${lifespan ? ` · ${lifespan}` : ""}`
    : `${name}${lifespan ? ` · ${lifespan}` : ""}. Remembered on Eternaflame.`;
  return { title: name, description, openGraph: { title: `${name} | Eternaflame`, description } };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const result = await getProfileFull(params.id);
  if (!result) notFound();

  const { profile, locations, military, education, occupations, affiliations, family, memories } = result;
  const isNew = searchParams.new === "1";
  const displayName = getDisplayName(profile);
  const initials = getInitials(profile);
  const primaryLocation = getPrimaryLocation(locations);

  const surviving = family.filter(f => f.surviving !== false);
  const predeceased = family.filter(f => f.surviving === false);

  const birthLoc = locations.find(l => l.location_type === "born");
  const buriedLoc = locations.find(l => l.location_type === "buried");
  const livedLocs = locations.filter(l => l.location_type === "lived");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      {isNew && (
        <div className="mb-8 p-5 rounded-card border border-[rgba(196,164,105,0.3)] bg-[rgba(196,164,105,0.07)] text-center">
          <p className="text-[#C4A869] text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
            ✦ {profile.first_name} is now remembered.
          </p>
          <p className="text-[#A8A29E] text-sm mt-1">Their story is part of the permanent record.</p>
        </div>
      )}

      <Link href="/search" className="text-[#78716C] text-sm hover:text-[#A8A29E] transition-colors inline-flex items-center gap-1 mb-8">
        &larr; Back to search
      </Link>

      {/* Identity hero */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-[#1C1917] mb-5"
          style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
          {initials}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#E7E0D5] leading-snug"
          style={{ fontFamily: "var(--font-playfair)" }}>
          {profile.first_name}
          {profile.nickname && <span className="text-[#A8A29E]"> &ldquo;{profile.nickname}&rdquo;</span>}
          {profile.middle_name && ` ${profile.middle_name}`}
          {` ${profile.last_name}`}
          {profile.name_suffix && ` ${profile.name_suffix}`}
        </h1>

        {(profile.birth_date || profile.death_date || profile.birth_year || profile.death_year) && (
          <p className="text-[#78716C] text-sm mt-2 tabular-nums">
            {formatDate(profile.birth_date) || profile.birth_year}
            {(profile.birth_date || profile.birth_year) && (profile.death_date || profile.death_year) && " — "}
            {formatDate(profile.death_date) || profile.death_year}
            {profile.age_at_death && ` · Age ${profile.age_at_death}`}
          </p>
        )}

        {primaryLocation && (
          <p className="text-[#A8A29E] text-sm mt-1.5 flex items-center gap-1">
            <span>📍</span>
            {[primaryLocation.city, primaryLocation.state_abbreviation].filter(Boolean).join(", ")}
          </p>
        )}

        {profile.personality_summary && (
          <p className="mt-6 text-[#C4A869] text-lg sm:text-xl italic leading-relaxed max-w-xl"
            style={{ fontFamily: "var(--font-playfair)" }}>
            &ldquo;{profile.personality_summary}&rdquo;
          </p>
        )}
      </div>

      <div className="flex flex-col gap-10">
        {/* Biography */}
        {profile.biography && (
          <ProfileSection label="Life Story">
            <p className="text-[#E7E0D5] leading-relaxed whitespace-pre-line">{profile.biography}</p>
          </ProfileSection>
        )}

        {/* Career */}
        {occupations.length > 0 && (
          <ProfileSection label="Career">
            <div className="flex flex-col gap-3">
              {occupations.map((occ) => (
                <div key={occ.id}>
                  {(occ.job_title || occ.employer_name) && (
                    <p className="text-[#E7E0D5]">
                      {[occ.job_title, occ.employer_name].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {occ.notes && <p className="text-[#A8A29E] text-sm mt-0.5">{occ.notes}</p>}
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <ProfileSection label="Education">
            <div className="flex flex-col gap-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-[#E7E0D5]">{edu.institution_name}</p>
                  {(edu.degree || edu.field_of_study) && (
                    <p className="text-[#A8A29E] text-sm">{[edu.degree, edu.field_of_study].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Military */}
        {military.length > 0 && (
          <ProfileSection label="Military Service">
            {military.map((mil) => (
              <div key={mil.id}>
                <p className="text-[#E7E0D5]">
                  {[mil.rank, mil.branch, mil.conflict, mil.service_start_year && mil.service_end_year
                    ? `${mil.service_start_year}–${mil.service_end_year}` : null]
                    .filter(Boolean).join(" · ")}
                </p>
                {mil.campaign_medals && mil.campaign_medals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mil.campaign_medals.map(m => (
                      <span key={m} className="text-xs px-3 py-1 rounded-pill border border-[rgba(196,164,105,0.3)] text-[#C4A869]">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ProfileSection>
        )}

        {/* Faith & Affiliations */}
        {affiliations.length > 0 && (
          <ProfileSection label="Faith & Community">
            <div className="flex flex-col gap-1.5">
              {affiliations.map((aff) => (
                <p key={aff.id} className="text-[#E7E0D5]">
                  {aff.organization_name}
                  {aff.role_or_title && <span className="text-[#A8A29E] text-sm"> · {aff.role_or_title}</span>}
                </p>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <ProfileSection label="Interests">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <span key={i} className="text-sm px-3 py-1.5 rounded-pill border border-[rgba(196,164,105,0.3)] text-[#C4A869]">
                  {i}
                </span>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Family */}
        {family.length > 0 && (
          <ProfileSection label="Family">
            {surviving.length > 0 && (
              <div className="mb-4">
                <p className="text-[#78716C] text-xs mb-3">Survived by</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {surviving.map((rel) => <FamilyCard key={rel.id} rel={rel} />)}
                </div>
              </div>
            )}
            {predeceased.length > 0 && (
              <div>
                <p className="text-[#78716C] text-xs mb-3">Preceded in passing by</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {predeceased.map((rel) => <FamilyCard key={rel.id} rel={rel} />)}
                </div>
              </div>
            )}
          </ProfileSection>
        )}

        {/* Places */}
        {(birthLoc || livedLocs.length > 0 || buriedLoc) && (
          <ProfileSection label="Places">
            <div className="flex flex-col gap-3">
              {birthLoc && <PlaceRow label="Born" loc={birthLoc} />}
              {livedLocs.map(l => <PlaceRow key={l.id} label="Lived" loc={l} />)}
              {buriedLoc && <PlaceRow label="Resting place" loc={buriedLoc} />}
            </div>
          </ProfileSection>
        )}

        {/* Memories */}
        {memories.length > 0 && (
          <ProfileSection label="Memories">
            <div className="flex flex-col gap-4">
              {memories.map((mem) => (
                <div key={mem.id} className="card-surface rounded-card p-5">
                  {mem.title && <p className="text-[#E7E0D5] font-medium mb-2">{mem.title}</p>}
                  {mem.content && <p className="text-[#A8A29E] text-sm leading-relaxed">{mem.content}</p>}
                  <p className="text-[#78716C] text-xs mt-3">
                    {mem.contributor_name && `${mem.contributor_name}`}
                    {mem.contributor_relation && `, ${mem.contributor_relation}`}
                  </p>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}
      </div>

      {/* Source */}
      {profile.obituary_source && (
        <div className="mt-12 pt-6 border-t border-[rgba(196,164,105,0.1)]">
          <p className="text-[#78716C] text-xs">
            Source:{" "}
            {profile.obituary_url ? (
              <a href={profile.obituary_url} target="_blank" rel="noopener noreferrer"
                className="text-[#A8A29E] hover:text-[#C4A869] transition-colors">
                {profile.obituary_source}
              </a>
            ) : (
              <span className="text-[#A8A29E]">{profile.obituary_source}</span>
            )}
          </p>
        </div>
      )}

      {/* Schema.org structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: displayName,
        givenName: profile.first_name,
        familyName: profile.last_name,
        birthDate: profile.birth_date,
        deathDate: profile.death_date,
        description: profile.personality_summary,
      }) }} />
    </div>
  );
}

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[#78716C] small-caps mb-3">{label}</p>
      {children}
    </section>
  );
}

function FamilyCard({ rel }: { rel: FamilyConnection }) {
  return (
    <div className="card-surface rounded-card p-3.5">
      {rel.related_profile_id ? (
        <Link href={`/profile/${rel.related_profile_id}`}
          className="text-[#E7E0D5] text-sm font-medium hover:text-[#C4A869] transition-colors">
          {rel.name_only}
        </Link>
      ) : (
        <p className="text-[#E7E0D5] text-sm font-medium">{rel.name_only}</p>
      )}
      <p className="text-[#78716C] text-xs mt-0.5 capitalize">{rel.relation_type.replace(/_/g, " ")}</p>
    </div>
  );
}

function PlaceRow({ label, loc }: { label: string; loc: ProfileLocation }) {
  const display = [
    loc.cemetery_name,
    loc.neighborhood,
    loc.city,
    loc.state_abbreviation,
    loc.country !== "USA" ? loc.country : null,
  ].filter(Boolean).join(", ");

  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base mt-0.5">📍</span>
      <div>
        <p className="text-[#78716C] text-xs">{label}</p>
        <p className="text-[#E7E0D5] text-sm">{display || "Unknown"}</p>
      </div>
    </div>
  );
}
