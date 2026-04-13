# Eternaflame — Agent Instructions

Free permanent index of every human life. The "Google of humankind." eternaflame.org (Vercel). Repo: `davideturner65-web/eternaflame`.

**Stack:** Next.js 14 App Router + TypeScript · Supabase (PostgreSQL + Auth + Edge Functions) · Tailwind · Vercel
**Supabase project:** `rycppccfowzzbomkxmcw`

---

## Design System
- Background `#0d0f0e` · Text `#F5F0E8` · Accent `#F59E0B` (amber)
- Fonts: Playfair Display + Source Serif 4
- Tone: library-meets-cathedral. Never startup-y.
- Never say "deceased", "dead", "user", "profile", "dashboard" in UI copy
- "Remember someone" not "create a memorial" · "Add to the record" not "submit"

---

## Auth (added 2026-04-13)
- `/create` and `/start` are protected by `middleware.ts` — unauthenticated users redirected to `/auth/email?next=...`
- `app/auth/email/` — email gate: Cloudflare Turnstile (bot check) + Supabase magic link (no password)
- `app/api/auth/send-magic-link/` — validates Turnstile token, blocks disposable email domains, sends OTP
- `POST /api/profiles` requires authenticated session (401 otherwise)
- Supabase Site URL must be `https://eternaflame.org` (not localhost) — set in Auth → URL Configuration
- Env vars: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`

---

## Data Pipeline

**Flow:** Scrapers → `fetch-obituary-text` (30 min) → `enrich-profiles` (hourly)

### Supabase Edge Functions (pg_cron via `supabase/cron.sql`)
| Function | Schedule | What it does |
|---|---|---|
| `scrape-legacy` | 6am UTC daily | Google News RSS by state group (10 groups × 5 states, rotates daily) |
| `scrape-obituaries` | 7am UTC daily | Google News RSS: "passed away", "in loving memory" |
| `scrape-funeralhomes` | noon UTC daily | Google News RSS: funeral home, memorial service phrases |
| `fetch-obituary-text` | every 30 min | Fetches full obit page from `obituary_source_domain` via `/obituaries/{slug}/` heuristic |
| `enrich-profiles` | hourly | Claude Sonnet extracts structured data from `obituary_text` into all child tables |

### Vercel Cron Jobs (`vercel.json`) — added 2026-04-13
| Route | Schedule | What it does |
|---|---|---|
| `app/api/cron/scrape-wikidata` | 9am UTC daily | Wikipedia `Category:YYYY deaths` API — rotates years, ~100 profiles/run with biography extracts |
| `app/api/cron/scrape-wikitree` | 10am UTC daily | WikiTree `searchPerson` API — rotates surname groups, ~50–150 profiles/run |

**Why Vercel crons instead of edge functions:** Wikidata SPARQL and WikiTree APIs time out or block Supabase's IP range. Vercel's serverless functions reach them fine.
**Cron auth:** Both routes require `Authorization: Bearer $CRON_SECRET` header. Vercel injects this automatically on schedule.

**Key scraper behavior:**
- All RSS scrapers store `obituary_source_domain` (origin of the publisher)
- `fetch-obituary-text` only processes profiles that have `obituary_source_domain` set
- Wikipedia profiles come with biography extracts already set — skip `fetch-obituary-text`, go straight to `enrich-profiles`
- `_shared/helpers.ts` has: `isJunkTitle()`, `isValidPersonName()`, `parseNameParts()`, `extractSourceDomain()`, `nameToSlug()`

**Scraper name-cleaning rules (all applied as of 2026-03-31):**
- Strip `CityName, ST` as a unit before stripping `, ST` alone (Dignity Memorial format)
- Strip parenthetical dates from names: `(09/25/1944)`
- Strip concatenated month names: `SmithJanuary 3, 2022`
- Reject junk titles: "In Loving Memory", "Obituaries: Week", "Online Memorial for", etc.

---

## Schema Key Points
- `profiles` table: `obituary_source_domain` (added 2026-03-31), `wikidata_id` (added 2026-04-13, unique index)
- Profile URL: `/[firstname]-[lastname]/[city]-[state]/[birth-year]-[death-year]/`
- `app/[...slug]/page.tsx` — slug lookup with name-based fallback + slug caching on first hit
- `supabase/cron.sql` — all pg_cron schedules (run in Supabase SQL editor after deploying functions)

## Deploying Edge Functions
```bash
cd /path/to/eternaflame
source .env
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase functions deploy <function-name> --no-verify-jwt --project-ref rycppccfowzzbomkxmcw
```

---

## Open Items (as of 2026-04-13)
1. **Backfill existing ~600 pre-pipeline profiles** — they have Google News URLs with no `obituary_source_domain`. Need Brave Search API or similar to find real source URLs.
2. **Expand data sources further** — Social Security Death Index, Chronicling America (historical newspapers) for going backwards in time. Find A Grave blocks scraping (owned by Ancestry).
3. **Family claiming feature** — let family members claim and edit a profile. Requires email auth (now done) + ownership model on profiles table.
