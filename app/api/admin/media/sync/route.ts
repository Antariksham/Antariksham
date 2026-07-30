import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { slugify, titleFromFilename } from '@/modules/admin/media/mediaNaming'

export const dynamic = 'force-dynamic'

const ALLOWED_BUCKETS = ['article-images', 'mission-images'] as const
type Bucket = typeof ALLOWED_BUCKETS[number]

function validBucket(b: string | null): b is Bucket {
  return ALLOWED_BUCKETS.includes(b as Bucket)
}

// One request handles this many storage objects, then hands a cursor back to
// the client to continue. Keeps a 50k-object bucket inside the serverless
// execution limit instead of timing out halfway through.
const PAGE = 1000

// `.in()` becomes a query string, so existence checks go out in small chunks
// rather than one 40KB URL.
const LOOKUP_CHUNK = 200

// ── POST /api/admin/media/sync?bucket=article-images&offset=0 ─────────────────
// Imports Storage objects that have no media_assets row yet.
//
// The library reads the index, not the bucket, so anything uploaded before this
// migration needs a row before it becomes visible. Idempotent and resumable:
// re-running only ever adds what is missing, and the response carries the
// offset to continue from.
//
// This is the minimum slice of the Phase 3 backfill needed to make Phase 2
// non-destructive. Checksums, dimensions, blurhash, the usage graph and the
// featured_image_meta harvest still belong to the full Phase 3 script.
export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket = req.nextUrl.searchParams.get('bucket') || 'article-images'
  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const offsetRaw = Number(req.nextUrl.searchParams.get('offset'))
  const offset    = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.trunc(offsetRaw) : 0

  try {
    const db = supabaseAdmin()

    // Sorted by name so paging stays stable even if uploads land mid-sync.
    const { data: objects, error: listError } = await db.storage
      .from(bucket)
      .list('', { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } })

    if (listError) throw listError

    // Folders come back with a null id and no metadata. Skipping them keeps the
    // `thumbs/` prefix (preview derivatives, not assets) out of the index.
    const batch = (objects || []).filter(
      o => o.name !== '.emptyFolderPlaceholder' && o.id !== null,
    )
    const done = (objects?.length ?? 0) < PAGE

    if (batch.length === 0) {
      return NextResponse.json({ scanned: 0, imported: 0, nextOffset: offset, done })
    }

    // Which of these already have a row?
    const known = new Set<string>()
    for (let i = 0; i < batch.length; i += LOOKUP_CHUNK) {
      const keys = batch.slice(i, i + LOOKUP_CHUNK).map(o => o.name)
      const { data: rows, error } = await db
        .from('media_assets')
        .select('storage_key')
        .eq('provider', 'supabase')
        .in('storage_key', keys)
      if (error) throw error
      for (const row of rows || []) known.add(row.storage_key as string)
    }

    const missing = batch.filter(o => !known.has(o.name))

    let imported = 0
    if (missing.length > 0) {
      const rows = missing.map(o => {
        const title = titleFromFilename(o.name)
        return {
          provider:    'supabase',
          storage_key: o.name,
          bucket,
          folder:      bucket,
          file_url:    db.storage.from(bucket).getPublicUrl(o.name).data.publicUrl,
          file_type:   o.metadata?.mimetype || null,
          file_size:   o.metadata?.size     || 0,
          title,
          slug:        slugify(title),
          created_at:  o.created_at || new Date().toISOString(),
        }
      })

      const { error: insertError, count } = await db
        .from('media_assets')
        .insert(rows, { count: 'exact' })

      if (insertError) throw insertError
      imported = count ?? rows.length
    }

    return NextResponse.json({
      scanned:    batch.length,
      imported,
      nextOffset: offset + (objects?.length ?? 0),
      done,
    })
  } catch (err: any) {
    console.error('media sync error:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
