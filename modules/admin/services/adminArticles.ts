import { supabaseAdmin } from '@/lib/supabase'
import type { Article, ArticleStatus, ArticleType, ArticleCategory } from '@/types/article'

// ── List / search ─────────────────────────────────────────────

export interface AdminArticleRow {
  id:          string
  title:       string
  slug:        string
  status:      ArticleStatus
  articleType: ArticleType
  featured:    boolean
  views:       number
  publishedAt: string | null
  updatedAt:   string
  categories:  string[]
  authorName:  string | null
}

export async function getAdminArticles({
  page    = 1,
  perPage = 20,
  status,
  search,
}: {
  page?:    number
  perPage?: number
  status?:  ArticleStatus | 'all'
  search?:  string
} = {}): Promise<{ rows: AdminArticleRow[]; total: number; totalPages: number }> {
  const db   = supabaseAdmin()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = db
    .from('articles')
    .select(
      `id, title, slug, status, article_type, featured, views, published_at, updated_at,
       authors ( name ),
       article_categories ( categories ( name ) )`,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('getAdminArticles error:', error)
    return { rows: [], total: 0, totalPages: 0 }
  }

  const rows: AdminArticleRow[] = (data || []).map((r: any) => ({
    id:          r.id,
    title:       r.title,
    slug:        r.slug,
    status:      r.status,
    articleType: r.article_type,
    featured:    r.featured || false,
    views:       r.views || 0,
    publishedAt: r.published_at || null,
    updatedAt:   r.updated_at,
    categories:  (r.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
    authorName:  r.authors?.name || null,
  }))

  return {
    rows,
    total:      count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

// ── Single article for editing ────────────────────────────────

export interface AdminArticleFull {
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  content:       string
  featuredImage: string | null
  authorId:      string | null
  status:        ArticleStatus
  articleType:   ArticleType
  featured:      boolean
  publishedAt:   string | null
  readingTime:   number
  views:         number
  categoryIds:   string[]
  tagIds:        string[]
}

export async function getAdminArticleById(id: string): Promise<AdminArticleFull | null> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('articles')
    .select(`
      id, title, slug, excerpt, content, featured_image,
      author_id, status, article_type, featured,
      published_at, reading_time, views,
      article_categories ( category_id ),
      article_tags ( tag_id )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id:            data.id,
    title:         data.title,
    slug:          data.slug,
    excerpt:       data.excerpt || '',
    content:       data.content || '',
    featuredImage: data.featured_image || null,
    authorId:      data.author_id || null,
    status:        data.status,
    articleType:   data.article_type,
    featured:      data.featured || false,
    publishedAt:   data.published_at || null,
    readingTime:   data.reading_time || 5,
    views:         data.views || 0,
    categoryIds:   (data.article_categories as any[] || []).map((ac) => ac.category_id),
    tagIds:        (data.article_tags as any[] || []).map((at) => at.tag_id),
  }
}

// ── Create ────────────────────────────────────────────────────

export interface ArticlePayload {
  title:         string
  slug:          string
  excerpt:       string
  content:       string
  featuredImage: string | null
  authorId:      string | null
  status:        ArticleStatus
  articleType:   ArticleType
  featured:      boolean
  readingTime:   number
  categoryIds:   string[]
  tagIds:        string[]
}

export async function createAdminArticle(payload: ArticlePayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('articles')
    .insert({
      title:          payload.title,
      slug:           payload.slug,
      excerpt:        payload.excerpt,
      content:        payload.content,
      featured_image: payload.featuredImage || null,
      author_id:      payload.authorId || null,
      status:         payload.status,
      article_type:   payload.articleType,
      featured:       payload.featured,
      reading_time:   payload.readingTime,
      published_at:   payload.status === 'published' ? new Date().toISOString() : null,
      views:          0,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('createAdminArticle error:', error)
    return null
  }

  await syncRelations(db, data.id, payload.categoryIds, payload.tagIds)
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────

export async function updateAdminArticle(
  id: string,
  payload: ArticlePayload,
  existingPublishedAt: string | null
): Promise<boolean> {
  const db = supabaseAdmin()

  const { error } = await db
    .from('articles')
    .update({
      title:          payload.title,
      slug:           payload.slug,
      excerpt:        payload.excerpt,
      content:        payload.content,
      featured_image: payload.featuredImage || null,
      author_id:      payload.authorId || null,
      status:         payload.status,
      article_type:   payload.articleType,
      featured:       payload.featured,
      reading_time:   payload.readingTime,
      // Set published_at only when first publishing
      published_at:
        payload.status === 'published' && !existingPublishedAt
          ? new Date().toISOString()
          : existingPublishedAt,
    })
    .eq('id', id)

  if (error) {
    console.error('updateAdminArticle error:', error)
    return false
  }

  await syncRelations(db, id, payload.categoryIds, payload.tagIds)
  return true
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteAdminArticle(id: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db.from('articles').delete().eq('id', id)
  if (error) {
    console.error('deleteAdminArticle error:', error)
    return false
  }
  return true
}

// ── Categories & Tags (for the form dropdowns) ────────────────

export interface CategoryOption { id: string; name: string; slug: string }
export interface TagOption      { id: string; name: string; slug: string }
export interface AuthorOption   { id: string; name: string }

export async function getFormOptions(): Promise<{
  categories: CategoryOption[]
  tags:       TagOption[]
  authors:    AuthorOption[]
}> {
  const db = supabaseAdmin()

  const [catRes, tagRes, authRes] = await Promise.all([
    db.from('categories').select('id, name, slug').order('name'),
    db.from('tags').select('id, name, slug').order('name'),
    db.from('authors').select('id, name').order('name'),
  ])

  return {
    categories: catRes.data || [],
    tags:       tagRes.data || [],
    authors:    authRes.data || [],
  }
}

// ── Internal helper ───────────────────────────────────────────

async function syncRelations(
  db: ReturnType<typeof supabaseAdmin>,
  articleId: string,
  categoryIds: string[],
  tagIds: string[]
) {
  // Replace categories
  await db.from('article_categories').delete().eq('article_id', articleId)
  if (categoryIds.length > 0) {
    await db.from('article_categories').insert(
      categoryIds.map(cid => ({ article_id: articleId, category_id: cid }))
    )
  }

  // Replace tags
  await db.from('article_tags').delete().eq('article_id', articleId)
  if (tagIds.length > 0) {
    await db.from('article_tags').insert(
      tagIds.map(tid => ({ article_id: articleId, tag_id: tid }))
    )
  }
}
