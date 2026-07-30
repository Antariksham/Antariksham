/**
 * Pure helpers for the Media Library index (Phases 1 + 4 — see
 * docs/MEDIA_LIBRARY_ARCHITECTURE.md).
 *
 * DOM-free and dependency-free so the API routes, the panels and `node:test`
 * can all share them. Three jobs:
 *
 *   1. Turn a storage key into something a human can read and Postgres can
 *      index (`1753612345678-perseverance-selfie.jpg` → "Perseverance selfie").
 *   2. Encode/decode the opaque keyset pagination cursor.
 *   3. Build the content-hash storage key for new uploads.
 *
 * EXISTING objects keep their keys forever: every published article stores an
 * absolute URL and Supabase Storage has no rename that preserves it. Only new
 * uploads use the scheme below.
 */

/** Timestamp prefix written by the original upload route (`Date.now()-name`). */
const LEGACY_TS_PREFIX = /^\d{13}-/

/** URL-safe, lowercase, collapsed-dash slug. Capped so keys stay manageable. */
export function slugify(input: string, maxLength = 80): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.slice(0, maxLength).replace(/-+$/g, '')
}

/**
 * Best-effort human title from a storage key or original filename.
 *
 * Drops the directory, the extension and the legacy 13-digit timestamp prefix,
 * turns separators into spaces and sentence-cases the result. This is what
 * makes the *existing* library searchable at all — it is not a substitute for
 * the title/alt/tags captured at upload in Phase 4, because a camera filename
 * like `IMG_4471.jpg` has no words in it to find.
 */
export function titleFromFilename(name: string): string {
  const base = name
    .split('/').pop()!                 // drop any folder prefix
    .replace(/\.[^.]+$/, '')           // drop the extension
    .replace(LEGACY_TS_PREFIX, '')     // drop `1753612345678-`

  const words = base
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!words) return name
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Display name for a raw storage key — the rule the old panel applied inline. */
export function displayName(storageKey: string): string {
  return storageKey.split('/').pop()!.replace(LEGACY_TS_PREFIX, '')
}

// ── Keyset cursor ────────────────────────────────────────────────────────────
// Opaque to the client so the pagination key can change without a UI release.

export interface MediaCursor {
  createdAt: string
  id:        string
}

export function encodeCursor(cursor: MediaCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.id}`, 'utf8').toString('base64url')
}

export function decodeCursor(raw: string | null | undefined): MediaCursor | null {
  if (!raw) return null
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const sep = decoded.lastIndexOf('|')
    if (sep <= 0) return null
    const createdAt = decoded.slice(0, sep)
    const id        = decoded.slice(sep + 1)
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

// ── Content-hash storage keys (Phase 4) ──────────────────────────────────────

/** Extensions we store, keyed by the mime type the upload route accepts. */
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

export function extForMime(mime: string, fallback = 'jpg'): string {
  return EXT_BY_MIME[mime] || fallback
}

/** SHA-256 as lowercase hex. Uses Web Crypto, present in both Node and browsers. */
export async function sha256Hex(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = bytes instanceof Uint8Array
    ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    : bytes
  const digest = await crypto.subtle.digest('SHA-256', buf as ArrayBuffer)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** The part of the checksum that goes in the key — enough to be unique in practice. */
export function shortHash(sha256: string): string {
  return sha256.slice(0, 8)
}

/**
 * Storage key for a new upload:
 *
 *     2026-07-chandrayaan-3-vikram-lander--a3f19c2b.webp
 *     └─ yyyy-mm ─┘└──── slug ───────────┘  └ hash ┘
 *
 * The content hash makes uploads idempotent (same bytes → same key), gives
 * dedupe for free, and lets these be served immutable — the URL changes if and
 * only if the bytes do. The date prefix keeps the bucket browsable in
 * chronological order.
 *
 * Kept FLAT rather than `yyyy/mm/…` on purpose: Supabase Storage's `list()` is
 * per-prefix and non-recursive, so real folders would turn the resumable sync
 * walk into a tree walk with a cursor per prefix, for a browsing nicety that
 * the database index already provides.
 */
export function buildStorageKey(opts: {
  title:  string
  hash:   string
  ext:    string
  at?:    Date
}): string {
  const at    = opts.at ?? new Date()
  const yyyy  = at.getUTCFullYear()
  const mm    = String(at.getUTCMonth() + 1).padStart(2, '0')
  // 60 leaves room for the date prefix, hash and extension inside the 100-char
  // range that stays comfortable in URLs and dashboards.
  const slug  = slugify(opts.title, 60) || 'image'
  return `${yyyy}-${mm}-${slug}--${shortHash(opts.hash)}.${opts.ext}`
}

/**
 * Where the 400px preview for a key lives. Thumbnails go under their own
 * prefix so the flat `list('')` used by sync never sees them as assets.
 */
export function thumbKeyFor(storageKey: string): string {
  return `thumbs/${storageKey.replace(/\.[^.]+$/, '')}.webp`
}

/** Comma-separated `?tags=` value → a clean array, or null when absent. */
export function parseTags(raw: string | null): string[] | null {
  if (!raw) return null
  const tags = normalizeTags(raw.split(','))
  return tags.length ? tags : null
}

export const MAX_TAGS       = 24
export const MAX_TAG_LENGTH = 40

/**
 * One spelling per tag. Lowercased, inner whitespace collapsed to dashes and
 * deduped, so `ISRO`, `isro` and ` Isro ` cannot become three separate tags —
 * a tag vocabulary that drifts is a filter list nobody can use.
 */
export function normalizeTags(input: string[]): string[] {
  const seen = new Set<string>()
  for (const raw of input) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_TAG_LENGTH)
    if (tag) seen.add(tag)
    if (seen.size >= MAX_TAGS) break
  }
  return Array.from(seen)
}
