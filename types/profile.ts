export type Privacy = 'public' | 'family' | 'private'
export type Gender = 'male' | 'female' | 'nonbinary' | 'unknown'
export type IngestionSource =
  | 'legacy' | 'obituaries_com' | 'findagrave'
  | 'familysearch' | 'billiongraves' | 'wikidata' | 'manual' | 'import'

export type LocationType = 'born' | 'raised' | 'lived' | 'worked' | 'died' | 'buried' | 'ashes' | 'family_origin'
export type MilitaryBranch =
  | 'Army' | 'Navy' | 'Marine Corps' | 'Air Force' | 'Coast Guard'
  | 'Space Force' | 'National Guard' | 'Army Reserve' | 'Navy Reserve'
  | 'Marine Reserve' | 'Air National Guard' | 'Merchant Marine' | 'Other' | 'Unknown'
export type MilitaryConflict =
  | 'World War I' | 'World War II' | 'Korean War' | 'Vietnam War'
  | 'Gulf War' | 'Iraq War' | 'Afghanistan' | 'Cold War Era' | 'Peacetime' | 'Other'
export type InstitutionType =
  | 'high_school' | 'community_college' | 'university' | 'trade_school'
  | 'graduate_school' | 'law_school' | 'medical_school' | 'seminary'
  | 'elementary' | 'middle_school' | 'online' | 'other'
export type Industry =
  | 'Education' | 'Healthcare' | 'Agriculture' | 'Manufacturing' | 'Retail'
  | 'Government' | 'Military' | 'Law' | 'Ministry' | 'Finance' | 'Construction'
  | 'Transportation' | 'Technology' | 'Media' | 'Arts' | 'Real Estate'
  | 'Hospitality' | 'Nonprofit' | 'Self-Employed' | 'Other'
export type AffiliationType =
  | 'church' | 'synagogue' | 'mosque' | 'temple' | 'other_religious'
  | 'fraternal' | 'civic' | 'union' | 'political' | 'veteran'
  | 'social_club' | 'sports_team' | 'hobby_club' | 'professional_org' | 'other'
export type RelationType =
  | 'spouse' | 'partner' | 'ex_spouse'
  | 'child' | 'stepchild' | 'adopted_child' | 'foster_child'
  | 'parent' | 'stepparent' | 'adoptive_parent'
  | 'sibling' | 'half_sibling' | 'stepsibling'
  | 'grandchild' | 'great_grandchild'
  | 'grandparent' | 'great_grandparent'
  | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'other'
export type MemoryType = 'story' | 'photo' | 'video' | 'voice' | 'document' | 'artifact' | 'link'
export type ConnectionSource = 'manual' | 'obituary_parse' | 'ai_inferred' | 'record_match'

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  middle_name?: string
  nickname?: string
  maiden_name?: string
  name_suffix?: string
  preferred_name?: string
  birth_date?: string
  birth_date_approximate?: boolean
  birth_year?: number
  death_date?: string
  death_date_approximate?: boolean
  death_year?: number
  age_at_death?: number
  cause_of_death?: string
  gender?: Gender
  biography?: string
  personality_summary?: string
  notable_facts?: string
  interests?: string[]
  known_languages?: string[]
  physical_description?: string
  obituary_source?: string
  obituary_url?: string
  obituary_text?: string
  auto_ingested?: boolean
  ingestion_source?: IngestionSource
  ingestion_confidence?: number
  needs_review?: boolean
  ai_enriched?: boolean
  public_records_searched?: boolean
  findagrave_id?: string
  familysearch_id?: string
  wikidata_id?: string
  claimed_by?: string
  claimed_at?: string
  privacy: Privacy
}

export interface ProfileLocation {
  id: string
  profile_id: string
  location_type: LocationType
  street_address?: string
  neighborhood?: string
  city?: string
  county?: string
  state_province?: string
  state_abbreviation?: string
  country: string
  country_code: string
  postal_code?: string
  region?: string
  cemetery_name?: string
  cemetery_section?: string
  plot_number?: string
  latitude?: number
  longitude?: number
  date_from?: string
  date_to?: string
  year_from?: number
  year_to?: number
  is_current?: boolean
  notes?: string
  created_at: string
}

export interface ProfileMilitary {
  id: string
  profile_id: string
  branch?: MilitaryBranch
  branch_country?: string
  rank?: string
  rank_abbreviation?: string
  pay_grade?: string
  rank_at_discharge?: string
  unit?: string
  unit_number?: string
  base_or_post?: string
  mos_or_rate?: string
  conflict?: MilitaryConflict
  theater?: string
  campaign_medals?: string[]
  decorations?: string[]
  service_start_year?: number
  service_end_year?: number
  service_start_date?: string
  service_end_date?: string
  years_of_service?: number
  discharge_type?: string
  was_pow?: boolean
  was_mia?: boolean
  notes?: string
  created_at: string
}

