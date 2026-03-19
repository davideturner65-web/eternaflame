-- ============================================================
-- Eternaflame - Database Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Profiles table
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  claimed_by uuid references auth.users(id),
  profile_type text default 'family-created',
  profile_status text default 'published',
  privacy text default 'public',

  -- Identity
  first_name text not null,
  middle_name text,
  last_name text not null,
  maiden_name text,
  nickname text,
  suffix text,
  date_of_birth date,
  date_of_death date,
  age_at_death integer,
  gender text,
  photo_url text,

  -- Locations
  birth_place text,
  death_place text,
  residence text,
  burial_place text,
  latitude double precision,
  longitude double precision,

  -- Military
  military_branch text,
  military_rank text,
  military_conflict text,
  military_years text,
  military_honors text[],

  -- Life Story
  career text,
  education text,
  faith text,
  interests text[],
  personality text,
  organizations text[],

  -- Memorial
  obituary_source text,
  obituary_url text,
  obituary_raw_text text,
  memorial_donations text[],

  -- Full-text search column (maintained by trigger)
  full_text_search tsvector
);

create index if not exists profiles_full_text_search_idx on profiles using gin(full_text_search);
create index if not exists profiles_last_name_idx on profiles(last_name);
create index if not exists profiles_residence_idx on profiles(residence);
create index if not exists profiles_date_of_death_idx on profiles(date_of_death);

-- Family relationships table
create table if not exists family_relationships (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  profile_id uuid references profiles(id) on delete cascade,
  related_name text not null,
  related_profile_id uuid references profiles(id),
  relationship text not null,
  status text default 'surviving',
  notes text
);

create index if not exists family_relationships_profile_idx on family_relationships(profile_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (privacy = 'public');

create policy "Users can insert profiles"
  on profiles for insert
  with check (auth.uid() = created_by);

create policy "Profile owners can update their profiles"
  on profiles for update
  using (auth.uid() = created_by or auth.uid() = claimed_by);

alter table family_relationships enable row level security;

create policy "Family relationships are viewable with public profiles"
  on family_relationships for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = family_relationships.profile_id
      and profiles.privacy = 'public'
    )
  );

create policy "Profile owners can manage family relationships"
  on family_relationships for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = family_relationships.profile_id
      and (profiles.created_by = auth.uid() or profiles.claimed_by = auth.uid())
    )
  );

-- ============================================================
-- Triggers
-- ============================================================

-- Keep updated_at current
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Keep full_text_search current on insert and update
create or replace function update_full_text_search()
returns trigger as $$
begin
  new.full_text_search :=
    to_tsvector('english',
      coalesce(new.first_name, '') || ' ' ||
      coalesce(new.middle_name, '') || ' ' ||
      coalesce(new.last_name, '') || ' ' ||
      coalesce(new.maiden_name, '') || ' ' ||
      coalesce(new.nickname, '') || ' ' ||
      coalesce(new.birth_place, '') || ' ' ||
      coalesce(new.residence, '') || ' ' ||
      coalesce(new.career, '') || ' ' ||
      coalesce(new.education, '') || ' ' ||
      coalesce(new.faith, '') || ' ' ||
      coalesce(new.personality, '') || ' ' ||
      coalesce(new.military_branch, '') || ' ' ||
      coalesce(new.military_conflict, '') || ' ' ||
      coalesce(array_to_string(new.interests, ' '), '')
    );
  return new;
end;
$$ language plpgsql;

create trigger profiles_full_text_search
  before insert or update on profiles
  for each row execute function update_full_text_search();
