import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminAuthors,
  getAdminAuthorById,
  createAdminAuthor,
  updateAdminAuthor,
  deleteAdminAuthor,
} from '@/modules/admin/services/adminAuthors'

import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// GET /api/admin/authors          — list all
// GET /api/admin/authors?id=xxx   — single author
export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')

  if (id) {
    const author = await getAdminAuthorById(id)
    if (!author) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(author)
  }

  const authors = await getAdminAuthors()
  return NextResponse.json({ authors })
}

// POST /api/admin/authors — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body    = await request.json()
    const payload = buildPayload(body)

    if (!payload.name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    const result = await createAdminAuthor(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create author.' }, { status: 500 })

    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/authors error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// PATCH /api/admin/authors?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  try {
    const body    = await request.json()
    const payload = buildPayload(body)

    if (!payload.name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    const ok = await updateAdminAuthor(id, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to update author.' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/authors error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/admin/authors?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

  try {
    const ok = await deleteAdminAuthor(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete author.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/authors error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any) {
  return {
    name:     String(body.name    || '').trim(),
    bio:      String(body.bio     || '').trim() || null,
    avatar:   String(body.avatar  || '').trim() || null,
    socialLinks: {
      twitter:  String(body.socialLinks?.twitter  || '').trim() || undefined,
      linkedin: String(body.socialLinks?.linkedin || '').trim() || undefined,
      website:  String(body.socialLinks?.website  || '').trim() || undefined,
    },
    featured: Boolean(body.featured),
  }
}
