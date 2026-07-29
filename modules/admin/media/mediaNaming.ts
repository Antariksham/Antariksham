/**
 * Pure helpers for the Media Library index (Phase 1 — see
 * docs/MEDIA_LIBRARY_ARCHITECTURE.md).
 *
 * DOM-free and dependency-free so the API routes, the panels and `node:test`
 * can all share them. Two jobs:
 *
 *   1. Turn a storage key into something a human can read and Postgres can
 *      index (`1753612345678-perseverance-selfie.jpg` → "Perseverance selfie").
 *   2. Encode/decode the opaque keyset pagination cursor.
 *
 * The storage key itself is deliberately NOT changed here — existing objects
 * keep their keys forever, because every published article stores an absolute
 * URL and Supabase Storage has no rename that preserves it. The content-hash
 * key scheme for NEW uploads lands in Phase 4.
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

/** Comma-separated `?tags=` value → a clean array, or null when absent. */
export function parseTags(raw: string | null): string[] | null {
  if (!raw) return null
  const tags = raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  return tags.length ? tags : null
}
