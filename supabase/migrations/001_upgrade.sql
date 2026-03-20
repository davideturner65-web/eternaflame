-- ============================================================
-- Eternaflame — Upgrade Migration 001
-- Run in the Supabase SQL editor.
-- This is additive — it does NOT drop any existing data.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES — add missing columns
-- ============================================================
alter table profiles add column if not exists slug text unique;

alter table profiles add column if not exists country_of_death text default 'USA';
alter table profiles add column if not exists country_of_birth text;
alter table profiles add column if not exists primary_language text default 'English';
alter table profiles add column if not exists record_jurisdiction text;

-- Slug index
create index if not exists profiles_slug_idx on profiles(slug);

-- ============================================================
-- PRESERVATION FUND
-- ============================================================
create table if not exists preservation_fund (
  id uuid primary key default uuid_generate_v4(),
  transaction_date timestamptz default now(),
  transaction_type text check (transaction_type in ('deposit','withdrawal','interest')),
  amount_cents int not null,
  source text,
  balance_after_cents int not null,
  notes text
);

-- Seed the fund at $0 to show the mechanism exists (only if empty)
insert into preservation_fund (transaction_type, amount_cents, balance_after_cents, source, notes)
select 'deposit', 0, 0, 'founding', 'Preservation Fund established.'
where not exists (select 1 from preservation_fund limit 1);

-- ============================================================
-- COVERAGE STATS
-- ============================================================
create table if not exists coverage_stats (
  id uuid primary key default uuid_generate_v4(),
  stat_date date default current_date,
  region text not null,
  estimated_deaths_ytd int,
  profiles_captured_ytd int,
  coverage_pct numeric(5,2),
  updated_at timestamptz default now()
);

-- ============================================================
-- GLOBE CLUSTERS FUNCTION
-- ============================================================
create or replace function get_globe_clusters(grid_size float default 5)
returns table(lat float, lng float, count bigint) as $$
  select
    round(latitude::numeric / grid_size) * grid_size as lat,
    round(longitude::numeric / grid_size) * grid_size as lng,
    count(*) as count
  from geo_pins
  where latitude is not null and longitude is not null
  group by 1, 2
  order by count desc
  limit 5000;
$$ language sql stable;

-- ============================================================
-- GENERATE SLUGS FOR EXISTING PROFILES
-- Populates the slug column for all profiles that don't have one.
-- Format: firstname-lastname/city-stateabbr/birthyear-deathyear
-- ============================================================
do $$
declare
  rec record;
  base_slug text;
  final_slug text;
  counter int;
  name_part text;
  loc_part text;
  year_part text;
begin
  for rec in
    select p.id, p.first_name, p.last_name, p.birth_year, p.death_year,
           pl.city, pl.state_abbreviation
    from profiles p
    left join profile_locations pl on pl.profile_id = p.id
      and (pl.is_current = true or pl.location_type = 'lived')
    where p.slug is null
    order by p.id, pl.is_current desc nulls last, pl.created_at asc
  loop
    -- Name part
    name_part := lower(
      regexp_replace(
        regexp_replace(
          coalesce(rec.first_name,'') || '-' || coalesce(rec.last_name,''),
          '[^a-z0-9\-]', '', 'gi'
        ),
        '-+', '-', 'g'
      )
    );

    -- Location part
    if rec.city is not null and rec.state_abbreviation is not null then
      loc_part := lower(
        regexp_replace(
          regexp_replace(rec.city, '[^a-z0-9\s]', '', 'gi'),
          '\s+', '-', 'g'
        )
      ) || '-' || lower(rec.state_abbreviation);
    elsif rec.city is not null then
      loc_part := lower(regexp_replace(regexp_replace(rec.city, '[^a-z0-9\s]', '', 'gi'), '\s+', '-', 'g'));
    else
      loc_part := null;
    end if;

    -- Year part
    if rec.birth_year is not null and rec.death_year is not null then
      year_part := rec.birth_year::text || '-' || rec.death_year::text;
    elsif rec.birth_year is not null then
      year_part := rec.birth_year::text;
    else
      year_part := null;
    end if;

    -- Build slug
    if loc_part is not null and year_part is not null then
      base_slug := name_part || '/' || loc_part || '/' || year_part;
    elsif loc_part is not null then
      base_slug := name_part || '/' || loc_part;
    elsif year_part is not null then
      base_slug := name_part || '/' || year_part;
    else
      base_slug := name_part;
    end if;

    -- Deduplicate
    final_slug := base_slug;
    counter := 2;
    while exists (select 1 from profiles where slug = final_slug) loop
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    end loop;

    -- Only update if this profile doesn't have a slug yet
    update profiles set slug = final_slug where id = rec.id and slug is null;
  end loop;
end;
$$;

-- ============================================================
-- ADDITIONAL CRON JOBS FOR NEW SCRAPERS
-- Requires pg_cron and pg_net extensions to be enabled.
-- These reference vault secrets — ensure supabase_url and
-- service_role_key are stored in vault.decrypted_secrets.
-- ============================================================

-- State vital records (runs weekly Monday 5am UTC)
select cron.schedule('scrape-state-vitals-weekly', '0 5 * * 1', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-state-vitals',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"states": ["CA","TX","FL","NY","PA"]}'::jsonb
  );
$$);

-- International sources (daily 11am UTC)
select cron.schedule('scrape-international-daily', '0 11 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-international',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- Funeral home aggregators (daily noon UTC)
select cron.schedule('scrape-funeralhomes-daily', '0 12 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-funeralhomes',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);
