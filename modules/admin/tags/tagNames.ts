/**
 * Pure helpers for article tag names.
 *
 * A row in `public.tags` carries a display `name` ("Falcon 9") and an identity
 * `slug` ("falcon-9"). The slug is what dedupes: typing `Falcon 9`, `falcon 9`
 * or ` FALCON-9 ` must all resolve to the one existing tag, because a tag
 * vocabulary that drifts into three spellings is a filter list nobody can use.
 *
 * DOM-free and dependency-free so the API route, the picker and `node:test` can
 * all share them.
 */

/** Display names are sidebar chips, not sentences. */
export const MAX_TAG_NAME_LENGTH = 48
export const MAX_TAG_SLUG_LENGTH = 60

/**
 * The name as typed, minus the noise: trimmed, inner runs of whitespace
 * collapsed to one space, capped. Case is preserved on purpose — `JWST` must
 * not become `Jwst`, and the slug handles matching anyway.
 */
export function normalizeTagName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TAG_NAME_LENGTH)
    .trim()                          // a cap landing mid-space would re-pad it
}

/**
 * Identity slug for a tag name.
 *
 * Deliberately not `slugify` from `lib/utils`: that one matches on `\w`, which
 * drops non-ASCII letters outright ("Sové" → "sov"), and agency and mission
 * names are exactly where accents show up. Stripping the combining marks
 * instead keeps the word intact ("sove").
 */
export function tagSlug(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TAG_SLUG_LENGTH)
    .replace(/-+$/g, '')             // the cap can land on a dash
}

/**
 * A name is usable iff something survives slugging. This is what rejects ` `,
 * `!!!` and `---`. It also rejects a name written entirely in a non-Latin
 * script (Devanagari, CJK), which has no ASCII slug to key on — tag names are
 * authored on the English article and shared across its translations.
 */
export function isValidTagName(raw: string): boolean {
  return tagSlug(raw).length > 0
}

/**
 * One entry per slug, in first-seen order. Used when a caller hands over a
 * batch of typed names that may collide with each other.
 */
export function dedupeTagNames(names: string[]): string[] {
  const bySlug = new Map<string, string>()
  for (const raw of names) {
    const name = normalizeTagName(raw)
    const slug = tagSlug(name)
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name)
  }
  return Array.from(bySlug.values())
}
