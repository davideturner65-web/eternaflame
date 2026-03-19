-- ============================================================
-- Eternaflame - Seed Data
-- Run AFTER schema.sql in the Supabase SQL editor
-- These are inserted without auth (no created_by) for seeding
-- Temporarily disable the RLS insert policy or run as service role
-- ============================================================

-- Temporarily allow inserts without auth for seeding
-- (Run as service role key, or disable RLS temporarily)

insert into profiles (
  first_name, middle_name, last_name, nickname,
  date_of_birth, date_of_death, age_at_death,
  birth_place, residence, burial_place,
  military_branch, military_rank, military_conflict, military_years,
  career, education, faith,
  interests, personality,
  obituary_source,
  latitude, longitude,
  privacy, profile_status, profile_type
) values (
  'James', 'Robert', 'Turner', 'Jim',
  '1942-03-15', '2026-03-17', 84,
  'Pine Bluff, AR', 'Little Rock, AR', 'Roselawn Memorial Park, Little Rock',
  'U.S. Army', 'Sergeant', 'Vietnam', '1962–1966',
  'Retired teacher at Central High School — 35 years. Teacher of the Year, 1992.',
  'University of Arkansas',
  'First Baptist Church of Little Rock',
  ARRAY['Fishing', 'Arkansas Razorbacks football', 'Woodworking'],
  'Known for his quick wit and generous spirit. Never met a stranger.',
  'Arkansas Democrat-Gazette',
  34.7465, -92.2896,
  'public', 'published', 'obituary-sourced'
);

-- Get Jim's ID for family relationships
with jim as (
  select id from profiles where first_name = 'James' and last_name = 'Turner' and nickname = 'Jim' limit 1
)
insert into family_relationships (profile_id, related_name, relationship, status)
select
  jim.id,
  unnest(ARRAY['Linda Kay Turner', 'Sarah Mitchell', 'Jennifer Adams', 'Robert Turner Jr.', 'Dorothy Mae Collins']),
  unnest(ARRAY['spouse', 'child', 'child', 'sibling', 'sibling']),
  unnest(ARRAY['surviving', 'surviving', 'surviving', 'surviving', 'predeceased'])
from jim;


insert into profiles (
  first_name, middle_name, last_name, nickname,
  date_of_birth, date_of_death, age_at_death,
  birth_place, residence, burial_place,
  career, education, faith,
  interests, personality,
  obituary_source,
  latitude, longitude,
  privacy, profile_status, profile_type
) values (
  'Eleanor', 'Grace', 'Whitfield', 'Ellie',
  '1938-07-22', '2026-02-10', 87,
  'Memphis, TN', 'Hillcrest, Little Rock, AR', 'Oakland Cemetery, Little Rock',
  'Registered Nurse at Baptist Health — 40 years. Mentored over 200 student nurses.',
  'University of Tennessee, BSN',
  'Second Presbyterian Church',
  ARRAY['Gardening', 'Quilting', 'Birdwatching', 'Reading mystery novels'],
  'Had a laugh that could fill a room. Made everyone feel like the most important person in the world.',
  'Legacy.com',
  34.7544, -92.2713,
  'public', 'published', 'obituary-sourced'
);

with ellie as (
  select id from profiles where first_name = 'Eleanor' and last_name = 'Whitfield' limit 1
)
insert into family_relationships (profile_id, related_name, relationship, status)
select
  ellie.id,
  unnest(ARRAY['Thomas Whitfield', 'Margaret Whitfield-Park', 'David Whitfield']),
  unnest(ARRAY['spouse', 'child', 'child']),
  unnest(ARRAY['predeceased', 'surviving', 'surviving'])
from ellie;


insert into profiles (
  first_name, last_name,
  date_of_birth, date_of_death, age_at_death,
  birth_place, residence,
  military_branch, military_rank, military_conflict, military_years,
  career, education, faith,
  interests, personality,
  obituary_source,
  latitude, longitude,
  privacy, profile_status, profile_type
) values (
  'Marcus', 'Delgado',
  '1955-11-03', '2026-01-28', 70,
  'San Antonio, TX', 'North Little Rock, AR',
  'U.S. Marine Corps', 'Corporal', 'Peacetime', '1973–1977',
  'Master electrician. Owned Delgado Electric for 30 years.',
  'Trade certification, UALR',
  'St. Edward Catholic Church',
  ARRAY['Classic cars', 'Coaching youth baseball', 'Smoking brisket'],
  'The kind of man who''d fix your wiring for free and stay for dinner. Lived for his grandkids'' baseball games.',
  'Griffin Leggett Funeral Home',
  34.7695, -92.2671,
  'public', 'published', 'obituary-sourced'
);

with marcus as (
  select id from profiles where first_name = 'Marcus' and last_name = 'Delgado' limit 1
)
insert into family_relationships (profile_id, related_name, relationship, status)
select
  marcus.id,
  unnest(ARRAY['Rosa Delgado', 'Anthony Delgado', 'Maria Delgado-Cruz']),
  unnest(ARRAY['spouse', 'child', 'child']),
  unnest(ARRAY['surviving', 'surviving', 'surviving'])
from marcus;
