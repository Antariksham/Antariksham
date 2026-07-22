import { supabaseAdmin } from '@/lib/supabase'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'

// ── Types ─────────────────────────────────────────────────────

export interface AdminAuthorRow {
  id:         string
  slug:       string
  name:       string
  bio:        string | null
  avatar:     string | null
  featured:   boolean
  articleCount: number
  createdAt:  string
}

export interface AdminAuthorFull {
  id:           string
  slug:         string
  name:         string
  bio:          string
  avatar:       string
  socialLinks:  SocialLinks
  featured:     boolean
}

export interface SocialLinks {
  twitter?:  string
  linkedin?: string
  website?:  string
}

export interface AuthorPayload {
  slug:        string
  name:        string
  bio:         string | null
  avatar:      string | null
  socialLinks: SocialLinks
  featured:    boolean
}

// ── List ──────────────────────────────────────────────────────

export async function getAdminAuthors(): Promise<AdminAuthorRow[]> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('authors')
    .select('id, slug, name, bio, avatar, featured, created_at')
    .order('name')

  if (error) { console.error('getAdminAuthors error:', error); return [] }

  // Get article counts per author
  const ids = (data || []).map((a: any) => a.id)
  const counts: Record<string, number> = {}

  if (ids.length > 0) {
    const { data: articles } = await db
      .from('articles')
      .select('author_id')
      .in('author_id', ids)

    ;(articles || []).forEach((a: any) => {
      counts[a.author_id] = (counts[a.author_id] || 0) + 1
    })
  }

  return (data || []).map((r: any) => ({
    id:           r.id,
    slug:         r.slug || '',
    name:         r.name,
    bio:          r.bio || null,
    avatar:       r.avatar || null,
    featured:     r.featured || false,
    articleCount: counts[r.id] || 0,
    createdAt:    r.created_at,
  }))
}

// ── Single ────────────────────────────────────────────────────

export async function getAdminAuthorById(id: string): Promise<AdminAuthorFull | null> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('authors')
    .select('id, slug, name, bio, avatar, social_links, featured')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id:          data.id,
    slug:        data.slug         || '',
    name:        data.name,
    bio:         data.bio          || '',
    avatar:      data.avatar       || '',
    socialLinks: (data.social_links as SocialLinks) || {},
    featured:    data.featured     || false,
  }
}

// ── Create ────────────────────────────────────────────────────

export async function createAdminAuthor(p: AuthorPayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'authors', p.slug)
  const { data, error } = await db
    .from('authors')
    .insert({
      slug:         p.slug,
      name:         p.name,
      bio:          p.bio          || null,
      avatar:       p.avatar       || null,
      social_links: p.socialLinks  || {},
      featured:     p.featured,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminAuthor error:', error)
    return null
  }
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────

export async function updateAdminAuthor(id: string, p: AuthorPayload): Promise<boolean> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'authors', p.slug, id)
  const { error } = await db
    .from('authors')
    .update({
      slug:         p.slug,
      name:         p.name,
      bio:          p.bio          || null,
      avatar:       p.avatar       || null,
      social_links: p.socialLinks  || {},
      featured:     p.featured,
    })
    .eq('id', id)

  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminAuthor error:', error)
    return false
  }
  return true
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteAdminAuthor(id: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db.from('authors').delete().eq('id', id)
  if (error) { console.error('deleteAdminAuthor error:', error); return false }
  return true
}
