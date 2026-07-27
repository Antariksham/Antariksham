import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Mission, MissionCard, MissionStatus, MissionType,
  MissionCollaborator, CollaboratorRole, AgencyRef,
} from '@/types/mission'
import { identityFromDetails } from './missionIdentity'
import { effectiveClassification } from './missionClassification'
import { specificationsFromDetails } from './missionSpecifications'
import { objectivesFromDetails } from './missionObjectives'
import { normalizeTimeline } from './missionTimeline'
import { launchFromDetails } from './missionLaunch'
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@/lib/i18n'

// Detects "column missions.details does not exist" so the public mission page
// keeps rendering before migration 20260726140000_mission_details.sql is applied.
function isMissingDetailsColumn(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('details') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}

interface MissionTranslation { language_code: string; name: string; description: string | null }

// Published translations for a mission (all languages). Tolerant: if the
// mission_translations table doesn't exist yet or the query fails, returns []
// so the English content still renders.
async function fetchMissionTranslations(missionId: string): Promise<MissionTranslation[]> {
  const { data, error } = await supabase
    .from('mission_translations')
    .select('language_code, name, description')
    .eq('mission_id', missionId)
    .eq('is_published', true)
  if (error || !data) return []
  return data as MissionTranslation[]
}

const MISSION_CARD_SELECT = `
  id, name, slug, description, status, launch_date,
  mission_type, featured_image, destination, featured,
  space_agencies ( name, short_name )
`

const MISSION_FULL_SELECT_BASE = `
  id, name, slug, description, status, launch_date,
  mission_type, featured_image, destination, featured,
  timeline, created_at, updated_at, agency_id,
  space_agencies ( id, name, slug, short_name, country, logo_url, description, website_url )
`
const MISSION_FULL_SELECT = `${MISSION_FULL_SELECT_BASE}, details`

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

// Homepage "Active & Upcoming Missions" grid. Driven by status, NOT the
// `featured` flag — `featured` is exclusive (only one row can hold it), so
// relying on it here would let the grid show at most one mission. Filtering by
// status keeps the grid populated regardless of which single mission is
// featured for the hero. Active/upcoming missions come first; if there aren't
// enough to fill the grid, it tops up with the most recent missions of any
// status so the section never looks sparse.
export async function getActiveMissions(limit = 4): Promise<MissionCard[]> {
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_CARD_SELECT)
    .in('status', ['active', 'upcoming'])
    .order('launch_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) return []
  const primary = data || []
  if (primary.length >= limit) return normalizeCards(primary)

  // Top up with the most recent missions of any other status.
  const excludeIds = primary.map((m: any) => m.id)
  let fill = supabase
    .from('missions')
    .select(MISSION_CARD_SELECT)
    .not('status', 'in', '(active,upcoming)')
    .order('launch_date', { ascending: false, nullsFirst: false })
    .limit(limit - primary.length)
  if (excludeIds.length) fill = fill.not('id', 'in', `(${excludeIds.join(',')})`)

  const { data: extra } = await fill
  return normalizeCards([...primary, ...(extra || [])])
}

// Wrapped in cache() so the page's generateMetadata + body share one read.
export const getMissionBySlug = cache(async (
  slug: string,
  lang: LanguageCode = DEFAULT_LANGUAGE,
): Promise<Mission | null> => {
  let { data, error }: { data: any; error: any } = await supabase
    .from('missions')
    .select(MISSION_FULL_SELECT)
    .eq('slug', slug)
    .single()

  // Degrade gracefully if the details migration hasn't been applied yet.
  if (error && isMissingDetailsColumn(error)) {
    ({ data, error } = await supabase.from('missions').select(MISSION_FULL_SELECT_BASE).eq('slug', slug).single())
  }

  if (error || !data) return null

  const [translations, collaborators] = await Promise.all([
    fetchMissionTranslations(data.id),
    fetchCollaborators((data as any).details?.classification),
  ])
  return normalizeFull(data, lang, translations, collaborators)
})

