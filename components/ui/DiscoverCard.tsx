import Link from "next/link";
import { Profile, ProfileLocation, ProfileMilitary, ProfileOccupation, getInitials, getDisplayName, formatLifespan } from "@/types/profile";

interface DiscoverCardProps {
  profile: Profile;
  location?: ProfileLocation | null;
  military?: ProfileMilitary | null;
  occupation?: ProfileOccupation | null;
}

export default function DiscoverCard({ profile, location, military, occupation }: DiscoverCardProps) {
  const initials = getInitials(profile);
  const displayName = getDisplayName(profile);
  const lifespan = formatLifespan(profile);
  const city = location?.city;
  const state = location?.state_abbreviation;
  const place = city && state ? `${city}, ${state}` : city ?? state ?? null;

  const careerDisplay = occupation?.notes ?? (occupation?.job_title && occupation?.employer_name
    ? `${occupation.job_title}, ${occupation.employer_name}`
    : occupation?.job_title ?? occupation?.employer_name ?? null);

  const militaryDisplay = military
    ? [military.rank, military.branch, military.conflict].filter(Boolean).join(" · ")
    : null;

  return (
    <Link href={`/profile/${profile.id}`} className="block group">
      <article className="card-surface rounded-card p-7 sm:p-9 hover:border-[rgba(196,164,105,0.35)] hover:bg-[rgba(196,164,105,0.07)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-[#1C1917]"
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#E7E0D5] group-hover:text-[#C4A869] transition-colors leading-snug"
              style={{ fontFamily: "var(--font-playfair)" }}>
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {lifespan && <span className="text-[#78716C] text-sm tabular-nums">{lifespan}</span>}
              {place && (
                <span className="text-[#A8A29E] text-sm flex items-center gap-1">
                  <span>📍</span>{place}
                </span>
              )}
            </div>

            {profile.personality_summary && (
              <p className="mt-4 text-[#C4A869] text-base sm:text-lg italic leading-relaxed"
                style={{ fontFamily: "var(--font-playfair)" }}>
                &ldquo;{profile.personality_summary}&rdquo;
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {careerDisplay && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Career</p>
                  <p className="text-[#A8A29E] text-sm leading-snug">{careerDisplay}</p>
                </div>
              )}
              {militaryDisplay && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Military</p>
                  <p className="text-[#A8A29E] text-sm">{militaryDisplay}</p>
                </div>
              )}
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.interests.map((i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-pill text-[#C4A869] border border-[rgba(196,164,105,0.3)]">
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
