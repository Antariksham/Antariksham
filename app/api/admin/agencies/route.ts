import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminAgencies,
  getAdminAgencyById,
  createAdminAgency,
  updateAdminAgency,
  deleteAdminAgency,
  AgencyInUseError,
} from '@/modules/admin/services/adminAgencies'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'
import {
  agencySlug, normalizeAgencyName, normalizeAgencyUrl, isValidAgencyName,
  MAX_SHORT_NAME_LENGTH,
} from '@/modules/admin/agencies/agencyFields'

export const dynamic = 'force-dynamic'

// GET /api/admin/agencies        — list with primary-mission counts
// GET /api/admin/agencies?id=xxx — one agency, all fields
export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')

  try {
    if (id) {
      const agency = await getAdminAgencyById(id)
      if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(agency)
    }
    return NextResponse.json({ agencies: await getAdminAgencies() })
  } catch (err) {
    console.error('GET /api/admin/agencies:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/agencies — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = buildPayload(await request.json())
    if (!isValidAgencyName(payload.name)) {
      return NextResponse.json({ error: 'Enter an agency name with at least one letter or number.' }, { status: 400 })
    }

    const result = await createAdminAgency(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create agency.' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error('POST /api/admin/agencies:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/agencies?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const payload = buildPayload(await request.json())
    if (!isValidAgencyName(payload.name)) {
      return NextResponse.json({ error: 'Enter an agency name with at least one letter or number.' }, { status: 400 })
    }

    const ok = await updateAdminAgency(id, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to update agency.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error('PATCH /api/admin/agencies:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/agencies?id=xxx — delete, refused while still referenced.
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const ok = await deleteAdminAgency(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete agency.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    // 409, not 500: the request was well-formed, the data just isn't ready for it.
    if (err instanceof AgencyInUseError) {
      return NextResponse.json({ error: err.message, usage: err.usage }, { status: 409 })
    }
    console.error('DELETE /api/admin/agencies:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any) {
  const name = normalizeAgencyName(String(body?.name || ''))
  return {
    name,
    // A blank slug field means "derive it", the same rule the form shows.
    slug:        agencySlug(String(body?.slug || '') || name),
    shortName:   String(body?.shortName || '').trim().slice(0, MAX_SHORT_NAME_LENGTH),
    country:     String(body?.country     || '').trim() || null,
    logoUrl:     String(body?.logoUrl     || '').trim() || null,
    websiteUrl:  normalizeAgencyUrl(String(body?.websiteUrl || '')),
    description: String(body?.description || '').trim() || null,
  }
}
