-- ============================================================
-- Eternaflame - pg_cron Schedule
-- Run AFTER deploying all Edge Functions.
-- Requires pg_cron and pg_net extensions enabled in:
-- Supabase Dashboard -> Database -> Extensions
-- ============================================================

-- First: store credentials in Vault (replace with your actual values)
insert into vault.secrets (name, secret) values
  ('supabase_url', 'https://rycppccfowzzbomkxmcw.supabase.co'),
  ('service_role_key', 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY')
on conflict (name) do update set secret = excluded.secret;

-- Legacy.com: all 50 states — 6am UTC daily
select cron.schedule('scrape-legacy-daily', '0 6 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-legacy',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- Obituaries.com — 7am UTC daily
select cron.schedule('scrape-obituaries-daily', '0 7 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-obituaries',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- Find A Grave — 8am UTC daily
select cron.schedule('scrape-findagrave-daily', '0 8 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-findagrave',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- BillionGraves — 9am UTC daily (requires BILLIONGRAVES_API_KEY secret set)
select cron.schedule('scrape-billiongraves-daily', '0 9 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-billiongraves',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- Wikidata SPARQL — 9am UTC daily (rotates through death-year windows)
select cron.schedule('scrape-wikidata-daily', '0 9 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-wikidata',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- WikiTree — 10am UTC daily
select cron.schedule('scrape-wikitree-daily', '0 10 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/scrape-wikitree',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- Obituary Text Fetch — every 30 minutes (fetches full page text for profiles that have a URL but no text yet)
select cron.schedule('fetch-obituary-text-30min', '*/30 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/fetch-obituary-text',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);

-- AI Enrichment — every hour (processes 10 profiles per run)
select cron.schedule('enrich-profiles-hourly', '0 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/enrich-profiles',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);
