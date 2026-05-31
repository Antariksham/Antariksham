import { supabase } from '@/lib/supabase'

// ── Result shape types ────────────────────────────────────────

export interface SearchArticleResult {
  type:          'article'
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  category:      string | null
  articleType:   string
  publishedAt:   string | null
  readingTime:   number
}

export interface SearchMissionResult {
  type:          'mission'
  id:            string
  name:          string
  slug:          string
  description:   string
  status:        string
  missionType:   string
  destination:   string | null
  agency:        string | null
}

export interface SearchLearnResult {
  type:            'learn'
  id:              string
  title:           string
  slug:            string
  excerpt:         string
  difficultyLevel: string
  icon:            string
}

export type SearchResult =
  | SearchArticleResult
  | SearchMissionResult
  | SearchLearnResult

export interface SearchResults {
  articles:  SearchArticleResult[]
  missions:  SearchMissionResult[]
  learn:     SearchLearnResult[]
  total:     number
  query:     string
}

// ── Main search function ──────────────────────────────────────

export async function search(query: string): Promise<SearchResults> {
  const q = query.trim()

  if (!q || q.length < 2) {
    return { articles: [], missions: [], learn: [], total: 0, query: q }
  }

  const pattern = `%${q}%`

  // Run all 3 queries in parallel
  const [articlesRes, missionsRes, learnRes] = await Promise.all([

    // Articles — search title + excerpt, published only
    supabase
      .from('articles')
      .select(`
        id, title, slug, excerpt, published_at, reading_time, article_type,
        article_categories ( categories ( name ) )
      `)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(8),

    // Missions — search name + description
    supabase
      .from('missions')
      .select(`
        id, name, slug, description, status, mission_type, destination,
        space_agencies ( short_name )
      `)
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order('launch_date', { ascending: false, nullsFirst: false })
      .limit(6),

    // Knowledge articles — search title + excerpt
    supabase
      .from('knowledge_articles')
      .select('id, title, slug, excerpt, difficulty_level, icon')
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Normalize articles
  const articles: SearchArticleResult[] = (articlesRes.data || []).map((row: any) => ({
    type:        'article' as const,
    id:          row.id,
    title:       row.title,
    slug:        row.slug,
    excerpt:     row.excerpt || '',
    category:    row.article_categories?.[0]?.categories?.name || null,
    articleType: row.article_type || 'news',
    publishedAt: row.published_at || null,
    readingTime: row.reading_time || 5,
  }))

  // Normalize missions
  const missions: SearchMissionResult[] = (missionsRes.data || []).map((row: any) => ({
    type:        'mission' as const,
    id:          row.id,
    name:        row.name,
    slug:        row.slug,
    description: row.description || '',
    status:      row.status,
    missionType: row.mission_type,
    destination: row.destination || null,
    agency:      row.space_agencies?.short_name || null,
  }))

  // Normalize learn
  const learn: SearchLearnResult[] = (learnRes.data || []).map((row: any) => ({
    type:            'learn' as const,
    id:              row.id,
    title:           row.title,
    slug:            row.slug,
    excerpt:         row.excerpt || '',
    difficultyLevel: row.difficulty_level || 'beginner',
    icon:            row.icon || '🔭',
  }))

  if (articlesRes.error)  console.error('search articles error:', articlesRes.error)
  if (missionsRes.error)  console.error('search missions error:', missionsRes.error)
  if (learnRes.error)     console.error('search learn error:', learnRes.error)

  const total = articles.length + missions.length + learn.length

  return { articles, missions, learn, total, query: q }
}
