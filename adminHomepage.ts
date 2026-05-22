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
  badge:       string   // e.g. "NASA · Saturn Mission"
  title:       string   // featured card title
  excerpt:     string   // featured card excerpt
  readTime:    string   // e.g. "10 min read"
  category:    string   // e.g. "Research"
  articleSlug: string   // link target — /news/[slug]
  imageUrl:    string   // optional hero image URL
}

// ── Get all sections ──────────────────────────────────────────

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('homepage_sections')
    .select('id, name, slug, enabled, sort_order, config')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getHomepageSections error:', error)
    return []
  }

  return (data || []).map((r: any) => ({
    id:        r.id,
    name:      r.name,
    slug:      r.slug,
    enabled:   r.enabled ?? true,
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
    .eq('slug', 'hero')
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
    .eq('slug', 'hero')
    .single()

  if (error || !data) return null
  return (data.config as HeroConfig) || null
}

// ── Update section enabled/order ──────────────────────────────

export async function updateSectionEnabled(id: string, enabled: boolean): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('homepage_sections')
    .update({ enabled })
    .eq('id', id)
  if (error) { console.error('updateSectionEnabled error:', error); return false }
  return true
}

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
  const { error } = await db
    .from('homepage_sections')
    .update({ config })
    .eq('slug', 'hero')
  if (error) { console.error('updateHeroConfig error:', error); return false }
  return true
}
