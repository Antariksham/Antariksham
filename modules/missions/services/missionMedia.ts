/**
 * Pure helpers for Enhanced Media Management (Phase 1, Feature 7).
 *
 * DOM-free + dependency-free, shared by the editor, API, services and
 * `node:test`. Owns the media shape, normalisation, the hero↔featured_image
 * bridge, and (co-located) URL validation. Heavy image optimisation
 * (compression, responsive, WebP/AVIF) is delivered by the existing Cloudinary
 * media provider — this module handles the data model + validation.
 */
import type { MissionMedia, MediaItem } from '@/types/mission'
import type { FieldIssue } from './missionValidation'

export const MEDIA_ITEM_FIELDS: (keyof MediaItem)[] =
  ['url', 'alt', 'caption', 'credit', 'photographer', 'agency', 'sourceUrl', 'copyright', 'license']

export type MediaSingleSlot = 'hero' | 'patch' | 'logo' | 'agencyLogo' | 'banner'
export type MediaListSlot = 'gallery' | 'infographics' | 'animations' | 'videos' | 'documents'

export const MEDIA_SINGLE_SLOTS: MediaSingleSlot[] = ['hero', 'patch', 'logo', 'agencyLogo', 'banner']
export const MEDIA_LIST_SLOTS: MediaListSlot[] = ['gallery', 'infographics', 'animations', 'videos', 'documents']

export function emptyMediaItem(): MediaItem {
  return { url: '', alt: '', caption: '', credit: '', photographer: '', agency: '', sourceUrl: '', copyright: '', license: '' }
}

export function emptyMedia(): MissionMedia {
  return {
    hero: emptyMediaItem(), patch: emptyMediaItem(), logo: emptyMediaItem(),
    agencyLogo: emptyMediaItem(), banner: emptyMediaItem(),
    gallery: [], infographics: [], animations: [], videos: [], documents: [],
  }
}

export function normalizeMediaItem(raw: unknown): MediaItem {
  const base = emptyMediaItem()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const field of MEDIA_ITEM_FIELDS) {
    const v = obj[field]
    if (typeof v === 'string') base[field] = v.trim()
  }
  return base
}

/** A media item is empty when it has no URL (its defining field). */
export function isMediaItemEmpty(item: MediaItem): boolean {
  return !item.url.trim()
}

function normalizeList(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeMediaItem).filter(i => !isMediaItemEmpty(i)) // drop URL-less items
}

/** Coerce an untrusted raw value into a complete `MissionMedia`. */
export function normalizeMedia(raw: unknown): MissionMedia {
  const media = emptyMedia()
  if (!raw || typeof raw !== 'object') return media
  const obj = raw as Record<string, unknown>
  for (const slot of MEDIA_SINGLE_SLOTS) media[slot] = normalizeMediaItem(obj[slot])
  for (const slot of MEDIA_LIST_SLOTS)   media[slot] = normalizeList(obj[slot])
  return media
}

/** Read the media section out of a `details` blob (tolerant). */
export function mediaFromDetails(details: unknown): MissionMedia {
  if (!details || typeof details !== 'object') return emptyMedia()
  return normalizeMedia((details as Record<string, unknown>).media)
}

/**
 * The EFFECTIVE media: the same as stored, but with the hero URL seeded from the
 * base `featured_image` column when the hero has none (so legacy missions — and
 * any mission whose hero was set through the old featured-image field — still
 * show a hero and can be edited with metadata).
 */
export function effectiveMedia(details: unknown, featuredImage: string | null): MissionMedia {
  const media = mediaFromDetails(details)
  if (!media.hero.url && featuredImage) media.hero.url = featuredImage.trim()
  return media
}

/** True when every slot is empty (nothing to store). */
export function isMediaEmpty(media: MissionMedia): boolean {
  return MEDIA_SINGLE_SLOTS.every(s => isMediaItemEmpty(media[s])) &&
    MEDIA_LIST_SLOTS.every(s => media[s].length === 0)
}

/** All non-empty media items across every slot (for iteration/validation). */
export function allMediaItems(media: MissionMedia): MediaItem[] {
  const out: MediaItem[] = []
  for (const s of MEDIA_SINGLE_SLOTS) { const it = media[s]; if (!isMediaItemEmpty(it)) out.push(it) }
  for (const s of MEDIA_LIST_SLOTS)   out.push(...media[s])
  return out
}

// ── Validation ───────────────────────────────────────────────────────

function isHttpUrl(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return true
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

/** Validate media — asset + source URLs must be valid http(s) (blocking). */
export function validateMedia(media: MissionMedia): FieldIssue[] {
  const issues: FieldIssue[] = []
  const items = allMediaItems(media)
  const badAsset = items.some(i => !isHttpUrl(i.url))
  const badSource = items.some(i => !isHttpUrl(i.sourceUrl))
  if (badAsset)  issues.push({ field: 'media', level: 'error', message: 'One or more media URLs are not valid (https://…).' })
  if (badSource) issues.push({ field: 'media', level: 'error', message: 'One or more media source URLs are not valid (https://…).' })
  return issues
}
