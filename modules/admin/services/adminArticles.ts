import { supabaseAdmin } from '@/lib/supabase'
import { enforceSingleFeatured } from './featuredExclusive'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'
import type { Article, ArticleStatus, ArticleType, ArticleCategory, FeaturedImageMeta } from '@/types/article'

// Detects "column articles.featured_image_meta does not exist" so the editor
// keeps working before this migration has been applied.
function isMissingFeaturedMetaColumn(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('featured_image_meta') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}

// Same graceful degradation for the scheduling columns (Feature 4) before that
// migration has been applied.
function isMissingSchedulingColumn(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return (msg.includes('scheduled_at') || msg.includes('expire_at')) &&
    (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}
function isMissingOptionalColumn(error: any): boolean {
  return isMissingFeaturedMetaColumn(error) || isMissingSchedulingColumn(error)
}
function stripOptional(row: Record<string, any>): Record<string, any> {
  const { featured_image_meta, scheduled_at, expire_at, ...rest } = row
  return rest
}

// ── List / search ─────────────────────────────────────────────

export interface AdminArticleRow {
  id:          string
  title:       string
  slug:        string
  status:      ArticleStatus
  articleType: ArticleType
  featured:    boolean
  views:       number
  readingTime: number
  publishedAt: string | null
  updatedAt:   string
  categories:  string[]
  tags:        string[]
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
      `id, title, slug, status, article_type, featured, views, reading_time, published_at, updated_at,
       authors ( name ),
       article_categories ( categories ( name ) ),
       article_tags ( tags ( name ) )`,
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
    readingTime: r.reading_time || 0,
    publishedAt: r.published_at || null,
    updatedAt:   r.updated_at,
    categories:  (r.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
    tags:        (r.article_tags || []).map((at: any) => at.tags?.name).filter(Boolean),
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
  featuredImageMeta: FeaturedImageMeta | null
  authorId:      string | null
  status:        ArticleStatus
  articleType:   ArticleType
  featured:      boolean
  publishedAt:   string | null
  scheduledAt:   string | null
  expireAt:      string | null
  readingTime:   number
  views:         number
  categoryIds:   string[]
  tagIds:        string[]
}

export async function getAdminArticleById(id: string): Promise<AdminArticleFull | null> {
  const db = supabaseAdmin()

  const baseCols = `
      id, title, slug, excerpt, content, featured_image,
      author_id, status, article_type, featured,
      published_at, reading_time, views,
      article_categories ( category_id ),
      article_tags ( tag_id )`

  let { data, error }: { data: any; error: any } = await db
    .from('articles')
    .select(`${baseCols}, featured_image_meta, scheduled_at, expire_at`)
    .eq('id', id)
    .single()

  // Drop optional columns progressively if their migrations aren't applied yet.
  if (error && isMissingSchedulingColumn(error)) {
    ({ data, error } = await db.from('articles').select(`${baseCols}, featured_image_meta`).eq('id', id).single())
  }
  if (error && isMissingFeaturedMetaColumn(error)) {
    ({ data, error } = await db.from('articles').select(baseCols).eq('id', id).single())
  }

  if (error || !data) return null

  return {
    id:            data.id,
    title:         data.title,
    slug:          data.slug,
    excerpt:       data.excerpt || '',
    content:       data.content || '',
    featuredImage: data.featured_image || null,
    featuredImageMeta: (data.featured_image_meta as FeaturedImageMeta) || null,
    authorId:      data.author_id || null,
    status:        data.status,
    articleType:   data.article_type,
    featured:      data.featured || false,
    publishedAt:   data.published_at || null,
    scheduledAt:   data.scheduled_at || null,
    expireAt:      data.expire_at || null,
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
  featuredImageMeta?: FeaturedImageMeta | null
  authorId:      string | null
  status:        ArticleStatus
  articleType:   ArticleType
  featured:      boolean
  readingTime:   number
  categoryIds:   string[]
  tagIds:        string[]
  scheduledAt?:  string | null   // ISO — when status is 'scheduled'
  expireAt?:     string | null   // ISO — auto-archive at this time
  republish?:    boolean         // re-stamp published_at to now even if already published
}

export async function createAdminArticle(payload: ArticlePayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()

  await assertSlugAvailable(db, 'articles', payload.slug)

  const row: Record<string, any> = {
    title:          payload.title,
    slug:           payload.slug,
    excerpt:        payload.excerpt,
    content:        payload.content,
    featured_image: payload.featuredImage || null,
    featured_image_meta: payload.featuredImageMeta || null,
    author_id:      payload.authorId || null,
    status:         payload.status,
    article_type:   payload.articleType,
    featured:       payload.featured,
    reading_time:   payload.readingTime,
    published_at:   payload.status === 'published' ? new Date().toISOString() : null,
    scheduled_at:   payload.status === 'scheduled' ? (payload.scheduledAt || null) : null,
    expire_at:      payload.expireAt || null,
    views:          0,
  }

  let { data, error }: { data: any; error: any } = await db.from('articles').insert(row).select('id').single()

  // Retry without the optional columns if their migrations aren't applied yet.
  if (error && isMissingOptionalColumn(error)) {
    ({ data, error } = await db.from('articles').insert(stripOptional(row)).select('id').single())
  }

  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminArticle error:', error)
    return null
  }

  await enforceSingleFeatured(db, 'articles', data.id, payload.featured)
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

  await assertSlugAvailable(db, 'articles', payload.slug, id)

  const row: Record<string, any> = {
    title:          payload.title,
    slug:           payload.slug,
    excerpt:        payload.excerpt,
    content:        payload.content,
    featured_image: payload.featuredImage || null,
    featured_image_meta: payload.featuredImageMeta || null,
    author_id:      payload.authorId || null,
    status:         payload.status,
    article_type:   payload.articleType,
    featured:       payload.featured,
    reading_time:   payload.readingTime,
    // Stamp published_at on first publish, or when explicitly republishing;
    // otherwise keep the original date.
    published_at:
      payload.status === 'published' && (payload.republish || !existingPublishedAt)
        ? new Date().toISOString()
        : existingPublishedAt,
    scheduled_at:   payload.status === 'scheduled' ? (payload.scheduledAt || null) : null,
    expire_at:      payload.expireAt || null,
  }

  let { error }: { error: any } = await db.from('articles').update(row).eq('id', id)

  // Retry without the optional columns if their migrations aren't applied yet.
  if (error && isMissingOptionalColumn(error)) {
    ({ error } = await db.from('articles').update(stripOptional(row)).eq('id', id))
  }

  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminArticle error:', error)
    return false
  }

  await enforceSingleFeatured(db, 'articles', id, payload.featured)
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

// ── Bulk actions (Feature 8) ──────────────────────────────────
// Efficient set-based operations over many selected articles. Each runs a
// single `.in('id', ids)` query rather than N round-trips.

export async function bulkUpdateStatus(ids: string[], status: ArticleStatus): Promise<boolean> {
  if (ids.length === 0) return true
  const db = supabaseAdmin()
  const { error } = await db.from('articles').update({ status }).in('id', ids)
  if (error) { console.error('bulkUpdateStatus error:', error); return false }
  // First-time publish: stamp published_at only where it's still null.
  if (status === 'published') {
    await db.from('articles').update({ published_at: new Date().toISOString() }).in('id', ids).is('published_at', null)
  }
  return true
}

export async function bulkDeleteArticles(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true
  const db = supabaseAdmin()
  const { error } = await db.from('articles').delete().in('id', ids)
  if (error) { console.error('bulkDeleteArticles error:', error); return false }
  return true
}

export async function bulkAssignAuthor(ids: string[], authorId: string): Promise<boolean> {
  if (ids.length === 0) return true
  const db = supabaseAdmin()
  const { error } = await db.from('articles').update({ author_id: authorId || null }).in('id', ids)
  if (error) { console.error('bulkAssignAuthor error:', error); return false }
  return true
}

/** Append a category to every selected article (existing links are kept). */
export async function bulkAddCategory(ids: string[], categoryId: string): Promise<boolean> {
  if (ids.length === 0 || !categoryId) return true
  const db = supabaseAdmin()
  const rows = ids.map(id => ({ article_id: id, category_id: categoryId }))
  const { error } = await db.from('article_categories').upsert(rows, { onConflict: 'article_id,category_id', ignoreDuplicates: true })
  if (error) { console.error('bulkAddCategory error:', error); return false }
  return true
}

/** Append a tag to every selected article (existing links are kept). */
export async function bulkAddTag(ids: string[], tagId: string): Promise<boolean> {
  if (ids.length === 0 || !tagId) return true
  const db = supabaseAdmin()
  const rows = ids.map(id => ({ article_id: id, tag_id: tagId }))
  const { error } = await db.from('article_tags').upsert(rows, { onConflict: 'article_id,tag_id', ignoreDuplicates: true })
  if (error) { console.error('bulkAddTag error:', error); return false }
  return true
}

// ── Scheduled publishing / expiry (Feature 4) ─────────────────
// Run by /api/cron/publish (Vercel Cron). Promotes scheduled articles whose
// time has arrived and archives published ones past their expiry. No-ops
// gracefully until the scheduling migration is applied.
export async function runScheduledPublishing(
  nowIso: string = new Date().toISOString(),
): Promise<{ published: number; expired: number }> {
  const db = supabaseAdmin()
  let published = 0
  let expired = 0

  const pub = await db
    .from('articles')
    .update({ status: 'published', published_at: nowIso, scheduled_at: null })
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)
    .select('id')
  if (pub.error) {
    if (isMissingSchedulingColumn(pub.error)) return { published: 0, expired: 0 }
    console.error('runScheduledPublishing/publish:', pub.error)
  } else {
    published = pub.data?.length || 0
  }

  const exp = await db
    .from('articles')
    .update({ status: 'archived' })
    .eq('status', 'published')
    .lte('expire_at', nowIso)
    .select('id')
  if (exp.error) {
    if (isMissingSchedulingColumn(exp.error)) return { published, expired: 0 }
    console.error('runScheduledPublishing/expire:', exp.error)
  } else {
    expired = exp.data?.length || 0
  }

  return { published, expired }
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
