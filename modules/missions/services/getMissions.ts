import { supabase } from '@/lib/supabase'
import type { Mission, MissionCard, MissionStatus, MissionType } from '@/types/mission'

const MISSION_CARD_SELECT = `
  id, name, slug, description, status, launch_date,
  mission_type, featured_image, destination, featured,
  space_agencies ( name, short_name )
`

const MISSION_FULL_SELECT = `
  id, name, slug, description, status, launch_date,
  mission_type, featured_image, destination, featured,
  timeline, created_at, updated_at, agency_id,
  space_agencies ( id, name, slug, short_name, country, logo_url, description, website_url )
`

export async function getMissions({
  page    = 1,
  perPage = 12,
  status,
  type,
}: {
  page?    : number
  perPage? : number
  status?  : MissionStatus
  type?    : MissionType
} = {}) {
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('missions')
    .select(MISSION_CARD_SELECT, { count: 'exact' })
    .order('launch_date', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (type)   query = query.eq('mission_type', type)

  const { data, error, count } = await query

  if (error) {
    console.error('getMissions error:', error)
    return { missions: [], total: 0, totalPages: 0 }
  }

  return {
    missions:   normalizeCards(data || []),
    total:      count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

export async function getFeaturedMissions(limit = 4): Promise<MissionCard[]> {
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_CARD_SELECT)
    .eq('featured', true)
    .order('launch_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [])
}

export async function getMissionBySlug(slug: string): Promise<Mission | null> {
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_FULL_SELECT)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return normalizeFull(data)
}

export async function getAllMissionSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('slug')

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

export async function getRelatedMissions(
  missionId: string,
  limit = 3
): Promise<MissionCard[]> {
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_CARD_SELECT)
    .neq('id', missionId)
    .order('launch_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [])
}

// ── Normalizers ───────────────────────────────────────────────

function normalizeCards(rows: any[]): MissionCard[] {
  return rows.map(row => ({
    id:            row.id,
    name:          row.name,
    slug:          row.slug,
    description:   row.description || '',
    status:        row.status,
    launchDate:    row.launch_date || null,
    missionType:   row.mission_type,
    featuredImage: row.featured_image || null,
    destination:   row.destination || null,
    agency:        row.space_agencies
      ? { name: row.space_agencies.name, shortName: row.space_agencies.short_name }
      : null,
  }))
}

function normalizeFull(row: any): Mission {
  const ag = row.space_agencies
  return {
    id:            row.id,
    name:          row.name,
    slug:          row.slug,
    agencyId:      row.agency_id || '',
    description:   row.description || '',
    status:        row.status,
    launchDate:    row.launch_date || null,
    missionType:   row.mission_type,
    featuredImage: row.featured_image || null,
    destination:   row.destination || null,
    featured:      row.featured || false,
    timeline:      Array.isArray(row.timeline) ? row.timeline : [],
    createdAt:     row.created_at || '',
    updatedAt:     row.updated_at || '',
    agency:        ag ? {
      id:          ag.id,
      name:        ag.name,
      slug:        ag.slug,
      shortName:   ag.short_name,
      country:     ag.country,
      logoUrl:     ag.logo_url || null,
      description: ag.description || null,
      websiteUrl:  ag.website_url || null,
    } : null,
  }
}
