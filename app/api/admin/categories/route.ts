import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  CategoryInUseError,
} from '@/modules/admin/services/adminCategories'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'
import {
  categorySlug, normalizeCategoryName, normalizeHexColor,
  isValidCategoryName, isReservedCategoryName,
} from '@/modules/admin/categories/categoryFields'

export const dynamic = 'force-dynamic'

// GET /api/admin/categories — every category with its article count.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json({ categories: await getAdminCategories() })
  } catch (err) {
    console.error('GET /api/admin/categories:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/categories — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body    = await request.json()
    const invalid = validate(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const result = await createAdminCategory(buildPayload(body))
    if (!result) return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error('POST /api/admin/categories:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/categories?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const body    = await request.json()
    const invalid = validate(body)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const ok = await updateAdminCategory(id, buildPayload(body))
    if (!ok) return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error('PATCH /api/admin/categories:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/categories?id=xxx — refused while articles still use it.
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const ok = await deleteAdminCategory(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    // 409: the request is fine, the data just isn't ready for it.
    if (err instanceof CategoryInUseError) {
      return NextResponse.json({ error: err.message, count: err.count }, { status: 409 })
    }
    console.error('DELETE /api/admin/categories:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────

function validate(body: any): string | null {
  const name = String(body?.name || '')
  if (!isValidCategoryName(name)) {
    return 'Enter a category name with at least one letter or number.'
  }
  if (isReservedCategoryName(name)) {
    return '“All” is reserved — the listing uses it for the unfiltered view. Pick another name.'
  }
  const color = String(body?.color || '')
  if (color.trim() && !normalizeHexColor(color)) {
    return 'Colour must be a hex value like #4f8ef7.'
  }
  return null
}

function buildPayload(body: any) {
  const name = normalizeCategoryName(String(body?.name || ''))
  return {
    name,
    slug:  categorySlug(String(body?.slug || '') || name),
    color: normalizeHexColor(String(body?.color || '')),
  }
}
