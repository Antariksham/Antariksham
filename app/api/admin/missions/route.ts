import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminMission,
  updateAdminMission,
  deleteAdminMission,
  hasDuplicateMissionName,
} from '@/modules/admin/services/adminMissions'
import { slugify } from '@/lib/utils'
import type { MissionPayload } from '@/modules/admin/services/adminMissions'
import type { MissionStatus, MissionType } from '@/types/mission'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { normalizeIdentity } from '@/modules/missions/services/missionIdentity'
import {
  validateMission, hasBlockingErrors, errorsOnly, warningsOnly, coerceUrl,
} from '@/modules/missions/services/missionValidation'
import {
  normalizeClassification, effectiveClassification,
} from '@/modules/missions/services/missionClassification'
import {
  normalizeSpecifications, validateSpecifications,
} from '@/modules/missions/services/missionSpecifications'
import {
  normalizeObjectives, validateObjectives,
} from '@/modules/missions/services/missionObjectives'
import {
  normalizeTimeline, validateTimeline,
} from '@/modules/missions/services/missionTimeline'
import {
  normalizeLaunch, validateLaunch,
} from '@/modules/missions/services/missionLaunch'
import {
  normalizeMedia, validateMedia,
} from '@/modules/missions/services/missionMedia'
import type { MissionClassification } from '@/types/mission'

// Full validation for a mission payload: core + identity (Feature 1) +
// specifications (Feature 3) + objectives (Feature 4) + timeline (Feature 5) +
// launch (Feature 6) + media (Feature 7). Classification is derived, always valid.
function validateAll(payload: MissionPayload) {
  return [
    ...validateMission(payload),
    ...validateSpecifications(payload.specifications),
    ...validateObjectives(payload.objectives),
    ...validateTimeline(payload.timeline),
    ...validateLaunch(payload.launch, payload.launchDate || ''),
    ...validateMedia(payload.media),
  ]
}

const STATUSES: MissionStatus[] = [
  'active', 'upcoming', 'completed', 'failed', 'in-development', 'cancelled',
]
const TYPES: MissionType[] = [
  'crewed', 'robotic', 'flyby', 'orbiter', 'lander', 'rover', 'sample-return', 'telescope',
]

// POST /api/admin/missions — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = buildPayload(await request.json())
    const issues  = validateAll(payload)
    if (hasBlockingErrors(issues))
      return NextResponse.json({ error: errorsOnly(issues)[0].message, issues }, { status: 400 })

    const result = await createAdminMission(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 })

    const warnings = await collectWarnings(payload, issues, undefined)
    return NextResponse.json({ id: result.id, warnings }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/missions?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const payload = buildPayload(await request.json())
    const issues  = validateAll(payload)
    if (hasBlockingErrors(issues))
      return NextResponse.json({ error: errorsOnly(issues)[0].message, issues }, { status: 400 })

    const ok = await updateAdminMission(id, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 })

    const warnings = await collectWarnings(payload, issues, id)
    return NextResponse.json({ success: true, warnings })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/missions?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

// ── Helpers ───────────────────────────────────────────────────

function buildPayload(body: any): MissionPayload {
  const name = String(body.name || '').trim()

  // Advanced timeline (Feature 5) — normalise each event (adds ids, syncs
  // completed↔status, coerces the rich fields). Backward compatible with the
  // old {date,title,description,completed} shape.
  const timeline = normalizeTimeline(body.timeline)

  // Enhanced identity (Feature 1) — tolerant of a missing `identity` (legacy /
  // API-direct callers). URL fields are coerced (bare domain → https://…) so a
  // friendly "nasa.gov" is stored as a valid URL.
  const identity = normalizeIdentity(body.identity)
  identity.website   = coerceUrl(identity.website)
  identity.wikipedia = coerceUrl(identity.wikipedia)
  identity.pressKit  = coerceUrl(identity.pressKit)

  return {
    name,
    slug:          String(body.slug || slugify(name)).trim(),
    description:   String(body.description || '').trim(),
    agencyId:      body.agencyId      ? String(body.agencyId).trim()      : null,
    launchDate:    body.launchDate    ? String(body.launchDate).trim()    : null,
    featuredImage: body.featuredImage ? String(body.featuredImage).trim() : null,
    featured:      Boolean(body.featured),
    timeline,
    identity,
    classification: buildClassification(body),
    specifications: normalizeSpecifications(body.specifications),
    objectives:     normalizeObjectives(body.objectives),
    launch:         normalizeLaunch(body.launch),
    media:          normalizeMedia(body.media),
  }
}

// Rich classification (Feature 2). Prefer the structured `classification`
// object from the editor; fall back to the flat status/missionType/destination
// fields for legacy / API-direct callers (so old integrations keep working).
function buildClassification(body: any): MissionClassification {
  const raw = body.classification
  if (raw && typeof raw === 'object') {
    return normalizeClassification({
      status:       String(raw.status || 'upcoming'),
      types:        Array.isArray(raw.types) ? raw.types : [],
      destinations: Array.isArray(raw.destinations) ? raw.destinations : [],
      agencies: {
        partners:     Array.isArray(raw.agencies?.partners) ? raw.agencies.partners : [],
        commercial:   Array.isArray(raw.agencies?.commercial) ? raw.agencies.commercial : [],
        institutions: Array.isArray(raw.agencies?.institutions) ? raw.agencies.institutions : [],
      },
    })
  }
  const status = STATUSES.includes(body.status)   ? body.status      : 'upcoming'
  const type   = TYPES.includes(body.missionType) ? body.missionType : 'robotic'
  return effectiveClassification(undefined, {
    status, missionType: type, destination: String(body.destination || '').trim(),
  })
}

/**
 * Non-blocking advisories returned alongside a successful save: the validation
 * warnings (missing summary/objective, slug hint) plus a case-insensitive
 * duplicate-mission-name check (a name isn't unique the way a slug is, so it's
 * only a warning).
 */
async function collectWarnings(
  payload: MissionPayload,
  issues: ReturnType<typeof validateMission>,
  exceptId?: string,
): Promise<string[]> {
  const warnings = warningsOnly(issues).map(i => i.message)
  if (await hasDuplicateMissionName(payload.name, exceptId)) {
    warnings.push(`Another mission is already named "${payload.name}". Names don't have to be unique, but double-check this isn't a duplicate.`)
  }
  return warnings
}
