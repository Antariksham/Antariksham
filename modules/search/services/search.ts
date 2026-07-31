import { supabase } from '@/lib/supabase'
import {
  groupSearchRows,
  suggestionsFromFuzzy,
  isMissingFunction,
  type SearchRow,
  type FuzzyRow,
} from './searchRows'

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
  /** "Did you mean" terms, only populated when the search itself found nothing. */
  suggestions?: string[]
}

// ── Main search function ──────────────────────────────────────

/**
 * Full-text search across articles, missions and knowledge articles.
 *
 * Runs through the `search_content` RPC added in
 * supabase/migrations/20260731120000_content_search.sql, which searches article
 * BODIES (not just titles and excerpts), ranks by relevance rather than date,
 * and takes the query as a bound parameter instead of splicing it into a filter
 * string.
 *
 * Falls back to the previous ILIKE query when that function is not present, so
 * deploying this code before running the migration degrades to the old
 * behaviour instead of breaking search — the same tolerance used for
 * `thumbnail`, `details` and `featured_image_meta` elsewhere.
 */
export async function search(query: string): Promise<SearchResults> {
  const q = query.trim()

  if (!q || q.length < 2) {
    return { articles: [], missions: [], learn: [], total: 0, query: q }
  }

  const { data, error } = await supabase.rpc('search_content', { q, max_results: 30 })

  if (!error) {
    const results = groupSearchRows((data ?? []) as SearchRow[], q)

    // Only pay for the trigram scan when full text found nothing at all.
    if (results.total === 0) {
      const { data: fuzzy, error: fuzzyError } = await supabase
        .rpc('search_content_fuzzy', { q, max_results: 10 })
      if (!fuzzyError && fuzzy) {
        results.suggestions = suggestionsFromFuzzy(fuzzy as FuzzyRow[])
      }
    }
    return results
  }

  if (!isMissingFunction(error)) {
    // A real failure (RLS, network, timeout) — report it, then still try the
    // legacy path so the page shows something rather than nothing.
    console.error('search_content rpc error:', error)
  }

  return legacySearch(q)
}

// ── Legacy ILIKE search ───────────────────────────────────────
//
// Kept only as the fallback described above. It searches title + excerpt only
// and orders by date, so it cannot find a phrase that appears in an article
// body. Delete it once the migration has been applied everywhere.

async function legacySearch(q: string): Promise<SearchResults> {
  // Escape the PostgREST filter metacharacters. The original code interpolated
  // `q` raw, so a comma split the .or() string into extra conditions and a
  // search for "Apollo 11, 12" failed outright.
  const pattern = `%${q.replace(/[,()\\]/g, ' ')}%`

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
