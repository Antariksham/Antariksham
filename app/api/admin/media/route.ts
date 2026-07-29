import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import {
  slugify, titleFromFilename, displayName,
  encodeCursor, decodeCursor, parseTags, normalizeTags,
  sha256Hex, buildStorageKey, thumbKeyFor, extForMime,
} from '@/modules/admin/media/mediaNaming'

export const dynamic = 'force-dynamic'

const ALLOWED_BUCKETS = ['article-images', 'mission-images'] as const
type Bucket = typeof ALLOWED_BUCKETS[number]

const ALLOWED_PROVIDERS = ['supabase', 'cloudinary'] as const
type Provider = typeof ALLOWED_PROVIDERS[number]

const DEFAULT_LIMIT = 48
const MAX_LIMIT     = 200

function validBucket(b: string | null): b is Bucket {
  return ALLOWED_BUCKETS.includes(b as Bucket)
}

function validProvider(p: string | null): p is Provider {
  return ALLOWED_PROVIDERS.includes(p as Provider)
}

// Row shape returned by the search_media_assets RPC.
interface AssetRow {
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

function toItem(row: AssetRow) {
  return {
    id:         row.id,
    assetId:    row.id,
    storageKey: row.storage_key,
    url:        row.file_url,
    thumbUrl:   row.thumb_url || undefined,
    // Falls back through title → storage key → id so a row written before this
    // migration still renders something readable.
    name:       row.title || (row.storage_key ? displayName(row.storage_key) : row.id),
    altText:    row.alt_text,
    caption:    row.caption,
    credit:     row.credit,
    tags:       row.tags || [],
    sizeBytes:  row.file_size || 0,
    width:      row.width,
    height:     row.height,
    mimeType:   row.file_type,
    provider:   row.provider,
    bucket:     row.bucket,
    usageCount: row.usage_count || 0,
    createdAt:  row.created_at,
  }
}

// ── GET /api/admin/media ──────────────────────────────────────────────────────
// Searches the media_assets index — NOT the storage bucket. Params:
//   q, provider, bucket, tags (csv), collection, cursor, limit
// Returns { items, total, nextCursor }. The row total is a second RPC issued in
// parallel, and only on the first page — folding it into the search as a window
// count made every page walk the whole matching set.
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params   = req.nextUrl.searchParams
  const provider = params.get('provider') || 'supabase'
  if (!validProvider(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  // The bucket only scopes Supabase Storage; Cloudinary rows have no bucket.
  let bucket: Bucket | null = null
  if (provider === 'supabase') {
    const raw = params.get('bucket') || 'article-images'
    if (!validBucket(raw)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }
    bucket = raw
  }

  const limitRaw = Number(params.get('limit'))
  const limit    = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.min(Math.trunc(limitRaw), MAX_LIMIT)
    : DEFAULT_LIMIT

  const cursor = decodeCursor(params.get('cursor'))

  const filters = {
    p_query:      params.get('q')?.trim() || null,
    p_provider:   provider,
    p_bucket:     bucket,
    p_tags:       parseTags(params.get('tags')),
    p_collection: params.get('collection') || null,
  }

  try {
    const db = supabaseAdmin()

    const [page, count] = await Promise.all([
      db.rpc('search_media_assets', {
        ...filters,
        p_cursor_ts: cursor?.createdAt ?? null,
        p_cursor_id: cursor?.id ?? null,
        p_limit:     limit,
      }),
      // Only the first page needs a total; later pages already have it.
      cursor ? Promise.resolve(null) : db.rpc('count_media_assets', filters),
    ])

    if (page.error) throw page.error
    if (count?.error) throw count.error

    const rows  = (page.data || []) as AssetRow[]
    const items = rows.map(toItem)

    // A full page means there may be more; a short page is definitively the end.
    const last       = rows[rows.length - 1]
    const nextCursor = rows.length === limit && last
      ? encodeCursor({ createdAt: last.created_at, id: last.id })
      : null

    return NextResponse.json({
      items,
      nextCursor,
      total: count ? Number(count.data?.[0]?.total ?? 0) : undefined,
    })
  } catch (err: any) {
    console.error('media search error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to search media' },
      { status: 500 },
    )
  }
}

// ── POST /api/admin/media?bucket=article-images ───────────────
// Upload a file. multipart/form-data:
//   file    (required)  the image
//   thumb   (optional)  400x250 WebP preview generated in the browser
//   title / altText / caption / credit / tags / width / height   (optional)
//
// Writes the object to Storage AND a row to media_assets; the row is what the
// library reads, so an upload that cannot be indexed is rolled back rather than
// left invisible.
//
// Uploading bytes that are already in the library returns the existing asset
// untouched instead of storing a second copy.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket = req.nextUrl.searchParams.get('bucket') || 'article-images'
  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get('file')  as File | null
    const thumb    = formData.get('thumb') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type. SVG is intentionally excluded — it can carry inline
    // scripts (stored-XSS vector); use a raster format instead.
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (jpg, png, webp, gif)' }, { status: 400 })
    }

    // Validate file size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer      = new Uint8Array(arrayBuffer)

    // Computed here, not trusted from the client: this is what dedupe and the
    // storage key both hang off.
    const checksum = await sha256Hex(arrayBuffer)

    const db = supabaseAdmin()

    // Already have these exact bytes? Hand back what we have. Re-uploading a
    // photo is then free and non-destructive rather than a second copy with a
    // second URL to keep straight.
    const { data: existing } = await db
      .from('media_assets')
      .select('id, file_url, title')
      .eq('checksum_sha256', checksum)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success:   true,
        duplicate: true,
        id:        existing.id,
        url:       existing.file_url,
        title:     existing.title,
        bucket,
      })
    }

    // Metadata from the upload dialog. Title falls back to the filename so a
    // caller that posts only a file still lands something searchable.
    const field = (name: string) => {
      const value = formData.get(name)
      return typeof value === 'string' && value.trim() ? value.trim() : null
    }
    const numberField = (name: string) => {
      const value = Number(formData.get(name))
      return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null
    }

    const title = field('title') || titleFromFilename(file.name)
    const tags  = normalizeTags((field('tags') || '').split(','))

    const storageKey = buildStorageKey({
      title,
      hash: checksum,
      ext:  extForMime(file.type, file.name.split('.').pop()?.toLowerCase() || 'jpg'),
    })

    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(storageKey, buffer, {
        contentType: file.type,
        // The key contains a content hash, so the URL changes if and only if
        // the bytes do — these can be cached hard and forever.
        cacheControl: '31536000',
        upsert:       false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = db.storage.from(bucket).getPublicUrl(storageKey)

    // Preview derivative, generated in the browser. Optional by design: without
    // it the grid falls back to the original, which is exactly today's
    // behaviour rather than a broken card.
    let thumbUrl: string | null = null
    const thumbKey = thumbKeyFor(storageKey)
    if (thumb && thumb.size > 0 && thumb.type === 'image/webp') {
      const { error: thumbError } = await db.storage
        .from(bucket)
        .upload(thumbKey, new Uint8Array(await thumb.arrayBuffer()), {
          contentType:  'image/webp',
          cacheControl: '31536000',
          upsert:       true,
        })
      if (thumbError) console.error('thumbnail upload failed:', thumbError)
      else thumbUrl = db.storage.from(bucket).getPublicUrl(thumbKey).data.publicUrl
    }

    const { data: row, error: indexError } = await db
      .from('media_assets')
      .insert({
        provider:        'supabase',
        storage_key:     storageKey,
        bucket,
        folder:          bucket,
        file_url:        urlData.publicUrl,
        thumb_url:       thumbUrl,
        file_type:       file.type,
        file_size:       file.size,
        checksum_sha256: checksum,
        title,
        slug:            slugify(title),
        alt_text:        field('altText'),
        caption:         field('caption'),
        credit:          field('credit'),
        tags,
        width:           numberField('width'),
        height:          numberField('height'),
        uploaded_by:     admin.id,
      })
      .select('id')
      .single()

    if (indexError) {
      // Do not leave an object in Storage that the library cannot see.
      await db.storage.from(bucket).remove([storageKey, thumbKey])
      throw indexError
    }

    return NextResponse.json({
      success: true,
      id:      row.id,
      url:     urlData.publicUrl,
      name:    storageKey,
      title,
      bucket,
    }, { status: 201 })

  } catch (err: any) {
    console.error('media upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

// ── DELETE /api/admin/media?bucket=article-images&id=<uuid> ───
// `name=<storage key>` is still accepted for any caller that has not moved to
// asset ids yet.
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket   = req.nextUrl.searchParams.get('bucket') || 'article-images'
  const assetId  = req.nextUrl.searchParams.get('id')
  const fileName = req.nextUrl.searchParams.get('name')

  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }
  if (!assetId && !fileName) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()

    // Resolve the storage key from the index when an asset id was given.
    let storageKey = fileName
    if (assetId) {
      const { data: row } = await db
        .from('media_assets')
        .select('storage_key')
        .eq('id', assetId)
        .eq('provider', 'supabase')
        .maybeSingle()
      if (!row) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      storageKey = row.storage_key
    }

    if (!storageKey) {
      return NextResponse.json({ error: 'Missing file name' }, { status: 400 })
    }

    // The preview derivative goes with it. `remove` ignores keys that are not
    // there, so assets uploaded before thumbnails existed delete cleanly too.
    const { error } = await db.storage
      .from(bucket)
      .remove([storageKey, thumbKeyFor(storageKey)])
    if (error) throw error

    // The bytes are gone, so the row is removed outright rather than soft
    // deleted — `deleted_at` is for the archive/undo flow that arrives with the
    // usage graph in Phase 3, when a delete can be refused instead.
    const { error: indexError } = await db
      .from('media_assets')
      .delete()
      .eq('provider', 'supabase')
      .eq('storage_key', storageKey)

    if (indexError) {
      console.error('media delete index error:', indexError)
      return NextResponse.json(
        { error: 'File deleted, but its library entry remained' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('media delete error:', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