// Resolve the partner / commercial / institution agency ids stored in a
// mission's classification into display refs, preserving role + order and
// dropping ids that don't resolve. Tolerant: returns [] on any failure.
async function fetchCollaborators(classification: any): Promise<MissionCollaborator[]> {
  if (!classification || typeof classification !== 'object') return []
  const roles: [CollaboratorRole, unknown][] = [
    ['partner',     classification.agencies?.partners],
    ['commercial',  classification.agencies?.commercial],
    ['institution', classification.agencies?.institutions],
  ]
  const ids = Array.from(new Set(
    roles.flatMap(([, arr]) => (Array.isArray(arr) ? arr : []))
         .filter((x): x is string => typeof x === 'string' && x.length > 0),
  ))
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('space_agencies')
    .select('id, name, slug, short_name, country, logo_url, website_url')
    .in('id', ids)
  if (error || !data) return []

  const byId = new Map<string, AgencyRef>(
    data.map((a: any) => [a.id, {
      id: a.id, name: a.name, shortName: a.short_name, slug: a.slug,
      country: a.country, logoUrl: a.logo_url || null, websiteUrl: a.website_url || null,
    }]),
  )

  const out: MissionCollaborator[] = []
  for (const [role, arr] of roles) {
    for (const id of (Array.isArray(arr) ? arr : [])) {
      const agency = typeof id === 'string' ? byId.get(id) : undefined
      if (agency) out.push({ role, agency })
    }
  }
  return out
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
  limit = 3,
  lang: LanguageCode = DEFAULT_LANGUAGE,
): Promise<MissionCard[]> {
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_CARD_SELECT)
    .neq('id', missionId)
    .order('launch_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) return []
  const cards = normalizeCards(data || [])
  if (lang === DEFAULT_LANGUAGE || cards.length === 0) return cards

  // Overlay translated names (tolerant — English on any failure).
  const { data: tr } = await supabase
    .from('mission_translations')
    .select('mission_id, name')
    .in('mission_id', cards.map(c => c.id))
    .eq('language_code', lang)
    .eq('is_published', true)
  if (!tr) return cards
  const names = new Map((tr as any[]).map(r => [r.mission_id, r.name]))
  return cards.map(c => ({ ...c, name: names.get(c.id) || c.name }))
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

function normalizeFull(
  row: any,
  lang: LanguageCode = DEFAULT_LANGUAGE,
  translations: MissionTranslation[] = [],
  collaborators: MissionCollaborator[] = [],
): Mission {
  const ag = row.space_agencies
  const t = lang !== DEFAULT_LANGUAGE ? translations.find(x => x.language_code === lang) || null : null
  const served: LanguageCode = t ? lang : DEFAULT_LANGUAGE
  const otherLangs = translations
    .map(x => x.language_code)
    .filter((c): c is LanguageCode => isLanguageCode(c) && c !== DEFAULT_LANGUAGE)
  return {
    id:            row.id,
    name:          t?.name || row.name,
    slug:          row.slug,
    agencyId:      row.agency_id || '',
    description:   (t?.description ?? row.description) || '',
    status:        row.status,
    launchDate:    row.launch_date || null,
    missionType:   row.mission_type,
    featuredImage: row.featured_image || null,
    destination:   row.destination || null,
    featured:      row.featured || false,
    timeline:      normalizeTimeline(row.timeline),
    identity:      identityFromDetails(row.details),
    classification: effectiveClassification(
      row.details?.classification,
      { status: row.status, missionType: row.mission_type, destination: row.destination || '' },
    ),
    collaborators,
    specifications: specificationsFromDetails(row.details),
    objectives:     objectivesFromDetails(row.details),
    launch:         launchFromDetails(row.details),
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
    language:            served,
    availableLanguages: [DEFAULT_LANGUAGE, ...Array.from(new Set(otherLangs))],
  }
}
