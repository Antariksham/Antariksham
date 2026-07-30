/**
 * Pure helpers for article categories.
 *
 * DOM-free so the API route, the panel and `node:test` can all share them. The
 * import is relative with an extension because `node --test` runs this module
 * directly and cannot resolve the `@/` alias.
 */
import { slugifyUnicode } from '../../../lib/utils.ts'

export const MAX_CATEGORY_NAME_LENGTH = 40
export const MAX_CATEGORY_SLUG_LENGTH = 60

/**
 * Names the public listing cannot represent.
 *
 * `ArticlesPage` uses the literal string `all` as its "no filter" sentinel and
 * filters by category NAME, so a category actually named "All" would be
 * unselectable — clicking its chip would clear the filter instead.
 */
const RESERVED_SLUGS = new Set(['all'])

/** Trimmed, inner whitespace collapsed, capped. Case is preserved ("JAXA"). */
export function normalizeCategoryName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_CATEGORY_NAME_LENGTH).trim()
}

export function categorySlug(raw: string): string {
  return slugifyUnicode(raw, MAX_CATEGORY_SLUG_LENGTH)
}

export function isValidCategoryName(raw: string): boolean {
  return categorySlug(raw).length > 0
}

export function isReservedCategoryName(raw: string): boolean {
  return RESERVED_SLUGS.has(categorySlug(raw))
}

/**
 * A category's colour, normalised to a 6-digit lowercase hex.
 *
 * Strict on purpose. The value is handed to the renderer as a CSS `color`, so
 * accepting arbitrary text would put unvalidated content into a style — and a
 * silently invalid colour reads as "the colour picker is broken". `#ABC` expands
 * to `#aabbcc`; anything else is rejected as null rather than half-applied.
 */
export function normalizeHexColor(raw: string): string | null {
  const value = raw.trim().replace(/^#/, '').toLowerCase()

  if (/^[0-9a-f]{3}$/.test(value)) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`
  }
  if (/^[0-9a-f]{6}$/.test(value)) return `#${value}`
  return null
}
