import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
  getAdminArticleById,
} from '@/modules/admin/services/adminArticles'
import { readingTime } from '@/lib/utils'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

// POST /api/admin/articles — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = buildPayload(body)

    const invalid = validateArticle(payload)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const result  = await createAdminArticle(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/articles?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const body    = await request.json()
    const payload = buildPayload(body)

    const invalid = validateArticle(payload)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    // Fetch existing publishedAt so we don't overwrite it
    const existing = await getAdminArticleById(id)
    const ok = await updateAdminArticle(id, payload, existing?.publishedAt ?? null)

    if (!ok) return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/articles?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const ok = await deleteAdminArticle(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────

// Server-side required-field validation (the UI enforces the same, but the
// API must not trust the client). Returns an error message or null.
function validateArticle(payload: ReturnType<typeof buildPayload>): string | null {
  if (!payload.title)   return 'Title is required.'
  if (!payload.slug)    return 'Slug is required.'
  if (!payload.content) return 'Content is required.'
  return null
}

function buildPayload(body: any) {
  return {
    title:         String(body.title        || '').trim(),
    slug:          String(body.slug         || '').trim(),
    excerpt:       String(body.excerpt      || '').trim(),
    content:       String(body.content      || '').trim(),
    featuredImage: body.featuredImage || null,
    featuredImageMeta: body.featuredImageMeta && typeof body.featuredImageMeta === 'object' ? body.featuredImageMeta : null,
    authorId:      body.authorId      || null,
    status:        body.status        || 'draft',
    articleType:   body.articleType   || 'explainer',
    featured:      Boolean(body.featured),
    readingTime:   readingTime(body.content || ''),
    categoryIds:   Array.isArray(body.categoryIds) ? body.categoryIds : [],
    tagIds:        Array.isArray(body.tagIds)       ? body.tagIds      : [],
  }
}
