import { supabaseAdmin } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────

export interface HomepageSection {
  id:        string
  name:      string
  slug:      string
  enabled:   boolean
  sortOrder: number
  config:    Record<string, any>
}

export interface HeroConfig {
  badge:       string
  title:       string
  excerpt:     string
  readTime:    string
  category:    string
  articleSlug: string
  imageUrl:    string
}

// ── Get all sections ──────────────────────────────────────────

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('homepage_sections')
    .select('id, section, enabled, sort_order, config')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getHomepageSections error:', error)
    return []
  }

  return (data || []).map((r: any) => ({
    id:        r.id,
    name:      r.section,
    slug:      r.section,
    enabled:   r.enabled  ?? true,
    sortOrder: r.sort_order ?? 0,
    config:    r.config    ?? {},
  }))
}

// ── Get hero config ───────────────────────────────────────────

export async function getHeroConfig(): Promise<HeroConfig | null> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('homepage_sections')
    .select('config')
    .eq('section', 'hero')
    .single()

  if (error || !data) return null
  return (data.config as HeroConfig) || null
}

// Public version (uses anon key — for the actual homepage)
export async function getHeroConfigPublic(): Promise<HeroConfig | null> {
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await db
    .from('homepage_sections')
    .select('config')
    .eq('section', 'hero')
    .single()

  if (error || !data) return null
  return (data.config as HeroConfig) || null
}

// ── Update section enabled ────────────────────────────────────

export async function updateSectionEnabled(id: string, enabled: boolean): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('homepage_sections')
    .update({ enabled })
    .eq('id', id)
  if (error) { console.error('updateSectionEnabled error:', error); return false }
  return true
}

// ── Update section order ──────────────────────────────────────

export async function updateSectionOrder(id: string, sortOrder: number): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('homepage_sections')
    .update({ sort_order: sortOrder })
    .eq('id', id)
  if (error) { console.error('updateSectionOrder error:', error); return false }
  return true
}

// ── Update hero config ────────────────────────────────────────

export async function updateHeroConfig(config: HeroConfig): Promise<boolean> {
  const db = supabaseAdmin()

  // Update the existing hero row and ask for the affected rows back so we can
  // tell whether anything was actually changed.
  const { data, error } = await db
    .from('homepage_sections')
    .update({ config })
    .eq('section', 'hero')
    .select('id')

  if (error) { console.error('updateHeroConfig error:', error); return false }

  // No hero row existed yet — a bare UPDATE would match zero rows and report
  // success while persisting nothing. Insert the row so the edit sticks.
  if (!data || data.length === 0) {
    const { error: insertError } = await db
      .from('homepage_sections')
      .insert({ section: 'hero', config, enabled: true, sort_order: 0 })
    if (insertError) { console.error('updateHeroConfig insert error:', insertError); return false }
  }

  return true
}
