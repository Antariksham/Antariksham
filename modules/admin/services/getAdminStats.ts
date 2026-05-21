import { supabase } from '@/lib/supabase'

export interface AdminStats {
  totalArticles:     number
  publishedArticles: number
  draftArticles:     number
  featuredArticles:  number
  totalMissions:     number
  activeMissions:    number
  upcomingMissions:  number
  recentArticles:    RecentArticle[]
}

export interface RecentArticle {
  id:          string
  title:       string
  slug:        string
  status:      string
  publishedAt: string | null
  views:       number
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    articlesResult,
    publishedResult,
    draftResult,
    featuredResult,
    missionsResult,
    activeMissionsResult,
    upcomingMissionsResult,
    recentArticlesResult,
  ] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('missions').select('id', { count: 'exact', head: true }),
    supabase.from('missions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('missions').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    supabase.from('articles')
      .select('id, title, slug, status, published_at, views')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return {
    totalArticles:     articlesResult.count       || 0,
    publishedArticles: publishedResult.count      || 0,
    draftArticles:     draftResult.count          || 0,
    featuredArticles:  featuredResult.count       || 0,
    totalMissions:     missionsResult.count       || 0,
    activeMissions:    activeMissionsResult.count || 0,
    upcomingMissions:  upcomingMissionsResult.count || 0,
    recentArticles: (recentArticlesResult.data || []).map((a: any) => ({
      id:          a.id,
      title:       a.title,
      slug:        a.slug,
      status:      a.status,
      publishedAt: a.published_at,
      views:       a.views || 0,
    })),
  }
}
