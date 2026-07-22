import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type { Article, ArticleCard, ArticleCategory } from '@/types/article'
import {
  DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode,
} from '@/lib/i18n'

// Translations are embedded via the article_id foreign key. RLS on
// article_translations only exposes rows where is_published = true, so anon
// reads here can only ever see published translations — no extra filter needed.
const CARD_TRANSLATIONS = `article_translations ( language_code, title, excerpt )`
const FULL_TRANSLATIONS = `article_translations ( language_code, title, excerpt, content )`

const ARTICLE_CARD_SELECT = `
  id, title, slug, excerpt, featured_image,
  published_at, reading_time, article_type, featured,
  authors ( name, avatar ),
  article_categories ( categories ( name, slug, color ) ),
  ${CARD_TRANSLATIONS}
`

// Inner-join variant: only articles that HAVE the requested category, so the
// filter restricts the parent rows (and the exact count) at the database.
const ARTICLE_CARD_SELECT_FILTERED = `
  id, title, slug, excerpt, featured_image,
  published_at, reading_time, article_type, featured,
  authors ( name, avatar ),
  article_categories!inner ( categories!inner ( name, slug, color ) ),
  ${CARD_TRANSLATIONS}
`

const ARTICLE_FULL_SELECT = `
  id, title, slug, excerpt, content, featured_image,
  published_at, updated_at, reading_time, views, article_type, featured,
  authors ( id, slug, name, bio, avatar, social_links, featured ),
  article_categories ( categories ( name, slug, color ) ),
  article_tags ( tags ( name, slug ) ),
  seo_metadata ( meta_title, meta_description, og_image, keywords, canonical_url ),
  ${FULL_TRANSLATIONS}
`

export async function getArticles({
  page = 1, perPage = 12, category, authorId, lang = DEFAULT_LANGUAGE,
}: {
  page?: number; perPage?: number; category?: ArticleCategory
  authorId?: string; lang?: LanguageCode
} = {}) {
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
    articles:   normalizeCards(data || [], lang),
    total:      count || 0,
    totalPages: Math.ceil((count || 0) / perPage),
  }
}

export async function getFeaturedArticles(limit = 7, lang: LanguageCode = DEFAULT_LANGUAGE) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [], lang)
}

// Wrapped in React cache() so the page's generateMetadata and its body — which
// both call this in the same render — share a single DB read and a single view
// increment, instead of doubling them.
export const getArticleBySlug = cache(async (
  slug: string,
  lang: LanguageCode = DEFAULT_LANGUAGE,
): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_FULL_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  // Increment view count (fire and forget) via a SECURITY DEFINER RPC, so the
  // public anon key never needs write access to the articles table. The id is
  // the SAME across languages, so the counter stays combined.
  supabase
    .rpc('increment_article_views', { article_id: data.id })
    .then(() => {}, () => {})

  return normalizeFullArticle(data, lang)
})

export async function getRelatedArticles(
  articleId: string, limit = 3, lang: LanguageCode = DEFAULT_LANGUAGE,
) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [], lang)
}

export async function getLatestArticles(limit = 5, lang: LanguageCode = DEFAULT_LANGUAGE) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return normalizeCards(data || [], lang)
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

// Slugs of published articles that HAVE a published translation in `lang`. Used
// to statically pre-render only the language pages that actually exist.
export async function getTranslatedArticleSlugs(lang: LanguageCode): Promise<string[]> {
  if (lang === DEFAULT_LANGUAGE) return getAllArticleSlugs()

  const { data, error } = await supabase
    .from('articles')
    .select('slug, article_translations!inner ( language_code )')
    .eq('status', 'published')
    .eq('article_translations.language_code', lang)

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

// ── Normalizers ───────────────────────────────────────────────

// Pick the translation row for `lang` from an embedded article_translations
// array (only ever holds published rows, thanks to RLS). Returns null for the
// default language or when no translation exists.
function pickTranslation(row: any, lang: LanguageCode) {
  if (lang === DEFAULT_LANGUAGE) return null
  const list = Array.isArray(row.article_translations) ? row.article_translations : []
  return list.find((t: any) => t.language_code === lang) || null
}

// Every language this article can be read in: 'en' plus each published
// translation present on the row.
function availableLanguagesOf(row: any): LanguageCode[] {
  const list: any[] = Array.isArray(row.article_translations) ? row.article_translations : []
  const codes: LanguageCode[] = list
    .map((t: any) => t.language_code)
    .filter((c: any): c is LanguageCode => isLanguageCode(c) && c !== DEFAULT_LANGUAGE)
  return [DEFAULT_LANGUAGE, ...Array.from(new Set(codes))]
}

function normalizeCards(rows: any[], lang: LanguageCode): ArticleCard[] {
  return rows.map(row => {
    const t = pickTranslation(row, lang)
    return {
      id:            row.id,
      title:         (t?.title   || row.title),
      slug:          row.slug,
      excerpt:       (t?.excerpt ?? row.excerpt) || '',
      featuredImage: row.featured_image || null,
      author:        row.authors ? { name: row.authors.name, avatar: row.authors.avatar } : null,
      publishedAt:   row.published_at || null,
      readingTime:   row.reading_time || 5,
      articleType:   row.article_type,
      categories:    (row.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
      featured:      row.featured || false,
    }
  })
}

function normalizeFullArticle(row: any, lang: LanguageCode): Article {
  const t        = pickTranslation(row, lang)
  const served: LanguageCode = t ? lang : DEFAULT_LANGUAGE

  return {
    id:            row.id,
    title:         (t?.title   || row.title),
    slug:          row.slug,
    excerpt:       (t?.excerpt ?? row.excerpt) || '',
    content:       (t?.content || row.content) || '',
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
    language:           served,
    availableLanguages: availableLanguagesOf(row),
  }
}
