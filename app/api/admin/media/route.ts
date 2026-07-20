import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

const ALLOWED_BUCKETS = ['article-images', 'mission-images'] as const
type Bucket = typeof ALLOWED_BUCKETS[number]

function validBucket(b: string | null): b is Bucket {
  return ALLOWED_BUCKETS.includes(b as Bucket)
}

// ── GET /api/admin/media?bucket=article-images ────────────────
// List all files in a bucket
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket = req.nextUrl.searchParams.get('bucket') || 'article-images'
  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()
    const { data, error } = await db.storage
      .from(bucket)
      .list('', {
        limit:  200,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) throw error

    // Build public URLs for each file
    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: urlData } = db.storage
          .from(bucket)
          .getPublicUrl(f.name)
        return {
          name:      f.name,
          url:       urlData.publicUrl,
          size:      f.metadata?.size      || 0,
          mimeType:  f.metadata?.mimetype  || '',
          createdAt: f.created_at          || '',
          bucket,
        }
      })

    return NextResponse.json({ files })
  } catch (err: any) {
    console.error('media list error:', err)
    return NextResponse.json({ error: err.message || 'Failed to list files' }, { status: 500 })
  }
}

// ── POST /api/admin/media?bucket=article-images ───────────────
// Upload a file — expects multipart/form-data with field "file"
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket = req.nextUrl.searchParams.get('bucket') || 'article-images'
  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (jpg, png, webp, gif, svg)' }, { status: 400 })
    }

    // Validate file size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 })
    }

    // Build a unique filename: timestamp-originalname (sanitised)
    const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const baseName = file.name
      .replace(/\.[^.]+$/, '')           // strip extension
      .replace(/[^a-z0-9]/gi, '-')       // sanitise
      .toLowerCase()
      .slice(0, 40)
    const fileName = `${Date.now()}-${baseName}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer      = new Uint8Array(arrayBuffer)

    const db = supabaseAdmin()
    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType:  file.type,
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = db.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url:     urlData.publicUrl,
      name:    fileName,
      bucket,
    }, { status: 201 })

  } catch (err: any) {
    console.error('media upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

// ── DELETE /api/admin/media?bucket=article-images&name=file.jpg
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bucket   = req.nextUrl.searchParams.get('bucket') || 'article-images'
  const fileName = req.nextUrl.searchParams.get('name')

  if (!validBucket(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }
  if (!fileName) {
    return NextResponse.json({ error: 'Missing file name' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()
    const { error } = await db.storage
      .from(bucket)
      .remove([fileName])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('media delete error:', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
