-- ============================================================
-- Eternaflame - Full Schema v2
-- Run this in the Supabase SQL editor.
-- WARNING: Drops and rebuilds all tables. All existing data will be lost.
-- ============================================================

-- Drop existing tables in reverse dependency order
drop table if exists ingestion_log cascade;
drop table if exists profile_dates cascade;
drop table if exists memories cascade;
drop table if exists geo_pins cascade;
drop table if exists family_connections cascade;
drop table if exists profile_affiliations cascade;
drop table if exists profile_occupations cascade;
drop table if exists profile_education cascade;
drop table if exists profile_military cascade;
drop table if exists profile_locations cascade;
drop table if exists family_relationships cascade;
drop table if exists profiles cascade;

-- Drop old functions
drop function if exists update_updated_at cascade;
drop function if exists update_full_text_search cascade;
drop function if exists profiles_search_vector_update cascade;

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  first_name text not null,
  last_name text not null,
  middle_name text,
  nickname text,
  maiden_name text,
  name_suffix text,
  preferred_name text,

  birth_date date,
  birth_date_approximate boolean default false,
  birth_year int,
  death_date date,
  death_date_approximate boolean default false,
  death_year int,
  age_at_death int,
  cause_of_death text,

  gender text check (gender in ('male','female','nonbinary','unknown')),

  biography text,
  personality_summary text,
  notable_facts text,
  interests text[],
  known_languages text[],
  physical_description text,

  obituary_source text,
  obituary_url text unique,
  obituary_text text,
  auto_ingested boolean default false,
  ingestion_source text check (ingestion_source in (
    'legacy','obituaries_com','findagrave','familysearch',
    'billiongraves','wikidata','manual','import'
  )),
  ingestion_confidence numeric(3,2),
  needs_review boolean default false,

  ai_enriched boolean default false,
  public_records_searched boolean default false,
  findagrave_id text,
  familysearch_id text,
  wikidata_id text,

  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  privacy text default 'public' check (privacy in ('public','family','private')),

  search_vector tsvector
);

create index profiles_search_idx on profiles using gin(search_vector);
create index profiles_trgm_first on profiles using gin(first_name gin_trgm_ops);
create index profiles_trgm_last on profiles using gin(last_name gin_trgm_ops);
create index profiles_trgm_maiden on profiles using gin(coalesce(maiden_name,'') gin_trgm_ops);
create index profiles_name_idx on profiles(last_name, first_name);
create index profiles_birth_year_idx on profiles(birth_year);
create index profiles_death_year_idx on profiles(death_year);
create index profiles_death_date_idx on profiles(death_date desc);
create index profiles_age_idx on profiles(age_at_death);
create index profiles_created_at_idx on profiles(created_at desc);
create index profiles_ingestion_source_idx on profiles(ingestion_source);
create index profiles_needs_review_idx on profiles(needs_review) where needs_review = true;

create or replace function profiles_search_vector_update() returns trigger as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.first_name,'') || ' ' ||
    coalesce(new.last_name,'') || ' ' ||
    coalesce(new.maiden_name,'') || ' ' ||
    coalesce(new.nickname,'') || ' ' ||
    coalesce(new.preferred_name,'') || ' ' ||
    coalesce(new.biography,'') || ' ' ||
    coalesce(new.personality_summary,'') || ' ' ||
    coalesce(array_to_string(new.interests,' '),'')
  );
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_search_vector_trigger
  before insert or update on profiles
  for each row execute function profiles_search_vector_update();

-- ============================================================
-- LOCATIONS
-- ============================================================
create table profile_locations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  location_type text not null check (location_type in (
    'born','raised','lived','worked','died','buried','ashes','family_origin'
  )),
  street_address text,
  neighborhood text,
  city text,
  county text,
  state_province text,
  state_abbreviation char(2),
  country text default 'USA',
  country_code char(2) default 'US',
  postal_code text,
  region text,
  cemetery_name text,
  cemetery_section text,
  plot_number text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  date_from date,
  date_to date,
  year_from int,
  year_to int,
  is_current boolean default false,
  notes text,
  created_at timestamptz default now()
);

create index locations_profile_id_idx on profile_locations(profile_id);
create index locations_city_state_idx on profile_locations(city, state_abbreviation);
create index locations_county_state_idx on profile_locations(county, state_abbreviation);
create index locations_type_idx on profile_locations(location_type);

