export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  claimed_by: string | null;
  profile_type: "family-created" | "obituary-sourced" | "public-record" | "self-created";
  profile_status: "published" | "draft" | "flagged";
  privacy: "public" | "family-only" | "private";

  // Identity
  first_name: string;
  middle_name: string | null;
  last_name: string;
  maiden_name: string | null;
  nickname: string | null;
  suffix: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  age_at_death: number | null;
  gender: string | null;
  photo_url: string | null;

  // Locations
  birth_place: string | null;
  death_place: string | null;
  residence: string | null;
  burial_place: string | null;
  latitude: number | null;
  longitude: number | null;

  // Military
  military_branch: string | null;
  military_rank: string | null;
  military_conflict: string | null;
  military_years: string | null;
  military_honors: string[] | null;

  // Life Story
  career: string | null;
  education: string | null;
  faith: string | null;
  interests: string[] | null;
  personality: string | null;
  organizations: string[] | null;

  // Memorial
  obituary_source: string | null;
  obituary_url: string | null;
  obituary_raw_text: string | null;
  memorial_donations: string[] | null;
}

export interface FamilyRelationship {
  id: string;
  created_at: string;
  profile_id: string;
  related_name: string;
  related_profile_id: string | null;
  relationship: "spouse" | "child" | "parent" | "sibling" | "grandchild" | "grandparent" | "other";
  status: "surviving" | "predeceased";
  notes: string | null;
}

export interface ProfileWithRelationships extends Profile {
  family_relationships: FamilyRelationship[];
}

export function formatLifespan(dob: string | null, dod: string | null): string {
  const birth = dob ? new Date(dob).getFullYear() : null;
  const death = dod ? new Date(dod).getFullYear() : null;
  if (birth && death) return `${birth}–${death}`;
  if (birth) return `b. ${birth}`;
  if (death) return `d. ${death}`;
  return "";
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getDisplayName(profile: Pick<Profile, "first_name" | "middle_name" | "last_name" | "nickname" | "maiden_name" | "suffix">): string {
  const parts = [profile.first_name];
  if (profile.middle_name) parts.push(profile.middle_name);
  parts.push(profile.last_name);
  if (profile.suffix) parts.push(profile.suffix);
  return parts.join(" ");
}

export function getInitials(profile: Pick<Profile, "first_name" | "last_name">): string {
  return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
}
