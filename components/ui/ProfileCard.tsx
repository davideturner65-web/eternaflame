import Link from "next/link";
import { Profile, ProfileLocation, getInitials, getDisplayName, formatLifespan } from "@/types/profile";

interface ProfileCardProps {
  profile: Profile;
  location?: ProfileLocation | null;
  size?: "sm" | "md" | "lg";
}

export default function ProfileCard({ profile, location, size = "md" }: ProfileCardProps) {
  const initials = getInitials(profile);
  const displayName = getDisplayName(profile);
  const lifespan = formatLifespan(profile);
  const city = location?.city ?? null;
  const state = location?.state_abbreviation ?? null;
  const place = city && state ? `${city}, ${state}` : city ?? state ?? null;

  return (
    <Link href={`/profile/${profile.id}`} className="block group">
      <article className={`card-surface rounded-card hover:border-[rgba(196,164,105,0.35)] hover:bg-[rgba(196,164,105,0.08)] transition-all duration-200 ${size === "lg" ? "p-7" : size === "sm" ? "p-4" : "p-5"}`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-[#1C1917] ${size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm"}`}
            style={{ background: "linear-gradient(135deg, #C4A869 0%, #A8884A 100%)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-[#E7E0D5] group-hover:text-[#C4A869] transition-colors font-semibold leading-snug ${size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base"}`}
              style={{ fontFamily: "var(--font-playfair)" }}>
              {displayName}
            </h3>
            {lifespan && <p className="text-[#78716C] text-xs mt-0.5 tabular-nums">{lifespan}</p>}
            {place && (
              <p className="text-[#A8A29E] text-xs mt-1 flex items-center gap-1">
                <span>📍</span>{place}
              </p>
            )}
            {profile.personality_summary && size !== "sm" && (
              <p className="text-[#A8A29E] text-sm mt-2 italic line-clamp-2"
                style={{ fontFamily: "var(--font-playfair)" }}>
                &ldquo;{profile.personality_summary}&rdquo;
              </p>
            )}
            {profile.interests && profile.interests.length > 0 && size === "lg" && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.interests.slice(0, 4).map((i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-pill text-[#C4A869] border border-[rgba(196,164,105,0.3)]">
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