-- ============================================================
-- MILITARY
-- ============================================================
create table profile_military (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  branch text check (branch in (
    'Army','Navy','Marine Corps','Air Force','Coast Guard',
    'Space Force','National Guard','Army Reserve','Navy Reserve',
    'Marine Reserve','Air National Guard','Merchant Marine','Other','Unknown'
  )),
  branch_country text default 'USA',
  rank text,
  rank_abbreviation text,
  pay_grade text,
  rank_at_discharge text,
  unit text,
  unit_number text,
  base_or_post text,
  mos_or_rate text,
  conflict text check (conflict in (
    'World War I','World War II','Korean War','Vietnam War',
    'Gulf War','Iraq War','Afghanistan','Cold War Era','Peacetime','Other'
  )),
  theater text,
  campaign_medals text[],
  decorations text[],
  service_start_year int,
  service_end_year int,
  service_start_date date,
  service_end_date date,
  years_of_service int,
  discharge_type text check (discharge_type in (
    'Honorable','General','Other Than Honorable','Dishonorable',
    'Medical','Killed in Action','Died in Service','Unknown'
  )),
  was_pow boolean default false,
  was_mia boolean default false,
  notes text,
  created_at timestamptz default now()
);

create index military_profile_id_idx on profile_military(profile_id);
create index military_branch_idx on profile_military(branch);
create index military_conflict_idx on profile_military(conflict);

-- ============================================================
-- EDUCATION
-- ============================================================
create table profile_education (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  institution_name text not null,
  institution_name_normalized text,
  institution_type text check (institution_type in (
    'high_school','community_college','university','trade_school',
    'graduate_school','law_school','medical_school','seminary',
    'elementary','middle_school','online','other'
  )),
  city text,
  state_abbreviation char(2),
  country text default 'USA',
  degree text,
  degree_abbreviation text,
  field_of_study text,
  major text,
  minor text,
  enrollment_year int,
  graduation_year int,
  did_graduate boolean,
  honors text,
  activities text[],
  fraternity_sorority text,
  notes text,
  created_at timestamptz default now()
);

create index education_profile_id_idx on profile_education(profile_id);
create index education_institution_normalized_idx on profile_education(institution_name_normalized);
create index education_graduation_year_idx on profile_education(graduation_year);

-- ============================================================
-- OCCUPATIONS
-- ============================================================
create table profile_occupations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  job_title text,
  job_title_normalized text,
  employer_name text,
  employer_name_normalized text,
  industry text check (industry in (
    'Education','Healthcare','Agriculture','Manufacturing','Retail',
    'Government','Military','Law','Ministry','Finance','Construction',
    'Transportation','Technology','Media','Arts','Real Estate',
    'Hospitality','Nonprofit','Self-Employed','Other'
  )),
  industry_subcategory text,
  city text,
  state_abbreviation char(2),
  start_year int,
  end_year int,
  is_primary_career boolean default false,
  was_retired boolean default false,
  notes text,
  created_at timestamptz default now()
);

create index occupations_profile_id_idx on profile_occupations(profile_id);
create index occupations_employer_normalized_idx on profile_occupations(employer_name_normalized);
create index occupations_industry_idx on profile_occupations(industry);

-- ============================================================
-- AFFILIATIONS
-- ============================================================
create table profile_affiliations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  affiliation_type text check (affiliation_type in (
    'church','synagogue','mosque','temple','other_religious',
    'fraternal','civic','union','political','veteran',
    'social_club','sports_team','hobby_club','professional_org','other'
  )),
  organization_name text not null,
  organization_name_normalized text,
  denomination text,
  role_or_title text,
  chapter_or_location text,
  city text,
  state_abbreviation char(2),
  start_year int,
  end_year int,
  notes text,
  created_at timestamptz default now()
);

create index affiliations_profile_id_idx on profile_affiliations(profile_id);
create index affiliations_org_normalized_idx on profile_affiliations(organization_name_normalized);
create index affiliations_type_idx on profile_affiliations(affiliation_type);

