export type ProviderKey = 'supabase' | 'cloudinary'

// A provider-agnostic media item the shared grid can render, pick, and delete.
// Both provider panels now read the same /api/admin/media endpoint (backed by
// the media_assets index), so this shape is what that endpoint returns; the
// grid stays presentational.
export interface MediaItem {
  id:        string          // media_assets row id
  url:       string          // full/public URL — copied and passed to onPick
  thumbUrl?: string          // optimized preview; defaults to url
  name:      string          // human title, falling back to the storage key
  sizeBytes: number
  provider:  ProviderKey
  kind:      'image' | 'file'

  // Index metadata — optional so a row written before the Phase 1 migration
  // still renders.
  assetId?:    string
  storageKey?: string | null
  altText?:    string | null
  caption?:    string | null
  credit?:     string | null
  tags?:       string[]
  width?:      number | null
  height?:     number | null
  mimeType?:   string | null
  bucket?:     string | null
  usageCount?: number
  createdAt?:  string
}

// One page of search results from GET /api/admin/media. `total` is present only
// on the first page — see the RPC comment in the Phase 1 migration.
export interface MediaSearchResponse {
  items:      MediaItem[]
  nextCursor: string | null
  total?:     number
  error?:     string
}

export const SUPABASE_BUCKETS = [
  { key: 'article-images', label: 'Article Images' },
  { key: 'mission-images', label: 'Mission Images' },
] as const

export type SupabaseBucket = typeof SUPABASE_BUCKETS[number]['key']

// The Cloudinary tab only exists when the cloud name is configured, so the
// admin panel is identical to before until the env vars are added.
export const CLOUDINARY_ENABLED = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
