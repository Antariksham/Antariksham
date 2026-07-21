import { supabase } from '@/lib/supabase'

export interface AuthorProfile {
  id:          string
  slug:        string
  name:        string
  bio:         string | null
  avatar:      string | null
  socialLinks: { twitter?: string; linkedin?: string; website?: string }
}

// Public author profile by slug (anon client — needs the authors RLS read policy).
export async function getAuthorBySlug(slug: string): Promise<AuthorProfile | null> {
  const { data, error } = await supabase
    .from('authors')
    .select('id, slug, name, bio, avatar, social_links')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id:          data.id,
    slug:        data.slug,
    name:        data.name,
    bio:         data.bio    || null,
    avatar:      data.avatar || null,
    socialLinks: (data.social_links as AuthorProfile['socialLinks']) || {},
  }
}

// For generateStaticParams + the sitemap.
export async function getAllAuthorSlugs(): Promise<string[]> {
  const { data, error } = await supabase.from('authors').select('slug')
  if (error) return []
  return (data || []).map((r: any) => r.slug).filter(Boolean)
}
