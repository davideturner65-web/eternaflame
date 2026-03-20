import Link from "next/link";
import { Profile, ProfileLocation, getInitials, getDisplayName, formatLifespan } from "@/types/profile";
import { profileUrl } from "@/lib/slugs";

interface ProfileCardProps {
  profile: Profile & { slug?: string | null };
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
  const href = profileUrl(profile, location);
  const isLiving = !profile.death_date && !profile.death_year;

  return (
    <Link href={href} className="block group">
      <article className={`card-surface rounded-card transition-all duration-200 hover:shadow-flame hover:border-[rgba(245,158,11,0.25)] ${size === "lg" ? "p-7" : size === "sm" ? "p-4" : "p-5"}`}>
        <div className="flex items-start gap-4">
          {/* Monogram avatar — warm amber, never a generic silhouette */}
          <div className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-[#0d0f0e] ${size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm"}`}
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-warm-primary group-hover:text-flame transition-colors font-semibold leading-snug ${size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base"}`}
              style={{ fontFamily: "var(--font-playfair)" }}>
              {displayName}
              {isLiving && <span className="ml-1.5 flame-living text-sm">🔥</span>}
            </h3>
            {lifespan && <p className="text-warm-tertiary text-xs mt-0.5 tabular-nums">{lifespan}</p>}
            {place && (
              <p className="text-warm-secondary text-xs mt-1">
                {place}
              </p>
            )}
            {profile.personality_summary && size !== "sm" && (
              <p className="text-flame text-sm mt-2 italic line-clamp-2"
                style={{ fontFamily: "var(--font-playfair)" }}>
                &ldquo;{profile.personality_summary}&rdquo;
              </p>
            )}
            {profile.interests && profile.interests.length > 0 && size === "lg" && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.interests.slice(0, 4).map((i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-pill text-flame border border-[rgba(245,158,11,0.3)]">
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
