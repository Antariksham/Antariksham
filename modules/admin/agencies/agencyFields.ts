/**
 * Pure helpers for space-agency fields.
 *
 * DOM-free so the API route, the panel and `node:test` can all share them. The
 * import below is relative with an extension because `node --test` runs this
 * module directly and cannot resolve the `@/` alias.
 */
import { slugifyUnicode } from '../../../lib/utils.ts'

export const MAX_AGENCY_NAME_LENGTH  = 120
export const MAX_SHORT_NAME_LENGTH   = 12
export const MAX_AGENCY_SLUG_LENGTH  = 60

/** Particles that are never part of an acronym. */
const ACRONYM_STOPWORDS = new Set([
  'and', 'of', 'the', 'for', 'de', 'del', 'la', 'le', 'les', 'du', 'des', 'et', 'da', 'di',
])

/** Trimmed, inner whitespace collapsed, capped. Case is preserved. */
export function normalizeAgencyName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_AGENCY_NAME_LENGTH).trim()
}

/** URL identity for an agency. Accent-folding, so "Études" survives as "etudes". */
export function agencySlug(raw: string): string {
  return slugifyUnicode(raw, MAX_AGENCY_SLUG_LENGTH)
}

/**
 * Acronym suggestion for the short-name field — initials of the significant
 * words, so "National Aeronautics and Space Administration" prefills as NASA.
 *
 * A suggestion only, and only while the field is untouched: plenty of real
 * agencies don't follow their own initials (JAXA), so this saves typing rather
 * than deciding anything. A single-word name is its own short name (SpaceX).
 */
export function suggestShortName(raw: string): string {
  const name = normalizeAgencyName(raw)
  if (!name) return ''

  // Fold the accents up front. An acronym is ASCII by convention, so d'Études
  // has to contribute an E and give CNES rather than CNÉS — and folding first
  // also lets the split use a plain ASCII class, where `\p{L}` would need a
  // regex flag this project's es5 target rejects.
  const words = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(w => w.length > 0 && !ACRONYM_STOPWORDS.has(w.toLowerCase()))

  if (words.length === 0) return ''
  // A one-word name is its own short name, and keeps its real spelling.
  if (words.length === 1) return name.split(/\s+/)[0].slice(0, MAX_SHORT_NAME_LENGTH)

  return words
    .filter(w => w.length > 1)          // drop the "d'" in d'Études
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, MAX_SHORT_NAME_LENGTH)
}

/**
 * A pasted link is usually missing its protocol, and "esa.int" as an href would
 * resolve against the admin's own origin. Empty stays empty.
 */
export function normalizeAgencyUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** An agency is savable once it has a name that yields a slug. */
export function isValidAgencyName(raw: string): boolean {
  return agencySlug(raw).length > 0
}
