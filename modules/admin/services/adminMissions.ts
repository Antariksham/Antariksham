import { supabaseAdmin } from '@/lib/supabase'
import { enforceSingleFeatured } from './featuredExclusive'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'
import type {
  MissionStatus, MissionType, MissionTimeline, MissionIdentity,
  MissionClassification, MissionDetails, MissionSpecifications, MissionObjectives,
} from '@/types/mission'
import {
  emptyIdentity, identityFromDetails, buildMissionDetails,
} from '@/modules/missions/services/missionIdentity'
import {
  emptyClassification, effectiveClassification, normalizeClassification,
  classificationToBaseColumns,
} from '@/modules/missions/services/missionClassification'
import {
  emptySpecifications, specificationsFromDetails, normalizeSpecifications,
  isSpecificationsEmpty,
} from '@/modules/missions/services/missionSpecifications'
import {
  emptyObjectives, objectivesFromDetails, normalizeObjectives, isObjectivesEmpty,
} from '@/modules/missions/services/missionObjectives'
import { normalizeTimeline } from '@/modules/missions/services/missionTimeline'

// Detects "column missions.details does not exist" so the editor keeps working
// before migration 20260726140000_mission_details.sql has been applied.
function isMissingDetailsColumn(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('details') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}

export interface AdminMissionRow {
  id:            string
  name:          string
  slug:          string
  status:        MissionStatus
  missionType:   MissionType
  destination:   string | null
  launchDate:    string | null
  featured:      boolean
  agencyName:    string | null
  updatedAt:     string
}

export async function getAdminMissions({
  page = 1, perPage = 20, status, search,
}: {
  page?: number; perPage?: number; status?: MissionStatus | 'all'; search?: string
} = {}): Promise<{ rows: AdminMissionRow[]; total: number; totalPages: number }> {
  const db   = supabaseAdmin()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = db
    .from('missions')
    .select(
      `id, name, slug, status, mission_type, destination,
       launch_date, featured, updated_at,
       space_agencies ( name )`,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query
  if (error) { console.error('getAdminMissions error:', error); return { rows: [], total: 0, totalPages: 0 } }

  const rows: AdminMissionRow[] = (data || []).map((r: any) => ({
    id: r.id, name: r.name, slug: r.slug, status: r.status,
    missionType: r.mission_type, destination: r.destination || null,
    launchDate: r.launch_date || null, featured: r.featured || false,
    agencyName: r.space_agencies?.name || null, updatedAt: r.updated_at,
  }))

  return { rows, total: count || 0, totalPages: Math.ceil((count || 0) / perPage) }
}

export interface AdminMissionFull {
  id: string; name: string; slug: string; description: string
  agencyId: string; status: MissionStatus; missionType: MissionType
  destination: string; launchDate: string; featuredImage: string | null
  featured: boolean; timeline: MissionTimeline[]
  /** Enhanced identity (Feature 1). Always present; empty strings for legacy. */
  identity: MissionIdentity
  /** Effective rich classification (Feature 2); falls back to base columns. */
  classification: MissionClassification
  /** Professional specifications (Feature 3); empty for legacy. */
  specifications: MissionSpecifications
  /** Structured scientific objectives (Feature 4); empty for legacy. */
  objectives: MissionObjectives
}

export async function getAdminMissionById(id: string): Promise<AdminMissionFull | null> {
  const db = supabaseAdmin()
  const baseCols = `id, name, slug, description, agency_id, status,
             mission_type, destination, launch_date,
             featured_image, featured, timeline`

  let { data, error }: { data: any; error: any } = await db
    .from('missions')
    .select(`${baseCols}, details`)
    .eq('id', id)
    .single()

  // Degrade gracefully if the details migration hasn't been applied yet.
  if (error && isMissingDetailsColumn(error)) {
    ({ data, error } = await db.from('missions').select(baseCols).eq('id', id).single())
  }

  if (error || !data) return null
  return {
    id: data.id, name: data.name, slug: data.slug,
    description: data.description || '', agencyId: data.agency_id || '',
    status: data.status, missionType: data.mission_type,
    destination: data.destination || '', launchDate: data.launch_date || '',
    featuredImage: data.featured_image || null, featured: data.featured || false,
    timeline: normalizeTimeline(data.timeline),
    identity: identityFromDetails(data.details),
    classification: effectiveClassification(
      (data.details as any)?.classification,
      { status: data.status, missionType: data.mission_type, destination: data.destination || '' },
    ),
    specifications: specificationsFromDetails(data.details),
    objectives: objectivesFromDetails(data.details),
  }
}

export interface MissionPayload {
  name: string; slug: string; description: string; agencyId: string | null
  launchDate: string | null; featuredImage: string | null
  featured: boolean; timeline: MissionTimeline[]
  /** Enhanced identity (Feature 1). */
  identity: MissionIdentity
  /** Rich classification (Feature 2). The base status/mission_type/destination
   *  columns are derived from this (never sent independently). */
  classification: MissionClassification
  /** Professional specifications (Feature 3). */
  specifications: MissionSpecifications
  /** Structured scientific objectives (Feature 4). */
  objectives: MissionObjectives
}

// Columns common to insert + update. The base status/mission_type/destination
// columns are the backward-compatible *primary projections* of the rich
// classification (legacy values only). `details` is appended separately so we
// can retry without it when the migration hasn't been applied.
function baseMissionColumns(p: MissionPayload) {
  const base = classificationToBaseColumns(p.classification || emptyClassification())
  return {
    name: p.name, slug: p.slug, description: p.description,
    agency_id: p.agencyId || null,
    status: base.status, mission_type: base.missionType,
    destination: base.destination || null, launch_date: p.launchDate || null,
    featured_image: p.featuredImage || null, featured: p.featured,
    timeline: normalizeTimeline(p.timeline),
  }
}

// The full `details` blob to persist: identity (Feature 1) + classification
// (Feature 2). Classification is always stored so the rich model is the source
// of truth on the next read (reads fall back to base columns only when absent).
function buildDetails(p: MissionPayload): MissionDetails {
  const withIdentity = buildMissionDetails(p.identity || emptyIdentity()) // { identity? } | null
  const details: MissionDetails = {
    ...(withIdentity || {}),
    classification: normalizeClassification(p.classification || emptyClassification()),
  }
  // Only store specifications when something is set (keeps legacy rows clean).
  const specs = normalizeSpecifications(p.specifications || emptySpecifications())
  if (!isSpecificationsEmpty(specs)) details.specifications = specs
  // Same for scientific objectives (Feature 4).
  const objectives = normalizeObjectives(p.objectives || emptyObjectives())
  if (!isObjectivesEmpty(objectives)) details.objectives = objectives
  return details
}

export async function createAdminMission(p: MissionPayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'missions', p.slug)

  const details = buildDetails(p)
  let { data, error }: { data: any; error: any } = await db.from('missions')
    .insert({ ...baseMissionColumns(p), details })
    .select('id').single()

  // Retry without `details` if the column isn't there yet (core mission still saves).
  if (error && isMissingDetailsColumn(error)) {
    ({ data, error } = await db.from('missions').insert(baseMissionColumns(p)).select('id').single())
  }

  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminMission error:', error)
    return null
  }
  await enforceSingleFeatured(db, 'missions', data.id, p.featured)
  return { id: data.id }
}

