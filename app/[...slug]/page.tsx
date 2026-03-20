import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Profile, ProfileLocation, ProfileMilitary, ProfileEducation,
  ProfileOccupation, ProfileAffiliation, FamilyConnection, Memory,
  getDisplayName, getInitials, formatLifespan, getPrimaryLocation,
} from "@/types/profile";
import { slugArrayToString, profileUrl } from "@/lib/slugs";

interface Props { params: { slug: string[] } }

async function getProfileBySlug(slugStr: string) {
  try {
    const supabase = createClient();
    const [
      { data: profile },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("slug", slugStr).eq("privacy", "public").single(),
    ]);
    if (!profile) return null;

    const [
      { data: locations },
      { data: military },
      { data: education },
      { data: occupations },
      { data: affiliations },
      { data: family },
      { data: memories },
      { data: geoPins },
    ] = await Promise.all([
      supabase.from("profile_locations").select("*").eq("profile_id", profile.id),
      supabase.from("profile_military").select("*").eq("profile_id", profile.id),
      supabase.from("profile_education").select("*").eq("profile_id", profile.id),
      supabase.from("profile_occupations").select("*").eq("profile_id", profile.id),
      supabase.from("profile_affiliations").select("*").eq("profile_id", profile.id),
      supabase.from("family_connections").select("*").eq("profile_id", profile.id),
      supabase.from("memories").select("*").eq("profile_id", profile.id).eq("is_approved", true).order("created_at", { ascending: false }),
      supabase.from("geo_pins").select("*").eq("profile_id", profile.id).eq("privacy", "public"),
    ]);

    return {
      profile: profile as Profile,
      locations: (locations ?? []) as ProfileLocation[],
      military: (military ?? []) as ProfileMilitary[],
      education: (education ?? []) as ProfileEducation[],
      occupations: (occupations ?? []) as ProfileOccupation[],
      affiliations: (affiliations ?? []) as ProfileAffiliation[],
      family: (family ?? []) as FamilyConnection[],
      memories: (memories ?? []) as Memory[],
      geoPins: geoPins ?? [],
    };
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugStr = slugArrayToString(params.slug);
  const result = await getProfileBySlug(slugStr);
  if (!result) return { title: "Not found" };

  const { profile } = result;
  const firstName = profile.first_name;
  const lastName = profile.last_name;
  const supabase = createClient();
  const { data: locs } = await supabase
    .from("profile_locations")
    .select("city, state_abbreviation")
    .eq("profile_id", profile.id)
    .limit(1);
  const loc = locs?.[0];

  const locationStr = loc?.city && loc?.state_abbreviation
    ? `, ${loc.city} ${loc.state_abbreviation}`
    : loc?.city ? `, ${loc.city}` : "";

  const lifeStr = profile.birth_year && profile.death_year
    ? ` (${profile.birth_year}–${profile.death_year})`
    : profile.birth_year && !profile.death_year
    ? ` (born ${profile.birth_year})`
    : profile.birth_year || profile.death_year
    ? ` (${profile.birth_year || ""}–${profile.death_year || ""})`
    : "";

  const title = `${firstName} ${lastName}${locationStr}${lifeStr}`;

  const description = profile.biography
    ? profile.biography.slice(0, 160)
    : profile.personality_summary
    ? profile.personality_summary.slice(0, 160)
    : `${firstName} ${lastName} lived in ${loc?.city ?? "the United States"}. Their life is preserved permanently in the Eternaflame record.`;

  const canonical = `https://eternaflame.org/${slugStr}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Eternaflame`,
      description,
      url: canonical,
      type: "profile",
    },
  };
}

