import Link from "next/link";
import { Profile, formatLifespan, getInitials } from "@/lib/types";

interface DiscoverCardProps {
  profile: Profile;
}

export default function DiscoverCard({ profile }: DiscoverCardProps) {
  const initials = getInitials(profile);
  const lifespan = formatLifespan(profile.date_of_birth, profile.date_of_death);

  const displayName = [
    profile.first_name,
    profile.nickname ? `"${profile.nickname}"` : null,
    profile.middle_name,
    profile.last_name,
    profile.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={`/profile/${profile.id}`} className="block group">
      <article className="card-surface rounded-card p-7 sm:p-9 hover:border-[rgba(196,164,105,0.35)] hover:bg-[rgba(196,164,105,0.07)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          {/* Initials */}
          <div
            className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-[#1C1917]"
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

          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#E7E0D5] group-hover:text-[#C4A869] transition-colors leading-snug"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {displayName}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {lifespan && (
                <span className="text-[#78716C] text-sm tabular-nums">{lifespan}</span>
              )}
              {profile.residence && (
                <span className="text-[#A8A29E] text-sm flex items-center gap-1">
                  <span>📍</span>
                  {profile.residence}
                </span>
              )}
            </div>

            {profile.personality && (
              <p
                className="mt-4 text-[#C4A869] text-base sm:text-lg italic leading-relaxed"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                &ldquo;{profile.personality}&rdquo;
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.career && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Career</p>
                  <p className="text-[#A8A29E] text-sm leading-snug">{profile.career}</p>
                </div>
              )}
              {profile.military_branch && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Military</p>
                  <p className="text-[#A8A29E] text-sm">
                    {[profile.military_rank, profile.military_branch, profile.military_conflict]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
              {profile.faith && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Faith</p>
                  <p className="text-[#A8A29E] text-sm">{profile.faith}</p>
                </div>
              )}
              {profile.education && (
                <div>
                  <p className="text-[#78716C] small-caps text-xs mb-0.5">Education</p>
                  <p className="text-[#A8A29E] text-sm">{profile.education}</p>
                </div>
              )}
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs px-3 py-1 rounded-pill text-[#C4A869] border border-[rgba(196,164,105,0.3)]"
                  >
                    {interest}
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
