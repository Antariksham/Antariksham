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
  caption:    string
  credit:     string
  tags:       string[]
  /** Half-typed tag, not yet turned into a chip. Owned here, not by the input. */
  tagDraft:   string
}

export function emptyMeta(title = ''): MediaMeta {
  return { title, altText: '', decorative: false, caption: '', credit: '', tags: [], tagDraft: '' }
}

/** What the drawer needs from an already-indexed asset to edit it. */
export interface IndexedAsset {
  title?:   string | null
  altText?: string | null
  caption?: string | null
  credit?:  string | null
  tags?:    string[]
}

/**
 * Seed the edit form from a stored asset.
 *
 * `altText === ''` is treated as decorative rather than missing: an empty alt is
 * a deliberate statement about a decorative image, and round-tripping it as
 * "undescribed" would nag the editor forever about something already answered.
 * A null alt, by contrast, genuinely has not been filled in.
 */
export function metaFromAsset(asset: IndexedAsset): MediaMeta {
  return {
    title:      asset.title   || '',
    altText:    asset.altText || '',
    decorative: asset.altText === '',
    caption:    asset.caption || '',
    credit:     asset.credit  || '',
    tags:       asset.tags    || [],
    tagDraft:   '',
  }
}

/**
 * Has anything actually changed? Compares what would be SAVED, not raw fields,
 * so a half-typed tag counts as a change and a decorative toggle that leaves the
 * saved alt identical does not.
 */
export function isMetaDirty(before: MediaMeta, after: MediaMeta): boolean {
  const savedAlt = (m: MediaMeta) => (m.decorative ? '' : m.altText.trim())
  return (
    before.title.trim()  !== after.title.trim()  ||
    savedAlt(before)     !== savedAlt(after)     ||
    before.caption.trim()!== after.caption.trim()||
    before.credit.trim() !== after.credit.trim() ||
    resolveTags(before).join(',') !== resolveTags(after).join(',')
  )
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
