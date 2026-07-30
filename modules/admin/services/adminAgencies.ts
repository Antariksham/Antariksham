import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'
import { agencySlug, normalizeAgencyName } from '@/modules/admin/agencies/agencyFields'

/**
 * Space-agency CRUD for the admin.
 *
 * Before this, `space_agencies` was read-only everywhere in the app: the mission
 * editor could only offer rows that were already seeded, so a mission for an
 * unlisted agency could not be filed at all.
 *
 * Agencies are not tags — a row carries a logo, country and website that the
 * public mission page renders — so this is a full editor rather than the
 * type-to-create field the Tags panel uses. A name-only row would publish an
 * agency with a blank logo.
 */

// ── Types ─────────────────────────────────────────────────────

export interface AdminAgencyRow {
  id:           string
  name:         string
  slug:         string
  shortName:    string
  country:      string | null
  logoUrl:      string | null
  websiteUrl:   string | null
  /** Missions whose PRIMARY agency this is (the `missions.agency_id` column). */
  missionCount: number
}

export interface AdminAgencyFull {
  id:          string
  name:        string
  slug:        string
  shortName:   string
  country:     string
  logoUrl:     string
  websiteUrl:  string
  description: string
}

export interface AgencyPayload {
  name:        string
  slug:        string
  shortName:   string
  country:     string | null
  logoUrl:     string | null
  websiteUrl:  string | null
  description: string | null
}

/** How an agency is still referenced, so a refused delete can say where. */
export interface AgencyUsage {
  /** Missions using it as `missions.agency_id`. */
  primary:      number
  /** Missions listing it under details.classification.agencies.*. */
  collaborator: number
}

export class AgencyInUseError extends Error {
  usage: AgencyUsage
  constructor(usage: AgencyUsage) {
    const parts: string[] = []
    if (usage.primary > 0)      parts.push(`${usage.primary} mission${usage.primary === 1 ? '' : 's'} as its primary agency`)
    if (usage.collaborator > 0) parts.push(`${usage.collaborator} mission${usage.collaborator === 1 ? '' : 's'} as a collaborator`)
    super(`This agency is still used by ${parts.join(' and ')}. Reassign those missions first.`)
    this.name  = 'AgencyInUseError'
    this.usage = usage
  }
}

const SELECT_COLS = 'id, name, slug, short_name, country, logo_url, website_url, description'

// ── List ──────────────────────────────────────────────────────

export async function getAdminAgencies(): Promise<AdminAgencyRow[]> {
  const db = supabaseAdmin()

  const { data, error } = await db.from('space_agencies').select(SELECT_COLS).order('name')
  if (error) { console.error('getAdminAgencies error:', error); return [] }

  // Primary-agency counts only. The collaborator roles live inside
  // `missions.details`, and pulling that jsonb for every mission just to badge a
  // list would move megabytes; the thorough check runs on delete, where it
  // matters. The column header says "primary" so the number isn't misread.
  const counts: Record<string, number> = {}
  const { data: missions } = await db.from('missions').select('agency_id').not('agency_id', 'is', null)
  for (const m of (missions || []) as any[]) {
    counts[m.agency_id] = (counts[m.agency_id] || 0) + 1
  }

  return (data || []).map(mapRow).map(a => ({
    id:           a.id,
    name:         a.name,
    slug:         a.slug,
    shortName:    a.shortName,
    country:      a.country || null,
    logoUrl:      a.logoUrl || null,
    websiteUrl:   a.websiteUrl || null,
    missionCount: counts[a.id] || 0,
  }))
}

export async function getAdminAgencyById(id: string): Promise<AdminAgencyFull | null> {
  const db = supabaseAdmin()
  const { data, error } = await db.from('space_agencies').select(SELECT_COLS).eq('id', id).single()
  if (error || !data) {
    if (error) console.error('getAdminAgencyById error:', error)
    return null
  }
  return mapRow(data)
}

// ── Create / update ───────────────────────────────────────────

export async function createAdminAgency(payload: AgencyPayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'space_agencies', payload.slug)

  const { data, error } = await db.from('space_agencies').insert(toRow(payload)).select('id').single()
  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminAgency error:', error)
    return null
  }
  return { id: data.id }
}

export async function updateAdminAgency(id: string, payload: AgencyPayload): Promise<boolean> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'space_agencies', payload.slug, id)

  const { error } = await db.from('space_agencies').update(toRow(payload)).eq('id', id)
  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminAgency error:', error)
    return false
  }
  return true
}

// ── Delete ────────────────────────────────────────────────────

/**
 * Delete an agency, but only once nothing points at it.
 *
 * Refusing is the whole point. `missions.agency_id` is a foreign key, so that
 * side would fail anyway — but the collaborator roles are ids inside a jsonb
 * blob with no constraint behind them, so deleting a referenced agency there
 * would silently strand ids that the public mission page can no longer resolve,
 * quietly dropping collaborators off a page nobody is looking at. Better to
 * refuse and say exactly where it is used.
 */
export async function deleteAdminAgency(id: string): Promise<boolean> {
  const db = supabaseAdmin()

  const usage = await getAgencyUsage(db, id)
  if (usage.primary > 0 || usage.collaborator > 0) throw new AgencyInUseError(usage)

  const { error } = await db.from('space_agencies').delete().eq('id', id)
  if (error) { console.error('deleteAdminAgency error:', error); return false }
  return true
}

/** Everywhere an agency id still appears across the missions table. */
export async function getAgencyUsage(db: SupabaseClient, id: string): Promise<AgencyUsage> {
  const usage: AgencyUsage = { primary: 0, collaborator: 0 }

  const { count } = await db
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', id)
  usage.primary = count || 0

  // Scan the collaborator roles inside `missions.details`. Paged, because
  // PostgREST caps a response at 1000 rows and an undercount here would let a
  // referenced agency be deleted.
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('missions')
      .select('id, details')
      .order('id')
      .range(from, from + PAGE - 1)

    if (error) {
      // The column predates migration 20260726140000 — with no `details` at all,
      // no mission can carry collaborator ids, so the primary count is the whole
      // answer. Any other failure must NOT read as "not referenced": throw, so
      // the delete refuses rather than stranding ids the public page can't
      // resolve.
      if (isMissingDetailsColumn(error)) return usage
      console.error('getAgencyUsage error:', error)
      throw new Error('Could not check where this agency is used')
    }

    for (const row of (data || []) as any[]) {
      const roles = row?.details?.classification?.agencies
      if (!roles) continue
      const listed = [roles.partners, roles.commercial, roles.institutions]
        .some(list => Array.isArray(list) && list.includes(id))
      if (listed) usage.collaborator += 1
    }

    if (!data || data.length < PAGE) break
  }

  return usage
}

// Mirrors adminMissions.ts — "column missions.details does not exist".
function isMissingDetailsColumn(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return msg.includes('details') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}

// ── Mapping ───────────────────────────────────────────────────

function mapRow(r: any): AdminAgencyFull {
  return {
    id:          r.id,
    name:        r.name || '',
    slug:        r.slug || '',
    shortName:   r.short_name || '',
    country:     r.country || '',
    logoUrl:     r.logo_url || '',
    websiteUrl:  r.website_url || '',
    description: r.description || '',
  }
}

function toRow(p: AgencyPayload): Record<string, any> {
  const name = normalizeAgencyName(p.name)
  return {
    name,
    slug:        p.slug || agencySlug(name),
    short_name:  p.shortName || null,
    country:     p.country     || null,
    logo_url:    p.logoUrl     || null,
    website_url: p.websiteUrl  || null,
    description: p.description || null,
  }
}
