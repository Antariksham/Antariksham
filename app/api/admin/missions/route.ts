import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminMission,
  updateAdminMission,
  deleteAdminMission,
} from '@/modules/admin/services/adminMissions'
import { slugify } from '@/lib/utils'
import type { MissionPayload } from '@/modules/admin/services/adminMissions'
import type { MissionStatus, MissionType, MissionTimeline } from '@/types/mission'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'

const AUTH_COOKIE = 'antariksham_admin'

const STATUSES: MissionStatus[] = [
  'active', 'upcoming', 'completed', 'failed', 'in-development', 'cancelled',
]
const TYPES: MissionType[] = [
  'crewed', 'robotic', 'flyby', 'orbiter', 'lander', 'rover', 'sample-return', 'telescope',
]

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get(AUTH_COOKIE)
  return cookie?.value === process.env.ADMIN_PASSWORD
}

// POST /api/admin/missions — create
export async function POST(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = buildPayload(await request.json())
    if (!payload.name)        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!payload.slug)        return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    if (!payload.description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })

    const result = await createAdminMission(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/missions?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const payload = buildPayload(await request.json())
    if (!payload.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const ok = await updateAdminMission(id, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/missions?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const ok = await deleteAdminMission(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any): MissionPayload {
  const name   = String(body.name || '').trim()
  const status = STATUSES.includes(body.status)      ? body.status      : 'upcoming'
  const type   = TYPES.includes(body.missionType)    ? body.missionType : 'robotic'

  const timeline: MissionTimeline[] = Array.isArray(body.timeline)
    ? body.timeline.map((e: any) => ({
        date:        String(e?.date  || '').trim(),
        title:       String(e?.title || '').trim(),
        description: String(e?.description || '').trim(),
        completed:   Boolean(e?.completed),
      }))
    : []

  return {
    name,
    slug:          String(body.slug || slugify(name)).trim(),
    description:   String(body.description || '').trim(),
    agencyId:      body.agencyId      ? String(body.agencyId).trim()      : null,
    status,
    missionType:   type,
    destination:   String(body.destination || '').trim(),
    launchDate:    body.launchDate    ? String(body.launchDate).trim()    : null,
    featuredImage: body.featuredImage ? String(body.featuredImage).trim() : null,
    featured:      Boolean(body.featured),
    timeline,
  }
}
