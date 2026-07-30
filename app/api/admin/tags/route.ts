import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminTags,
  resolveOrCreateTag,
  renameTag,
  deleteTag,
  InvalidTagNameError,
  TagSlugConflictError,
} from '@/modules/admin/services/adminTags'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// GET /api/admin/tags — every tag with its article count. Feeds the Tags screen.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json({ tags: await getAdminTags() })
  } catch (err) {
    console.error('GET /api/admin/tags:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/tags — resolve a typed tag name to a tag row, creating it if
// its slug is new. This is what makes the article editor's Tags panel a
// type-to-create field instead of a fixed list of whatever was seeded.
//
// Idempotent by slug: posting "Falcon 9" when "falcon-9" already exists returns
// that row with created:false, so retries and double-clicks cannot fork the
// vocabulary. Admin-only — tag creation writes to a shared taxonomy.
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tag, created } = await resolveOrCreateTag(String(body?.name ?? ''))
    return NextResponse.json({ tag, created }, { status: created ? 201 : 200 })
  } catch (err) {
    if (err instanceof InvalidTagNameError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('POST /api/admin/tags:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/tags?id=xxx — rename a tag (its slug follows the new name).
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const body = await request.json()
    return NextResponse.json({ tag: await renameTag(id, String(body?.name ?? '')) })
  } catch (err) {
    if (err instanceof InvalidTagNameError)  return NextResponse.json({ error: err.message }, { status: 400 })
    if (err instanceof TagSlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error('PATCH /api/admin/tags:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/tags?id=xxx — delete a tag and untag its articles.
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const ok = await deleteTag(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/tags:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
