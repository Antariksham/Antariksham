/**
 * The media metadata a person fills in, and the pure rules over it.
 *
 * Separate from `MediaMetaFields.tsx` so it can be unit tested without a DOM.
 * `resolveTags` in particular is load-bearing: a half-typed tag used to be
 * thrown away when the editor clicked Save without pressing Enter, which looked
 * exactly like "I tagged it mars and search found nothing".
 */
// Explicit .ts extension so this module is loadable by `node --test` as well
// as by the bundler — see mediaMapping.ts.
import { normalizeTags } from './mediaNaming.ts'

export interface MediaMeta {
  title:      string
  altText:    string
  decorative: boolean
  credit:     string
  tags:       string[]
  /** Half-typed tag, not yet turned into a chip. Owned here, not by the input. */
  tagDraft:   string
}

export function emptyMeta(title = ''): MediaMeta {
  return { title, altText: '', decorative: false, credit: '', tags: [], tagDraft: '' }
}

/**
 * Everything visible in the tag field — committed chips plus whatever is still
 * being typed — merged with any batch-wide tags. What the user sees is what
 * gets saved, with no dependency on a blur handler winning a race.
 */
export function resolveTags(meta: MediaMeta, extra: string[] = []): string[] {
  return normalizeTags([...extra, ...meta.tags, meta.tagDraft])
}

/** Alt text is satisfied by real text, or by explicitly marking it decorative. */
export function hasAlt(meta: MediaMeta): boolean {
  return meta.decorative || meta.altText.trim().length > 0
}
