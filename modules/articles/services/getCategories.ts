import { supabase } from '@/lib/supabase'

/**
 * The article categories, for the public listing's filter rail.
 *
 * The rail used to be a hardcoded array of ten names in `ArticlesPage`, copied
 * from a literal union in `types/article.ts` — so a category added in the admin
 * was invisible to readers. It reads the table instead.
 *
 * Anon-key read: `categories` is public per the RLS policies
 * (20260720160000_rls_policies.sql).
 */

export interface PublicCategory {
  name:  string
  slug:  string
  color: string | null
}

export async function getCategories(): Promise<PublicCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name, slug, color')
    .order('name')
    .limit(200)

  if (error) {
    // The filter rail is a convenience, not the page: fall back to no chips
    // rather than failing the listing.
    console.error('getCategories error:', error)
    return []
  }

  return (data || []).map((c: any) => ({
    name:  c.name,
    slug:  c.slug || '',
    color: c.color || null,
  }))
}
