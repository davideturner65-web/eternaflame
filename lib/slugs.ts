import type { Profile, ProfileLocation } from "@/types/profile";

/**
 * Convert a string to a URL-safe slug segment.
 * Lowercases, replaces spaces/special chars with hyphens, deduplicates hyphens.
 */
export function toSlugSegment(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

/**
 * Generate the slug path for a profile.
 * Format: firstname-lastname/city-stateabbr/birthyear-deathyear
 * Falls back gracefully when data is missing.
 */
export function generateProfileSlug(
  profile: Pick<Profile, "first_name" | "last_name" | "birth_year" | "death_year">,
  location?: Pick<ProfileLocation, "city" | "state_abbreviation"> | null
): string {
  const namePart = toSlugSegment(
    `${profile.first_name}-${profile.last_name}`
  );

  const locPart =
    location?.city && location?.state_abbreviation
      ? `${toSlugSegment(location.city)}-${location.state_abbreviation.toLowerCase()}`
      : location?.city
      ? toSlugSegment(location.city)
      : null;

  const yearPart =
    profile.birth_year && profile.death_year
      ? `${profile.birth_year}-${profile.death_year}`
      : profile.birth_year
      ? `${profile.birth_year}`
      : null;

  if (locPart && yearPart) return `${namePart}/${locPart}/${yearPart}`;
  if (locPart) return `${namePart}/${locPart}`;
  if (yearPart) return `${namePart}/${yearPart}`;
  return namePart;
}

/**
 * Build a canonical profile URL from a stored slug or profile data.
 * Prefers the stored slug if available.
 */
export function profileUrl(
  profile: Pick<Profile, "id" | "first_name" | "last_name" | "birth_year" | "death_year"> & {
    slug?: string | null;
  },
  location?: Pick<ProfileLocation, "city" | "state_abbreviation"> | null
): string {
  if (profile.slug) return `/${profile.slug}`;
  return `/${generateProfileSlug(profile, location)}`;
}

/**
 * Parse a slug array from [...slug] params back into a full slug string.
 */
export function slugArrayToString(segments: string[]): string {
  return segments.join("/");
}