export interface ProfileEducation {
  id: string
  profile_id: string
  institution_name: string
  institution_name_normalized?: string
  institution_type?: InstitutionType
  city?: string
  state_abbreviation?: string
  country?: string
  degree?: string
  degree_abbreviation?: string
  field_of_study?: string
  major?: string
  minor?: string
  enrollment_year?: number
  graduation_year?: number
  did_graduate?: boolean
  honors?: string
  activities?: string[]
  fraternity_sorority?: string
  notes?: string
  created_at: string
}

export interface ProfileOccupation {
  id: string
  profile_id: string
  job_title?: string
  job_title_normalized?: string
  employer_name?: string
  employer_name_normalized?: string
  industry?: Industry
  industry_subcategory?: string
  city?: string
  state_abbreviation?: string
  start_year?: number
  end_year?: number
  is_primary_career?: boolean
  was_retired?: boolean
  notes?: string
  created_at: string
}

export interface ProfileAffiliation {
  id: string
  profile_id: string
  affiliation_type?: AffiliationType
  organization_name: string
  organization_name_normalized?: string
  denomination?: string
  role_or_title?: string
  chapter_or_location?: string
  city?: string
  state_abbreviation?: string
  start_year?: number
  end_year?: number
  notes?: string
  created_at: string
}

export interface FamilyConnection {
  id: string
  profile_id: string
  related_profile_id?: string
  relation_type: RelationType
  name_only?: string
  name_normalized?: string
  estimated_birth_year?: number
  city_hint?: string
  surviving?: boolean
  marriage_year?: number
  divorce_year?: number
  connection_confidence?: number
  connection_source?: ConnectionSource
  notes?: string
  created_at: string
}

export interface GeoPin {
  id: string
  profile_id: string
  pin_type: LocationType | 'meaningful' | 'migration_stop'
  label: string
  place_name?: string
  street_address?: string
  city?: string
  county?: string
  state_province?: string
  country: string
  postal_code?: string
  latitude?: number
  longitude?: number
  date_from?: string
  date_to?: string
  notes?: string
  privacy: Privacy
  created_at: string
}

export interface Memory {
  id: string
  profile_id: string
  added_by?: string
  contributor_name?: string
  contributor_relation?: string
  memory_type: MemoryType
  title?: string
  content?: string
  media_url?: string
  media_thumbnail_url?: string
  caption?: string
  date_of_memory?: string
  date_of_memory_approximate?: boolean
  location_context?: string
  is_approved?: boolean
  created_at: string
}

export interface ProfileDate {
  id: string
  profile_id: string
  date_type?: string
  label?: string
  event_date?: string
  event_year?: number
  event_date_approximate?: boolean
  location?: string
  notes?: string
  created_at: string
}

export interface ProfileFull extends Profile {
  locations: ProfileLocation[]
  military: ProfileMilitary[]
  education: ProfileEducation[]
  occupations: ProfileOccupation[]
  affiliations: ProfileAffiliation[]
  family: FamilyConnection[]
  geo_pins: GeoPin[]
  memories: Memory[]
  dates: ProfileDate[]
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

export function getDisplayName(p: Pick<Profile, 'first_name' | 'last_name' | 'nickname' | 'middle_name' | 'name_suffix'>): string {
  const parts = [p.first_name]
  if (p.nickname) parts.push(`"${p.nickname}"`)
  if (p.middle_name) parts.push(p.middle_name)
  parts.push(p.last_name)
  if (p.name_suffix) parts.push(p.name_suffix)
  return parts.join(' ')
}

export function getInitials(p: Pick<Profile, 'first_name' | 'last_name'>): string {
  const f = p.first_name?.match(/[A-Za-z]/)?.[0] ?? '?';
  const l = p.last_name && p.last_name !== '—'
    ? (p.last_name.match(/[A-Za-z]/)?.[0] ?? '')
    : '';
  return (f + l).toUpperCase();
}

export function formatYear(year?: number | null): string {
  return year ? String(year) : ''
}

export function formatLifespan(p: Pick<Profile, 'birth_year' | 'death_year' | 'birth_date' | 'death_date'>): string {
  const birth = p.birth_year ?? (p.birth_date ? new Date(p.birth_date).getFullYear() : null)
  const death = p.death_year ?? (p.death_date ? new Date(p.death_date).getFullYear() : null)
  if (birth && death) return `${birth}–${death}`
  if (birth) return `b. ${birth}`
  if (death) return `d. ${death}`
  return ''
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

export function getPrimaryLocation(locations: ProfileLocation[]): ProfileLocation | null {
  return locations.find(l => l.is_current) ??
    locations.find(l => l.location_type === 'lived') ??
    locations[0] ?? null
}
