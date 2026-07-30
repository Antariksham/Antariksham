import { NextRequest, NextResponse } from 'next/server'
import { resolveOrCreateTag, InvalidTagNameError } from '@/modules/admin/services/adminTags'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

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
