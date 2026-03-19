import Link from "next/link";
import { Profile, formatLifespan, getInitials } from "@/lib/types";

interface ProfileCardProps {
  profile: Profile;
  size?: "sm" | "md" | "lg";
}

export default function ProfileCard({ profile, size = "md" }: ProfileCardProps) {
  const lifespan = formatLifespan(profile.date_of_birth, profile.date_of_death);
  const initials = getInitials(profile);

  const displayName = [
    profile.first_name,
    profile.nickname ? `"${profile.nickname}"` : null,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={`/profile/${profile.id}`} className="block group">
      <article
        className={`card-surface rounded-card p-5 hover:border-[rgba(196,164,105,0.35)] hover:bg-[rgba(196,164,105,0.08)] transition-all duration-200 ${
          size === "lg" ? "p-7" : size === "sm" ? "p-4" : "p-5"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Initials circle */}
          <div
            className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-[#1C1917] ${
              size === "lg"
                ? "w-14 h-14 text-lg"
                : size === "sm"
                ? "w-9 h-9 text-xs"
                : "w-11 h-11 text-sm"
            }`}
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
            <h3
              className={`text-[#E7E0D5] group-hover:text-[#C4A869] transition-colors font-semibold leading-snug ${
                size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base"
              }`}
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {displayName}
            </h3>

            {lifespan && (
              <p className="text-[#78716C] text-xs mt-0.5 tabular-nums">{lifespan}</p>
            )}

            {profile.residence && (
              <p className="text-[#A8A29E] text-xs mt-1 flex items-center gap-1">
                <span>📍</span>
                {profile.residence}
              </p>
            )}

            {profile.personality && size !== "sm" && (
              <p
                className="text-[#A8A29E] text-sm mt-2 italic line-clamp-2"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                &ldquo;{profile.personality}&rdquo;
              </p>
            )}

            {profile.interests && profile.interests.length > 0 && size === "lg" && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.interests.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="text-xs px-2.5 py-0.5 rounded-pill text-[#C4A869] border border-[rgba(196,164,105,0.3)]"
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
