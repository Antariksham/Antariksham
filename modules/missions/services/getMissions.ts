import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type { Mission, MissionCard, MissionStatus, MissionType } from '@/types/mission'
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@/lib/i18n'

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

const MISSION_FULL_SELECT = `
  id, name, slug, description, status, launch_date,
  mission_type, featured_image, destination, featured,
  timeline, created_at, updated_at, agency_id,
  space_agencies ( id, name, slug, short_name, country, logo_url, description, website_url )
`

// Tolerant card-name overlay for a language (empty on any failure).
async function fetchMissionCardTranslations(
  ids: string[], lang: LanguageCode,
): Promise<Map<string, { name: string; description: string | null }>> {
  const map = new Map<string, { name: string; description: string | null }>()
  if (lang === DEFAULT_LANGUAGE || ids.length === 0) return map
  const { data, error } = await supabase
    .from('mission_translations')
    .select('mission_id, name, description')
    .in('mission_id', ids)
    .eq('language_code', lang)
    .eq('is_published', true)
  if (error || !data) return map
  for (const r of data as any[]) map.set(r.mission_id, { name: r.name, description: r.description })
  return map
}

async function overlayMissionCards(cards: MissionCard[], lang: LanguageCode): Promise<MissionCard[]> {
  if (lang === DEFAULT_LANGUAGE || cards.length === 0) return cards
  const overlay = await fetchMissionCardTranslations(cards.map(c => c.id), lang)
  return cards.map(c => {
    const t = overlay.get(c.id)
    return t ? { ...c, name: t.name || c.name, description: (t.description ?? c.description) || '' } : c
  })
}

export async function getMissions({
  page    = 1,
  perPage = 12,
  status,
  type,
  lang = DEFAULT_LANGUAGE,
}: {
  page?    : number
  perPage? : number
  status?  : MissionStatus
  type?    : MissionType
  lang?    : LanguageCode
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
    missions:   await overlayMissionCards(normalizeCards(data || []), lang),
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
  const { data, error } = await supabase
    .from('missions')
    .select(MISSION_FULL_SELECT)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  const translations = await fetchMissionTranslations(data.id)
  return normalizeFull(data, lang, translations)
})

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

function normalizeFull(row: any, lang: LanguageCode = DEFAULT_LANGUAGE, translations: MissionTranslation[] = []): Mission {
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
    language:            served,
    availableLanguages: [DEFAULT_LANGUAGE, ...Array.from(new Set(otherLangs))],
  }
}
