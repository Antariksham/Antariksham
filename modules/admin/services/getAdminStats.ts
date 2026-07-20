import { supabaseAdmin } from '@/lib/supabase'

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
  // Use the service-role client (like every other admin read) so drafts and
  // other non-published rows are counted. The anon client is bound by RLS,
  // which hides drafts and skews the dashboard's Total / Drafts / Featured
  // counts and the "Recent Articles" list.
  const db = supabaseAdmin()

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
    db.from('articles').select('id', { count: 'exact', head: true }),
    db.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('articles').select('id', { count: 'exact', head: true }).eq('featured', true),
    db.from('missions').select('id', { count: 'exact', head: true }),
    db.from('missions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('missions').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    db.from('articles')
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
