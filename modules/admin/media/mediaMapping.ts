/**
 * Pure mapping from a `search_media_assets` row to the shape the grid renders.
 *
 * This lives outside the route handler because it is where a real bug hid: the
 * grid only draws an <img> when `kind` is 'image', and an earlier version of
 * this mapping never set the field at all, so every card in the library
 * silently fell back to a generic file icon. Untested glue code between two
 * layers is exactly where that happens.
 */
// Explicit .ts extensions: these modules are also loaded directly by
// `node --test --experimental-strip-types`, which uses Node's ESM resolver and
// does not guess extensions. `allowImportingTsExtensions` is on in tsconfig.
import { displayName } from './mediaNaming.ts'
import type { MediaItem, ProviderKey } from './types'

/** Row shape returned by the search_media_assets RPC. */
export interface AssetRow {
  id:            string
  provider:      string
  storage_key:   string | null
  bucket:        string | null
  file_url:      string | null
  thumb_url:     string | null
  title:         string | null
  slug:          string | null
  alt_text:      string | null
  caption:       string | null
  credit:        string | null
  tags:          string[] | null
  collection_id: string | null
  width:         number | null
  height:        number | null
  file_size:     number | null
  file_type:     string | null
  created_at:    string
  usage_count:   number | null
}

/**
 * Rows imported from Storage can have a null mime, and these buckets hold
 * nothing but images — so anything not positively identified as a non-image is
 * treated as one. Guessing 'file' here means an invisible thumbnail.
 */
export function kindForMime(mime: string | null | undefined): 'image' | 'file' {
  return mime && !mime.startsWith('image/') ? 'file' : 'image'
}

export function toMediaItem(row: AssetRow): MediaItem {
  return {
    id:         row.id,
    assetId:    row.id,
    storageKey: row.storage_key,
    url:        row.file_url || '',
    thumbUrl:   row.thumb_url || undefined,
    kind:       kindForMime(row.file_type),
    // Falls back through title → storage key → id so a row written before the
    // index migration still renders something readable.
    name:       row.title || (row.storage_key ? displayName(row.storage_key) : row.id),
    altText:    row.alt_text,
    caption:    row.caption,
    credit:     row.credit,
    tags:       row.tags || [],
    sizeBytes:  row.file_size || 0,
    width:      row.width,
    height:     row.height,
    mimeType:   row.file_type,
    provider:   row.provider as ProviderKey,
    bucket:     row.bucket,
    usageCount: row.usage_count || 0,
    createdAt:  row.created_at,
  }
}