export default async function ProfileSlugPage({ params }: Props) {
  const slugStr = slugArrayToString(params.slug);
  const result = await getProfileBySlug(slugStr);
  if (!result) notFound();

  const { profile, locations, military, education, occupations, affiliations, family, memories } = result;
  const displayName = getDisplayName(profile);
  const initials = getInitials(profile);
  const primaryLocation = getPrimaryLocation(locations);
  const isLiving = !profile.death_date && !profile.death_year;

  const surviving = family.filter(f => f.surviving !== false);
  const predeceased = family.filter(f => f.surviving === false);
  const birthLoc = locations.find(l => l.location_type === "born");
  const buriedLoc = locations.find(l => l.location_type === "buried");
  const livedLocs = locations.filter(l => l.location_type === "lived");

  // Format dates as full month names
  function formatFullDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch { return null; }
  }

  const birthDisplay = formatFullDate(profile.birth_date) ?? profile.birth_year?.toString() ?? null;
  const deathDisplay = formatFullDate(profile.death_date) ?? profile.death_year?.toString() ?? null;

  // Schema.org Person structured data
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    givenName: profile.first_name,
    additionalName: profile.middle_name,
    familyName: profile.last_name,
    ...(profile.birth_date && { birthDate: profile.birth_date }),
    ...(profile.death_date && { deathDate: profile.death_date }),
    ...(profile.personality_summary && { description: profile.personality_summary }),
    ...(primaryLocation && {
      homeLocation: {
        "@type": "Place",
        name: [primaryLocation.city, primaryLocation.state_abbreviation].filter(Boolean).join(", "),
      },
    }),
    ...(occupations.length > 0 && {
      jobTitle: occupations[0].job_title,
      worksFor: occupations[0].employer_name ? { "@type": "Organization", name: occupations[0].employer_name } : undefined,
    }),
    ...(education.length > 0 && {
      alumniOf: education.map(e => ({ "@type": "EducationalOrganization", name: e.institution_name })),
    }),
    url: `https://eternaflame.org/${slugStr}`,
  };

  return (
    <div className="animate-fade-in">
      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/search" className="text-warm-tertiary text-sm hover:text-warm-secondary transition-colors inline-flex items-center gap-1 mb-10">
          &larr; Back to search
        </Link>

        {/* Identity hero */}
        <div className="flex flex-col items-center text-center mb-14">
          {/* Monogram avatar */}
          <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-[#0d0f0e] mb-6 shadow-flame-lg"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
            {initials}
          </div>

          {/* Name */}
          <h1 className="text-4xl sm:text-5xl font-bold text-warm-primary leading-snug"
            style={{ fontFamily: "var(--font-playfair)" }}>
            {profile.first_name}
            {profile.nickname && (
              <span className="text-warm-secondary"> &ldquo;{profile.nickname}&rdquo;</span>
            )}
            {profile.middle_name && ` ${profile.middle_name}`}
            {` ${profile.last_name}`}
            {profile.name_suffix && ` ${profile.name_suffix}`}
            {isLiving && (
              <span className="ml-2 flame-living" title="Living">🔥</span>
            )}
          </h1>

          {/* Dates */}
          {(birthDisplay || deathDisplay) && (
            <p className="text-warm-tertiary text-base mt-3">
              {birthDisplay}
              {birthDisplay && deathDisplay && " — "}
              {deathDisplay}
              {profile.age_at_death && ` · ${profile.age_at_death} years`}
            </p>
          )}

          {/* Location */}
          {primaryLocation && (
            <p className="text-warm-secondary text-sm mt-2">
              {[primaryLocation.city, primaryLocation.state_abbreviation, primaryLocation.country !== "USA" ? primaryLocation.country : null].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Personality pull quote */}
          {profile.personality_summary && (
            <p className="pull-quote mt-8 max-w-xl">
              &ldquo;{profile.personality_summary}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col gap-12">
          {/* Biography */}
          <ProfileSection label="Their Story">
            {profile.biography ? (
              <div className="biography-text whitespace-pre-line">{profile.biography}</div>
            ) : (
              <p className="text-warm-tertiary italic">
                No story written yet. Be the first to tell it.{" "}
                <Link href={`/create`} className="text-flame hover:underline">Add their story</Link>
              </p>
            )}
          </ProfileSection>

          {/* Career */}
          {occupations.length > 0 && (
            <ProfileSection label="Career">
              <div className="flex flex-col gap-4">
                {occupations.map((occ) => (
                  <div key={occ.id} className="border-l-2 border-[rgba(245,158,11,0.3)] pl-4">
                    {(occ.job_title || occ.employer_name) && (
                      <p className="text-warm-primary font-medium">
                        {[occ.job_title, occ.employer_name].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {(occ.start_year || occ.end_year) && (
                      <p className="text-warm-tertiary text-sm mt-0.5">
                        {occ.start_year}{occ.start_year && occ.end_year ? "–" : ""}{occ.end_year || (occ.was_retired ? "retired" : "")}
                      </p>
                    )}
                    {occ.notes && <p className="text-warm-secondary text-sm mt-1">{occ.notes}</p>}
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Education */}
          {education.length > 0 && (
            <ProfileSection label="Education">
              <div className="flex flex-col gap-3">
                {education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-[rgba(245,158,11,0.3)] pl-4">
                    <p className="text-warm-primary font-medium">{edu.institution_name}</p>
                    {(edu.degree || edu.field_of_study) && (
                      <p className="text-warm-secondary text-sm">{[edu.degree, edu.field_of_study].filter(Boolean).join(", ")}</p>
                    )}
                    {edu.graduation_year && (
                      <p className="text-warm-tertiary text-sm">Class of {edu.graduation_year}</p>
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
                <div key={mil.id} className="flex flex-col gap-3">
                  <p className="text-warm-primary font-medium">
                    {[mil.rank, mil.branch].filter(Boolean).join(", ")}
                  </p>
                  {mil.conflict && <p className="text-warm-secondary text-sm">{mil.conflict}</p>}
                  {(mil.service_start_year || mil.service_end_year) && (
                    <p className="text-warm-tertiary text-sm">
                      {mil.service_start_year}{mil.service_start_year && mil.service_end_year ? "–" : ""}{mil.service_end_year}
                    </p>
                  )}
                  {mil.campaign_medals && mil.campaign_medals.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mil.campaign_medals.map(m => (
                        <span key={m} className="text-xs px-3 py-1 rounded-pill border border-[rgba(245,158,11,0.3)] text-flame">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {mil.unit && <p className="text-warm-secondary text-sm">{mil.unit}</p>}
                </div>
              ))}
              {/* Link to conflict cluster */}
              {military[0]?.conflict && (
                <Link
                  href={`/military/${military[0].conflict.toLowerCase().replace(/\s+/g, "-")}/`}
                  className="text-sm text-flame hover:underline mt-3 inline-block"
                >
                  More {military[0].conflict} veterans in the record &rarr;
                </Link>
              )}
            </ProfileSection>
          )}

          {/* Faith & Affiliations */}
          {affiliations.length > 0 && (
            <ProfileSection label="Faith & Community">
              <div className="flex flex-col gap-2">
                {affiliations.map((aff) => (
                  <div key={aff.id} className="flex items-start gap-2">
                    <span className="text-flame mt-0.5">·</span>
                    <div>
                      <span className="text-warm-primary">{aff.organization_name}</span>
                      {aff.role_or_title && (
                        <span className="text-warm-secondary text-sm"> · {aff.role_or_title}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <ProfileSection label="Interests &amp; Passions">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <span key={i} className="text-sm px-3 py-1.5 rounded-pill border border-[rgba(245,158,11,0.3)] text-flame">
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
                <div className="mb-6">
                  <p className="text-warm-tertiary text-xs mb-3 uppercase tracking-widest">Survived by</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {surviving.map((rel) => <FamilyCard key={rel.id} rel={rel} />)}
                  </div>
                </div>
              )}
              {predeceased.length > 0 && (
                <div>
                  <p className="text-warm-tertiary text-xs mb-3 uppercase tracking-widest">Preceded in passing by</p>
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
              <div className="flex flex-col gap-4">
                {birthLoc && <PlaceRow label="Born" loc={birthLoc} />}
                {livedLocs.map(l => <PlaceRow key={l.id} label="Lived" loc={l} />)}
                {buriedLoc && <PlaceRow label="Resting place" loc={buriedLoc} />}
              </div>
              {/* Link to location cluster */}
              {primaryLocation?.city && primaryLocation?.state_abbreviation && (
                <Link
                  href={`/lives/${primaryLocation.state_abbreviation.toLowerCase()}/`}
                  className="text-sm text-flame hover:underline mt-4 inline-block"
                >
                  More lives remembered in {primaryLocation.city}, {primaryLocation.state_abbreviation} &rarr;
                </Link>
              )}
            </ProfileSection>
          )}

          {/* Memories */}
          <ProfileSection label="Memories">
            {memories.length > 0 ? (
              <div className="flex flex-col gap-5">
                {memories.map((mem) => (
                  <div key={mem.id} className="card-surface rounded-card p-6 transition-all duration-200">
                    {mem.title && (
                      <p className="text-warm-primary font-semibold mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
                        {mem.title}
                      </p>
                    )}
                    {mem.content && (
                      <p className="text-warm-secondary text-base leading-relaxed italic"
                        style={{ fontFamily: "var(--font-playfair)" }}>
                        &ldquo;{mem.content}&rdquo;
                      </p>
                    )}
                    <p className="text-warm-tertiary text-xs mt-4">
                      {mem.contributor_name && `Added by ${mem.contributor_name}`}
                      {mem.contributor_relation && `, ${mem.contributor_relation}`}
                      {mem.date_of_memory && ` · ${formatFullDate(mem.date_of_memory)}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-warm-tertiary italic">
                No memories added yet. Do you have one?{" "}
                <Link href={`/create`} className="text-flame hover:underline">Add a memory</Link>
              </p>
            )}
          </ProfileSection>

          {/* Honor their memory */}
          <section className="border-t border-[rgba(245,158,11,0.1)] pt-10 text-center">
            <p className="text-warm-secondary text-sm mb-4 uppercase tracking-widest">Honor their memory</p>
            <h2 className="text-2xl text-warm-primary mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
              Know someone whose story belongs here?
            </h2>
            <Link href="/create"
              className="inline-block px-8 py-3.5 rounded-button text-[#0d0f0e] font-semibold text-base transition-all duration-200 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
              Remember Someone — Free
            </Link>
          </section>
        </div>

        {/* Source */}
        {profile.obituary_source && (
          <div className="mt-12 pt-6 border-t border-[rgba(245,158,11,0.08)]">
            <p className="text-warm-tertiary text-xs">
              Source:{" "}
              {profile.obituary_url ? (
                <a href={profile.obituary_url} target="_blank" rel="noopener noreferrer"
                  className="text-warm-secondary hover:text-flame transition-colors">
                  {profile.obituary_source}
                </a>
              ) : (
                <span className="text-warm-secondary">{profile.obituary_source}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="small-caps mb-4" dangerouslySetInnerHTML={{ __html: label }} />
      {children}
    </section>
  );
}

function FamilyCard({ rel }: { rel: FamilyConnection }) {
  return (
    <div className="card-surface rounded-card p-4 transition-all duration-200">
      {rel.related_profile_id ? (
        <Link href={`/profile/${rel.related_profile_id}`}
          className="text-warm-primary text-sm font-medium hover:text-flame transition-colors">
          {rel.name_only}
        </Link>
      ) : (
        <p className="text-warm-primary text-sm font-medium">{rel.name_only}</p>
      )}
      <p className="text-warm-tertiary text-xs mt-1 capitalize">{rel.relation_type.replace(/_/g, " ")}</p>
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

  if (!display) return null;

  return (
    <div className="flex items-start gap-3">
      <span className="text-flame mt-0.5">📍</span>
      <div>
        <p className="text-warm-tertiary text-xs uppercase tracking-wider">{label}</p>
        <p className="text-warm-primary text-sm mt-0.5">{display}</p>
      </div>
    </div>
  );
}
