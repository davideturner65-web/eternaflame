export function parseNameParts(rawName: string): {
  firstName: string; lastName: string; middleName: string | null
} {
  const cleaned = rawName
    .replace(/\s*obituary\s*/i, '')
    .replace(/,?\s*(jr\.?|sr\.?|ii|iii|iv|esq\.?)$/i, '')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '', middleName: null }
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
  }
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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
