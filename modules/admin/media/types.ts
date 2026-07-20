export type ProviderKey = 'supabase' | 'cloudinary'

// A provider-agnostic media item the shared grid can render, pick, and delete.
// Each provider panel maps its own records into this shape and closes over its
// own delete logic, so the grid stays presentational.
export interface MediaItem {
  id:        string          // unique within a provider (supabase: filename, cloudinary: row id)
  url:       string          // full/public URL — copied and passed to onPick
  thumbUrl?: string          // optimized preview; defaults to url
  name:      string
  sizeBytes: number
  provider:  ProviderKey
  kind:      'image' | 'file'
}

// Shape returned by the Cloudinary list action (defined here, not in the
// 'use server' file, since a server-action module may only export async fns).
export interface CloudinaryItem {
  id:        string
  url:       string
  publicId:  string
  filename:  string
  sizeBytes: number
  width:     number | null
  height:    number | null
  createdAt: string
}

export const SUPABASE_BUCKETS = [
  { key: 'article-images', label: 'Article Images' },
  { key: 'mission-images', label: 'Mission Images' },
] as const

export type SupabaseBucket = typeof SUPABASE_BUCKETS[number]['key']

// The Cloudinary tab only exists when the cloud name is configured, so the
// admin panel is identical to before until the env vars are added.
export const CLOUDINARY_ENABLED = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
