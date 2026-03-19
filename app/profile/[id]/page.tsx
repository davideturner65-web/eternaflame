import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Profile,
  FamilyRelationship,
  formatDate,
  formatLifespan,
  getInitials,
  getDisplayName,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: { id: string };
  searchParams: { new?: string };
}

async function getProfile(id: string): Promise<{
  profile: Profile;
  relationships: FamilyRelationship[];
} | null> {
  try {
    const supabase = createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("privacy", "public")
      .single();

    if (error || !profile) return null;

    const { data: relationships } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("profile_id", id)
      .order("relationship");

    return { profile, relationships: relationships ?? [] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const result = await getProfile(params.id);
  if (!result) return { title: "Profile not found" };

  const { profile } = result;
  const name = getDisplayName(profile);
  const lifespan = formatLifespan(profile.date_of_birth, profile.date_of_death);
  const description =
    profile.personality
      ? `"${profile.personality}" — ${name}${lifespan ? ` · ${lifespan}` : ""}`
      : `${name}${lifespan ? ` · ${lifespan}` : ""}. Remembered on Eternaflame.`;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Eternaflame`,
      description,
      type: "profile",
    },
  };
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const result = await getProfile(params.id);
  if (!result) notFound();

  const { profile, relationships } = result;
  const isNew = searchParams.new === "1";

  const displayName = getDisplayName(profile);
  const initials = getInitials(profile);

  const survivingFamily = relationships.filter((r) => r.status === "surviving");
  const precededBy = relationships.filter((r) => r.status === "predeceased");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      {/* New profile confirmation banner */}
      {isNew && (
        <div className="mb-8 p-5 rounded-card border border-[rgba(196,164,105,0.3)] bg-[rgba(196,164,105,0.07)] text-center">
          <p
            className="text-[#C4A869] text-lg font-semibold"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            ✦ {profile.first_name} is now remembered.
          </p>
          <p className="text-[#A8A29E] text-sm mt-1">
            Their story is part of the permanent record.
          </p>
        </div>
      )}

      {/* Back link */}
      <Link
        href="/search"
        className="text-[#78716C] text-sm hover:text-[#A8A29E] transition-colors inline-flex items-center gap-1 mb-8"
      >
        &larr; Back to search
      </Link>

      {/* Identity hero */}
      <div className="flex flex-col items-center text-center mb-12">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-[#1C1917] mb-5"
          style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}
        >
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold text-[#E7E0D5] leading-snug"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {profile.first_name}
          {profile.nickname && (
            <span className="text-[#A8A29E]"> &ldquo;{profile.nickname}&rdquo;</span>
          )}
          {profile.middle_name && ` ${profile.middle_name}`}
          {` ${profile.last_name}`}
          {profile.suffix && ` ${profile.suffix}`}
        </h1>

        {(profile.date_of_birth || profile.date_of_death) && (
          <p className="text-[#78716C] text-sm mt-2 tabular-nums">
            {formatDate(profile.date_of_birth)}
            {profile.date_of_birth && profile.date_of_death && " — "}
            {formatDate(profile.date_of_death)}
            {profile.age_at_death && ` · Age ${profile.age_at_death}`}
          </p>
        )}

        {profile.residence && (
          <p className="text-[#A8A29E] text-sm mt-1.5 flex items-center gap-1">
            <span>📍</span>
            {profile.residence}
          </p>
        )}

        {profile.personality && (
          <p
            className="mt-6 text-[#C4A869] text-lg sm:text-xl italic leading-relaxed max-w-xl"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            &ldquo;{profile.personality}&rdquo;
          </p>
        )}
      </div>

      {/* Life sections */}
      <div className="flex flex-col gap-10">
        {/* Career */}
        {profile.career && (
          <ProfileSection label="Career">
            <p className="text-[#E7E0D5] leading-relaxed">{profile.career}</p>
          </ProfileSection>
        )}

        {/* Education */}
        {profile.education && (
          <ProfileSection label="Education">
            <p className="text-[#E7E0D5] leading-relaxed">{profile.education}</p>
          </ProfileSection>
        )}

        {/* Military */}
        {profile.military_branch && (
          <ProfileSection label="Military Service">
            <p className="text-[#E7E0D5]">
              {[
                profile.military_rank,
                profile.military_branch,
                profile.military_conflict,
                profile.military_years,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {profile.military_honors && profile.military_honors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.military_honors.map((honor) => (
                  <span
                    key={honor}
                    className="text-xs px-3 py-1 rounded-pill border border-[rgba(196,164,105,0.3)] text-[#C4A869]"
                  >
                    {honor}
                  </span>
                ))}
              </div>
            )}
          </ProfileSection>
        )}

        {/* Faith */}
        {profile.faith && (
          <ProfileSection label="Faith & Community">
            <p className="text-[#E7E0D5] leading-relaxed">{profile.faith}</p>
          </ProfileSection>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <ProfileSection label="Interests">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-sm px-3 py-1.5 rounded-pill border border-[rgba(196,164,105,0.3)] text-[#C4A869]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Family */}
        {relationships.length > 0 && (
          <ProfileSection label="Family">
            {survivingFamily.length > 0 && (
              <div className="mb-4">
                <p className="text-[#78716C] text-xs mb-3">Survived by</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {survivingFamily.map((rel) => (
                    <FamilyCard key={rel.id} rel={rel} />
                  ))}
                </div>
              </div>
            )}
            {precededBy.length > 0 && (
              <div>
                <p className="text-[#78716C] text-xs mb-3">Preceded in passing by</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {precededBy.map((rel) => (
                    <FamilyCard key={rel.id} rel={rel} />
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>
        )}

        {/* Places */}
        {(profile.birth_place || profile.residence || profile.burial_place) && (
          <ProfileSection label="Places">
            <div className="flex flex-col gap-3">
              {profile.birth_place && (
                <PlaceRow label="Born" value={profile.birth_place} />
              )}
              {profile.residence && (
                <PlaceRow label="Lived" value={profile.residence} />
              )}
              {profile.death_place && profile.death_place !== profile.residence && (
                <PlaceRow label="Passed" value={profile.death_place} />
              )}
              {profile.burial_place && (
                <PlaceRow label="Resting place" value={profile.burial_place} />
              )}
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
              <a
                href={profile.obituary_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A8A29E] hover:text-[#C4A869] transition-colors"
              >
                {profile.obituary_source}
              </a>
            ) : (
              <span className="text-[#A8A29E]">{profile.obituary_source}</span>
            )}
          </p>
        </div>
      )}

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: displayName,
            givenName: profile.first_name,
            familyName: profile.last_name,
            birthDate: profile.date_of_birth,
            deathDate: profile.date_of_death,
            birthPlace: profile.birth_place,
            address: profile.residence,
            description: profile.personality,
            jobTitle: profile.career,
            alumniOf: profile.education,
          }),
        }}
      />
    </div>
  );
}

function ProfileSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[#78716C] small-caps mb-3">{label}</p>
      {children}
    </section>
  );
}

function FamilyCard({ rel }: { rel: FamilyRelationship }) {
  return (
    <div className="card-surface rounded-card p-3.5">
      {rel.related_profile_id ? (
        <Link
          href={`/profile/${rel.related_profile_id}`}
          className="text-[#E7E0D5] text-sm font-medium hover:text-[#C4A869] transition-colors"
        >
          {rel.related_name}
        </Link>
      ) : (
        <p className="text-[#E7E0D5] text-sm font-medium">{rel.related_name}</p>
      )}
      <p className="text-[#78716C] text-xs mt-0.5 capitalize">{rel.relationship}</p>
    </div>
  );
}

function PlaceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base mt-0.5">📍</span>
      <div>
        <p className="text-[#78716C] text-xs">{label}</p>
        <p className="text-[#E7E0D5] text-sm">{value}</p>
      </div>
    </div>
  );
}