export async function updateAdminMission(id: string, p: MissionPayload): Promise<boolean> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'missions', p.slug, id)

  const details = buildDetails(p)
  let { error }: { error: any } = await db.from('missions')
    .update({ ...baseMissionColumns(p), details })
    .eq('id', id)

  if (error && isMissingDetailsColumn(error)) {
    ({ error } = await db.from('missions').update(baseMissionColumns(p)).eq('id', id))
  }

  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminMission error:', error)
    return false
  }
  await enforceSingleFeatured(db, 'missions', id, p.featured)
  return true
}

/**
 * Case-insensitive check for another mission that already uses this name.
 * Non-blocking by design — duplicate names are only *warned* about (a mission
 * name is not unique the way a slug is), so the API surfaces this as advice.
 */
export async function hasDuplicateMissionName(name: string, exceptId?: string): Promise<boolean> {
  const trimmed = (name || '').trim()
  if (!trimmed) return false
  const db = supabaseAdmin()
  let query = db.from('missions').select('id').ilike('name', trimmed).limit(1)
  if (exceptId) query = query.neq('id', exceptId)
  const { data, error } = await query
  if (error) return false
  return (data?.length || 0) > 0
}

export async function deleteAdminMission(id: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db.from('missions').delete().eq('id', id)
  if (error) { console.error('deleteAdminMission error:', error); return false }
  return true
}

export interface AgencyOption { id: string; name: string; shortName: string }

export async function getAgencyOptions(): Promise<AgencyOption[]> {
  const db = supabaseAdmin()
  const { data } = await db.from('space_agencies').select('id, name, short_name').order('name')
  return (data || []).map((a: any) => ({ id: a.id, name: a.name, shortName: a.short_name }))
}
