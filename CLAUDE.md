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

## Data Pipeline

**Flow:** Scrapers → `fetch-obituary-text` (30 min) → `enrich-profiles` (hourly)

| Function | Schedule | What it does |
|---|---|---|
| `scrape-legacy` | 6am UTC daily | Google News RSS by state group (10 groups × 5 states, rotates daily) |
| `scrape-obituaries` | 7am UTC daily | Google News RSS: "passed away", "in loving memory" |
| `scrape-funeralhomes` | noon UTC daily | Google News RSS: funeral home, memorial service phrases |
| `fetch-obituary-text` | every 30 min | Fetches full obit page from `obituary_source_domain` via `/obituaries/{slug}/` heuristic |
| `enrich-profiles` | hourly | Claude Sonnet extracts structured data from `obituary_text` into all child tables |

**Key scraper behavior:**
- All scrapers store `obituary_source_domain` (origin of the publisher, e.g. `https://www.reifffuneralhomeinc.com`)
- `fetch-obituary-text` only processes profiles that have `obituary_source_domain` set (Google News wrapper URLs can't be fetched directly)
- `_shared/helpers.ts` has: `isJunkTitle()`, `isValidPersonName()`, `parseNameParts()`, `extractSourceDomain()`, `nameToSlug()`

**Scraper name-cleaning rules (all applied as of 2026-03-31):**
- Strip `CityName, ST` as a unit before stripping `, ST` alone (Dignity Memorial format: "Jay Rives Ridgeland, MS | Dignity Memorial")
- Strip parenthetical dates from names: `(09/25/1944)`
- Strip concatenated month names: `SmithJanuary 3, 2022`
- Reject junk titles: "In Loving Memory", "Obituaries: Week", "Online Memorial for", etc.
- Reject names where first name is a boilerplate word or last name contains digits/parens

---

## Schema Key Points
- `profiles` table has `obituary_source_domain` column (added 2026-03-31)
- Profile URL: `/[firstname]-[lastname]/[city]-[state]/[birth-year]-[death-year]/`
- `app/[...slug]/page.tsx` — slug lookup with name-based fallback + slug caching on first hit
- `supabase/cron.sql` — all pg_cron schedules (run in Supabase SQL editor after deploying functions)

## Deploying Functions
```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy <function-name> --no-verify-jwt --project-ref rycppccfowzzbomkxmcw
```
Token is in `.env` as `SUPABASE_ACCESS_TOKEN`. Link project first if needed: `npx supabase link --project-ref rycppccfowzzbomkxmcw`

---

## Open Items (as of 2026-03-31)
1. **Email verification for profile creation** — needed before public launch. Prevents abuse, builds email list, enables future family-claiming feature.
2. **Backfill existing ~600 profiles** — they have Google News URLs with no `obituary_source_domain`. Need Brave Search API or similar to find real source URLs.
3. **Expand data sources** — Find A Grave, Wikidata, Social Security Death Index, Chronicling America (historical newspapers) for going backwards in time.
