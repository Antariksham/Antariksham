import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
  getAdminArticleById,
} from '@/modules/admin/services/adminArticles'
import { readingTime } from '@/lib/utils'

const AUTH_COOKIE = 'antariksham_admin'

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get(AUTH_COOKIE)
  return cookie?.value === process.env.ADMIN_PASSWORD
}

// POST /api/admin/articles — create
export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = buildPayload(body)
    const result  = await createAdminArticle(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/articles?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const body    = await request.json()
    const payload = buildPayload(body)

    // Fetch existing publishedAt so we don't overwrite it
    const existing = await getAdminArticleById(id)
    const ok = await updateAdminArticle(id, payload, existing?.publishedAt ?? null)

    if (!ok) return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/articles?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!isAuthed(request)) {
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

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any) {
  return {
    title:         String(body.title        || '').trim(),
    slug:          String(body.slug         || '').trim(),
    excerpt:       String(body.excerpt      || '').trim(),
    content:       String(body.content      || '').trim(),
    featuredImage: body.featuredImage || null,
    authorId:      body.authorId      || null,
    status:        body.status        || 'draft',
    articleType:   body.articleType   || 'explainer',
    featured:      Boolean(body.featured),
    readingTime:   readingTime(body.content || ''),
    categoryIds:   Array.isArray(body.categoryIds) ? body.categoryIds : [],
    tagIds:        Array.isArray(body.tagIds)       ? body.tagIds      : [],
  }
}
