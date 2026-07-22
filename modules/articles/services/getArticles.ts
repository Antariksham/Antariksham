import { supabase } from '@/lib/supabase'
import type { Article, ArticleCard, ArticleCategory } from '@/types/article'

const ARTICLE_CARD_SELECT = `
  id, title, slug, excerpt, featured_image,
  published_at, reading_time, article_type, featured,
  authors ( name, avatar ),
  article_categories ( categories ( name, slug, color ) )
`

// Inner-join variant: only articles that HAVE the requested category, so the
// filter restricts the parent rows (and the exact count) at the database.
const ARTICLE_CARD_SELECT_FILTERED = `
  id, title, slug, excerpt, featured_image,
  published_at, reading_time, article_type, featured,
  authors ( name, avatar ),
  article_categories!inner ( categories!inner ( name, slug, color ) )
`

const ARTICLE_FULL_SELECT = `
  id, title, slug, excerpt, content, featured_image,
  published_at, updated_at, reading_time, views, article_type, featured,
  authors ( id, slug, name, bio, avatar, social_links, featured ),
  article_categories ( categories ( name, slug, color ) ),
  article_tags ( tags ( name, slug ) ),
  seo_metadata ( meta_title, meta_description, og_image, keywords, canonical_url )
`

export async function getArticles({
  page = 1, perPage = 12, category, authorId,
}: { page?: number; perPage?: number; category?: ArticleCategory; authorId?: string } = {}) {
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('articles')
    .select(category ? ARTICLE_CARD_SELECT_FILTERED : ARTICLE_CARD_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (category) query = query.eq('article_categories.categories.name', category)
  if (authorId) query = query.eq('author_id', authorId)

  const { data, error, count } = await query

  if (error) {
    console.error('getArticles error:', error)
    return { articles: [], total: 0, totalPages: 0 }
  }

  return {
    articles:   normalizeCards(data || []),
    total:      count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

export async function getFeaturedArticles(limit = 7) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [])
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_FULL_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  // Increment view count (fire and forget) via a SECURITY DEFINER RPC, so the
  // public anon key never needs write access to the articles table.
  supabase
    .rpc('increment_article_views', { article_id: data.id })
    .then(() => {}, () => {})

  return normalizeFullArticle(data)
}

export async function getRelatedArticles(articleId: string, limit = 3) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [])
}

export async function getLatestArticles(limit = 5) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [])
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

// ── Normalizers ───────────────────────────────────────────────
function normalizeCards(rows: any[]): ArticleCard[] {
  return rows.map(row => ({
    id:            row.id,
    title:         row.title,
    slug:          row.slug,
    excerpt:       row.excerpt || '',
    featuredImage: row.featured_image || null,
    author:        row.authors ? { name: row.authors.name, avatar: row.authors.avatar } : null,
    publishedAt:   row.published_at || null,
    readingTime:   row.reading_time || 5,
    articleType:   row.article_type,
    categories:    (row.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
    featured:      row.featured || false,
  }))
}

function normalizeFullArticle(row: any): Article {
  return {
    id:            row.id,
    title:         row.title,
    slug:          row.slug,
    excerpt:       row.excerpt || '',
    content:       row.content || '',
    featuredImage: row.featured_image || null,
    author:        row.authors || null,
    authorId:      row.authors?.id || '',
    status:        'published',
    articleType:   row.article_type,
    publishedAt:   row.published_at || null,
    updatedAt:     row.updated_at || '',
    featured:      row.featured || false,
    readingTime:   row.reading_time || 5,
    views:         row.views || 0,
    categories:    (row.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
    tags:          (row.article_tags || []).map((at: any) => at.tags?.name).filter(Boolean),
  }
      }
