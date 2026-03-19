-- ============================================================
-- Eternaflame - Seed Data v2
-- Run AFTER schema.sql. Uses service role (no auth required).
-- ============================================================

-- Jim Turner
insert into profiles (
  first_name, last_name, middle_name, nickname,
  birth_date, birth_year, death_date, death_year, age_at_death,
  gender, personality_summary, interests,
  obituary_source, privacy, ingestion_source, ingestion_confidence
) values (
  'James','Turner','Robert','Jim',
  '1942-03-15', 1942, '2026-03-17', 2026, 84,
  'male',
  'Known for his quick wit and generous spirit. Never met a stranger.',
  ARRAY['Fishing','Arkansas Razorbacks football','Woodworking'],
  'Arkansas Democrat-Gazette', 'public', 'manual', 1.00
);

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_locations (profile_id, location_type, city, state_abbreviation, is_current)
select id, 'born', 'Pine Bluff', 'AR', false from jim
union all
select id, 'lived', 'Little Rock', 'AR', true from jim
union all
select id, 'buried', 'Little Rock', 'AR', false from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_locations (profile_id, location_type, cemetery_name, city, state_abbreviation)
select id, 'buried', 'Roselawn Memorial Park', 'Little Rock', 'AR' from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_military (profile_id, branch, rank, conflict, service_start_year, service_end_year)
select id, 'Army', 'Sergeant', 'Vietnam War', 1962, 1966 from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_occupations (profile_id, job_title, job_title_normalized, employer_name, employer_name_normalized, industry, is_primary_career, was_retired, notes)
select id, 'Teacher', 'teacher', 'Central High School', 'central high school', 'Education', true, true, 'Teacher of the Year, 1992. 35 years of service.' from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_education (profile_id, institution_name, institution_name_normalized, institution_type, state_abbreviation)
select id, 'University of Arkansas', 'university of arkansas', 'university', 'AR' from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into profile_affiliations (profile_id, affiliation_type, organization_name, organization_name_normalized, city, state_abbreviation)
select id, 'church', 'First Baptist Church of Little Rock', 'first baptist church of little rock', 'Little Rock', 'AR' from jim;

with jim as (select id from profiles where first_name='James' and last_name='Turner' and nickname='Jim' limit 1)
insert into family_connections (profile_id, relation_type, name_only, name_normalized, surviving, connection_source)
select id, unnest(ARRAY['spouse','child','child','sibling','sibling']),
       unnest(ARRAY['Linda Kay Turner','Sarah Mitchell','Jennifer Adams','Robert Turner Jr.','Dorothy Mae Collins']),
       unnest(ARRAY['linda kay turner','sarah mitchell','jennifer adams','robert turner jr.','dorothy mae collins']),
       unnest(ARRAY[true,true,true,true,false]),
       'manual'
from jim;


-- Eleanor Whitfield
insert into profiles (
  first_name, last_name, middle_name, nickname,
  birth_date, birth_year, death_date, death_year, age_at_death,
  gender, personality_summary, interests,
  obituary_source, privacy, ingestion_source, ingestion_confidence
) values (
  'Eleanor','Whitfield','Grace','Ellie',
  '1938-07-22', 1938, '2026-02-10', 2026, 87,
  'female',
  'Had a laugh that could fill a room. Made everyone feel like the most important person in the world.',
  ARRAY['Gardening','Quilting','Birdwatching','Reading mystery novels'],
  'Legacy.com', 'public', 'manual', 1.00
);

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_locations (profile_id, location_type, city, state_abbreviation, is_current)
select id, 'born', 'Memphis', 'TN', false from ellie
union all
select id, 'lived', 'Little Rock', 'AR', true from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_locations (profile_id, location_type, neighborhood, city, state_abbreviation)
select id, 'lived', 'Hillcrest', 'Little Rock', 'AR' from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_locations (profile_id, location_type, cemetery_name, city, state_abbreviation)
select id, 'buried', 'Oakland Cemetery', 'Little Rock', 'AR' from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_occupations (profile_id, job_title, job_title_normalized, employer_name, employer_name_normalized, industry, is_primary_career, was_retired, notes)
select id, 'Registered Nurse', 'registered nurse', 'Baptist Health', 'baptist health', 'Healthcare', true, true, 'Mentored over 200 student nurses. 40 years of service.' from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_education (profile_id, institution_name, institution_name_normalized, institution_type, degree, degree_abbreviation, state_abbreviation)
select id, 'University of Tennessee', 'university of tennessee', 'university', 'Bachelor of Science in Nursing', 'BSN', 'TN' from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into profile_affiliations (profile_id, affiliation_type, organization_name, organization_name_normalized, denomination)
select id, 'church', 'Second Presbyterian Church', 'second presbyterian church', 'Presbyterian' from ellie;

with ellie as (select id from profiles where first_name='Eleanor' and last_name='Whitfield' limit 1)
insert into family_connections (profile_id, relation_type, name_only, name_normalized, surviving, connection_source)
select id, unnest(ARRAY['spouse','child','child']),
       unnest(ARRAY['Thomas Whitfield','Margaret Whitfield-Park','David Whitfield']),
       unnest(ARRAY['thomas whitfield','margaret whitfield-park','david whitfield']),
       unnest(ARRAY[false,true,true]),
       'manual'
from ellie;


-- Marcus Delgado
insert into profiles (
  first_name, last_name,
  birth_date, birth_year, death_date, death_year, age_at_death,
  gender, personality_summary, interests,
  obituary_source, privacy, ingestion_source, ingestion_confidence
) values (
  'Marcus','Delgado',
  '1955-11-03', 1955, '2026-01-28', 2026, 70,
  'male',
  'The kind of man who''d fix your wiring for free and stay for dinner. Lived for his grandkids'' baseball games.',
  ARRAY['Classic cars','Coaching youth baseball','Smoking brisket'],
  'Griffin Leggett Funeral Home', 'public', 'manual', 1.00
);

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into profile_locations (profile_id, location_type, city, state_abbreviation, is_current)
select id, 'born', 'San Antonio', 'TX', false from marcus
union all
select id, 'lived', 'North Little Rock', 'AR', true from marcus;

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into profile_military (profile_id, branch, rank, conflict, service_start_year, service_end_year)
select id, 'Marine Corps', 'Corporal', 'Peacetime', 1973, 1977 from marcus;

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into profile_occupations (profile_id, job_title, job_title_normalized, employer_name, employer_name_normalized, industry, is_primary_career, was_retired, notes)
select id, 'Master Electrician', 'master electrician', 'Delgado Electric', 'delgado electric', 'Construction', true, true, 'Owned Delgado Electric for 30 years.' from marcus;

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into profile_education (profile_id, institution_name, institution_name_normalized, institution_type, city, state_abbreviation)
select id, 'University of Arkansas at Little Rock', 'university of arkansas at little rock', 'university', 'Little Rock', 'AR' from marcus;

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into profile_affiliations (profile_id, affiliation_type, organization_name, organization_name_normalized, denomination)
select id, 'church', 'St. Edward Catholic Church', 'st. edward catholic church', 'Catholic' from marcus;

with marcus as (select id from profiles where first_name='Marcus' and last_name='Delgado' limit 1)
insert into family_connections (profile_id, relation_type, name_only, name_normalized, surviving, connection_source)
select id, unnest(ARRAY['spouse','child','child']),
       unnest(ARRAY['Rosa Delgado','Anthony Delgado','Maria Delgado-Cruz']),
       unnest(ARRAY['rosa delgado','anthony delgado','maria delgado-cruz']),
       unnest(ARRAY[true,true,true]),
       'manual'
from marcus;
