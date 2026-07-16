import { supabaseAdmin } from '@/lib/supabase'
import { enforceSingleFeatured } from './featuredExclusive'
import type { MissionStatus, MissionType, MissionTimeline } from '@/types/mission'

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
}

export async function getAdminMissionById(id: string): Promise<AdminMissionFull | null> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('missions')
    .select(`id, name, slug, description, agency_id, status,
             mission_type, destination, launch_date,
             featured_image, featured, timeline`)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return {
    id: data.id, name: data.name, slug: data.slug,
    description: data.description || '', agencyId: data.agency_id || '',
    status: data.status, missionType: data.mission_type,
    destination: data.destination || '', launchDate: data.launch_date || '',
    featuredImage: data.featured_image || null, featured: data.featured || false,
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
  }
}

export interface MissionPayload {
  name: string; slug: string; description: string; agencyId: string | null
  status: MissionStatus; missionType: MissionType; destination: string
  launchDate: string | null; featuredImage: string | null
  featured: boolean; timeline: MissionTimeline[]
}

export async function createAdminMission(p: MissionPayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()
  const { data, error } = await db.from('missions').insert({
    name: p.name, slug: p.slug, description: p.description,
    agency_id: p.agencyId || null, status: p.status, mission_type: p.missionType,
    destination: p.destination || null, launch_date: p.launchDate || null,
    featured_image: p.featuredImage || null, featured: p.featured, timeline: p.timeline,
  }).select('id').single()

  if (error || !data) { console.error('createAdminMission error:', error); return null }
  await enforceSingleFeatured(db, 'missions', data.id, p.featured)
  return { id: data.id }
}

export async function updateAdminMission(id: string, p: MissionPayload): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db.from('missions').update({
    name: p.name, slug: p.slug, description: p.description,
    agency_id: p.agencyId || null, status: p.status, mission_type: p.missionType,
    destination: p.destination || null, launch_date: p.launchDate || null,
    featured_image: p.featuredImage || null, featured: p.featured, timeline: p.timeline,
  }).eq('id', id)
  if (error) { console.error('updateAdminMission error:', error); return false }
  await enforceSingleFeatured(db, 'missions', id, p.featured)
  return true
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