-- ============================================================
-- FAMILY CONNECTIONS
-- ============================================================
create table family_connections (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  related_profile_id uuid references profiles(id) on delete set null,
  relation_type text not null check (relation_type in (
    'spouse','partner','ex_spouse',
    'child','stepchild','adopted_child','foster_child',
    'parent','stepparent','adoptive_parent',
    'sibling','half_sibling','stepsibling',
    'grandchild','great_grandchild',
    'grandparent','great_grandparent',
    'aunt_uncle','niece_nephew','cousin','other'
  )),
  name_only text,
  name_normalized text,
  estimated_birth_year int,
  city_hint text,
  surviving boolean default true,
  marriage_year int,
  divorce_year int,
  connection_confidence numeric(3,2) default 1.00,
  connection_source text check (connection_source in (
    'manual','obituary_parse','ai_inferred','record_match'
  )),
  notes text,
  created_at timestamptz default now()
);

create index family_profile_id_idx on family_connections(profile_id);
create index family_related_profile_idx on family_connections(related_profile_id)
  where related_profile_id is not null;
create index family_name_only_trgm_idx on family_connections
  using gin(coalesce(name_normalized,'') gin_trgm_ops);
create index family_relation_type_idx on family_connections(relation_type);

-- ============================================================
-- GEO PINS
-- ============================================================
create table geo_pins (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  pin_type text not null check (pin_type in (
    'born','raised','lived','worked','died','buried','ashes',
    'family_origin','meaningful','migration_stop'
  )),
  label text not null,
  place_name text,
  street_address text,
  city text,
  county text,
  state_province text,
  country text default 'USA',
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  date_from date,
  date_to date,
  notes text,
  privacy text default 'public' check (privacy in ('public','family','private')),
  created_at timestamptz default now()
);

create index geo_pins_profile_id_idx on geo_pins(profile_id);
create index geo_pins_coordinates_idx on geo_pins(latitude, longitude) where latitude is not null;

-- ============================================================
-- MEMORIES
-- ============================================================
create table memories (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  added_by uuid references auth.users(id),
  contributor_name text,
  contributor_relation text,
  memory_type text default 'story' check (memory_type in (
    'story','photo','video','voice','document','artifact','link'
  )),
  title text,
  content text,
  media_url text,
  media_thumbnail_url text,
  caption text,
  date_of_memory date,
  date_of_memory_approximate boolean default false,
  location_context text,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create index memories_profile_id_idx on memories(profile_id);

-- ============================================================
-- NOTABLE DATES
-- ============================================================
create table profile_dates (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  date_type text check (date_type in (
    'marriage','divorce','immigration','naturalization',
    'retirement','graduation','ordination','baptism',
    'enlistment','discharge','arrest','release',
    'award','publication','invention','other'
  )),
  label text,
  event_date date,
  event_year int,
  event_date_approximate boolean default false,
  location text,
  notes text,
  created_at timestamptz default now()
);

create index dates_profile_id_idx on profile_dates(profile_id);

-- ============================================================
-- INGESTION LOG
-- ============================================================
create table ingestion_log (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  run_at timestamptz default now(),
  profiles_found int default 0,
  profiles_created int default 0,
  profiles_skipped int default 0,
  errors int default 0,
  duration_seconds int,
  notes text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table profile_locations enable row level security;
alter table profile_military enable row level security;
alter table profile_education enable row level security;
alter table profile_occupations enable row level security;
alter table profile_affiliations enable row level security;
alter table family_connections enable row level security;
alter table geo_pins enable row level security;
alter table memories enable row level security;
alter table profile_dates enable row level security;

create policy "Public profiles viewable" on profiles
  for select using (privacy = 'public');
create policy "Anyone can create profiles" on profiles
  for insert with check (true);
create policy "Owners can update profiles" on profiles
  for update using (auth.uid() = claimed_by);

create policy "View locations" on profile_locations
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add locations" on profile_locations for insert with check (true);

create policy "View military" on profile_military
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add military" on profile_military for insert with check (true);

create policy "View education" on profile_education
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add education" on profile_education for insert with check (true);

create policy "View occupations" on profile_occupations
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add occupations" on profile_occupations for insert with check (true);

create policy "View affiliations" on profile_affiliations
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add affiliations" on profile_affiliations for insert with check (true);

create policy "View family connections" on family_connections
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add family connections" on family_connections for insert with check (true);

create policy "View geo pins" on geo_pins
  for select using (
    privacy = 'public' and
    exists (select 1 from profiles where id = profile_id and privacy = 'public')
  );
create policy "Add geo pins" on geo_pins for insert with check (true);

create policy "View memories" on memories
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add memories" on memories for insert with check (true);

create policy "View dates" on profile_dates
  for select using (exists (select 1 from profiles where id = profile_id and privacy = 'public'));
create policy "Add dates" on profile_dates for insert with check (true);
