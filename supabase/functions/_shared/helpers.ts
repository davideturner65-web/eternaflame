/**
 * Titles that are not person names — skip these entirely in scrapers.
 * Checked case-insensitively against the raw RSS title.
 */
export const JUNK_TITLE_PATTERNS: RegExp[] = [
  /^in loving memory/i,
  /^obituaries?:/i,
  /^obituaries?\s+for\s+the\s+week/i,
  /^obituaries?\s+week/i,
  /^online memorial for/i,
  /^memorial for\b/i,
  /^information for\b/i,
  /^tribute for\b/i,
  /^remembering\b/i,
  /^celebrating the life/i,
  /^a celebration of/i,
  /\bweek of\b/i,
  /^recent obituaries/i,
  /^today'?s? obituaries/i,
  /^local obituaries/i,
]

export function isJunkTitle(title: string): boolean {
  return JUNK_TITLE_PATTERNS.some(p => p.test(title.trim()))
}

export function parseNameParts(rawName: string): {
  firstName: string; lastName: string; middleName: string | null
} {
  const cleaned = rawName
    .replace(/\s*obituary\s*/i, '')
    .replace(/,?\s*(jr\.?|sr\.?|ii|iii|iv|esq\.?)$/i, '')
    // Strip parenthetical dates like "(09/25/1944)" or "(March 3, 2026)"
    .replace(/\s*\([^)]*\d+[^)]*\)/g, '')
    // Strip trailing year or year ranges like "2022" or "1945-2022"
    .replace(/\s+\d{4}(-\d{4})?$/, '')
    // Strip month names that got concatenated to the last word (e.g. "SmithJanuary")
    .replace(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi, '')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '', middleName: null }
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
  }
}

/**
 * Returns true if a parsed name looks like a real person's name.
 * Rejects names that contain digits, are single words, or are known non-name tokens.
 */
export function isValidPersonName(firstName: string, lastName: string): boolean {
  if (!firstName || !lastName) return false
  if (lastName === '—') return false
  // Last name must not start with a digit or contain parentheses/slashes
  if (/^[\d(]/.test(lastName)) return false
  if (/[\/\\()\d]/.test(lastName)) return false
  // Both parts must be at least 2 chars and alphabetic-ish
  if (firstName.length < 2 || lastName.length < 2) return false
  // Reject known boilerplate words as first name
  const JUNK_FIRST = new Set(['in','for','the','online','information','memorial','obituaries','a','an','celebrating','remembering','tribute'])
  if (JUNK_FIRST.has(firstName.toLowerCase())) return false
  // Reject all-digit or all-punctuation names
  if (!/[a-zA-Z]/.test(firstName) || !/[a-zA-Z]/.test(lastName)) return false
  return true
}

export function parseDateSafe(dateStr: string): string | null {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0]
}

export function extractYearFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const year = parseInt(dateStr.slice(0, 4))
  return isNaN(year) ? null : year
}

export function extractLocationFromText(text: string): {
  city: string | null; stateAbbr: string | null
} {
  const match = text.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/)
  if (!match) return { city: null, stateAbbr: null }
  return { city: match[1].trim(), stateAbbr: match[2] }
}

export function cleanText(html: string, maxLen = 1000): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

/**
 * Extract the publisher's domain URL from a Google News RSS <source url="..."> element.
 * Returns the origin (e.g. "https://www.reifffuneralhomeinc.com") or null.
 */
export function extractSourceDomain(rssItem: string): string | null {
  const match = rssItem.match(/<source[^>]+url="([^"]+)"/)
  if (!match) return null
  try {
    const u = new URL(match[1])
    return u.origin // "https://www.domain.com"
  } catch {
    return null
  }
}

/**
 * Generate a URL-friendly slug from a person's name.
 * "Mary Jo Smith" → "mary-jo-smith"
 */
export function nameToSlug(firstName: string, lastName: string, middleName?: string | null): string {
  const parts = [firstName, middleName, lastName].filter(Boolean) as string[]
  return parts.join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
