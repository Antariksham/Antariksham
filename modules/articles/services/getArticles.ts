import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type { Article, ArticleCard, ArticleCategory, FeaturedImageMeta } from '@/types/article'

// Detects "column articles.featured_image_meta does not exist" so the public
// reader keeps working before the featured-image-meta migration is applied.
function isMissingFeaturedMetaColumn(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('featured_image_meta') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}
import {
  DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode,
} from '@/lib/i18n'

// NOTE: translations are fetched SEPARATELY (see fetch* helpers below), never
// embedded in these selects. That keeps the core article read independent of
// the article_translations table — English content always loads even if that
// table doesn't exist yet (migration not applied), and a failed translation
// lookup degrades gracefully to English instead of breaking the page.
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

const ARTICLE_FULL_SELECT_BASE = `
  id, title, slug, excerpt, content, featured_image,
  published_at, updated_at, reading_time, views, article_type, featured,
  authors ( id, slug, name, bio, avatar, social_links, featured ),
  article_categories ( categories ( name, slug, color ) ),
  article_tags ( tags ( name, slug ) ),
  seo_metadata ( meta_title, meta_description, og_image, keywords, canonical_url )
`
const ARTICLE_FULL_SELECT = `${ARTICLE_FULL_SELECT_BASE}, featured_image_meta`

// ── Translation lookups (tolerant) ────────────────────────────
// Any failure here — table missing, RLS, network — resolves to "no
// translation" so the base English content is served unchanged.

interface CardTranslation { title: string; excerpt: string | null }
interface FullTranslation { language_code: string; title: string; excerpt: string | null; content: string | null }

// Card overlay (title/excerpt) for a page of articles, for one language.
async function fetchCardTranslations(
  ids: string[], lang: LanguageCode,
): Promise<Map<string, CardTranslation>> {
  const map = new Map<string, CardTranslation>()
  if (lang === DEFAULT_LANGUAGE || ids.length === 0) return map

  const { data, error } = await supabase
    .from('article_translations')
    .select('article_id, title, excerpt')
    .in('article_id', ids)
    .eq('language_code', lang)
    .eq('is_published', true)

  if (error || !data) return map
  for (const r of data as any[]) map.set(r.article_id, { title: r.title, excerpt: r.excerpt })
  return map
}

// ALL published translations for a single article (every language), so the
// detail page can both overlay the requested language AND know which languages
// to offer in the toggle.
async function fetchArticleTranslations(articleId: string): Promise<FullTranslation[]> {
  const { data, error } = await supabase
    .from('article_translations')
    .select('language_code, title, excerpt, content')
    .eq('article_id', articleId)
    .eq('is_published', true)

  if (error || !data) return []
  return data as FullTranslation[]
}

// ── Cards ─────────────────────────────────────────────────────

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
    articles:   await toCards(data || [], lang),
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
  return toCards(data || [], lang)
}

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
  return toCards(data || [], lang)
}

export async function getLatestArticles(limit = 5, lang: LanguageCode = DEFAULT_LANGUAGE) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return toCards(data || [], lang)
}

// ── Single article ────────────────────────────────────────────

// Wrapped in React cache() so the page's generateMetadata and its body — which
// both call this in the same render — share a single DB read and a single view
// increment, instead of doubling them.
export const getArticleBySlug = cache(async (
  slug: string,
  lang: LanguageCode = DEFAULT_LANGUAGE,
): Promise<Article | null> => {
  let { data, error }: { data: any; error: any } = await supabase
    .from('articles')
    .select(ARTICLE_FULL_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  // Retry without the meta column if the migration hasn't been applied yet.
  if (error && isMissingFeaturedMetaColumn(error)) {
    ({ data, error } = await supabase
      .from('articles')
      .select(ARTICLE_FULL_SELECT_BASE)
      .eq('slug', slug)
      .eq('status', 'published')
      .single())
  }

  if (error || !data) return null

  // Increment view count (fire and forget) via a SECURITY DEFINER RPC, so the
  // public anon key never needs write access to the articles table. The id is
  // the SAME across languages, so the counter stays combined.
  supabase
    .rpc('increment_article_views', { article_id: data.id })
    .then(() => {}, () => {})

  const translations = await fetchArticleTranslations(data.id)
  return normalizeFullArticle(data, lang, translations)
})

// ── Slug lists ────────────────────────────────────────────────

export async function getAllArticleSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

// Slugs of published articles that HAVE a published translation in `lang`. Used
// to statically pre-render only the language pages that actually exist. Tolerant:
// returns [] if the translations table isn't there yet.
export async function getTranslatedArticleSlugs(lang: LanguageCode): Promise<string[]> {
  if (lang === DEFAULT_LANGUAGE) return getAllArticleSlugs()

  const { data, error } = await supabase
    .from('article_translations')
    .select('is_published, articles!inner ( slug, status )')
    .eq('language_code', lang)
    .eq('is_published', true)

  if (error || !data) return []
  return (data as any[])
    .filter(r => r.articles?.status === 'published')
    .map(r => r.articles.slug)
}

// ── Normalizers ───────────────────────────────────────────────

async function toCards(rows: any[], lang: LanguageCode): Promise<ArticleCard[]> {
  const overlay = await fetchCardTranslations(rows.map(r => r.id), lang)
  return rows.map(row => {
    const t = overlay.get(row.id)
    return {
      id:            row.id,
      title:         t?.title || row.title,
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

function normalizeFullArticle(row: any, lang: LanguageCode, translations: FullTranslation[]): Article {
  const t = lang !== DEFAULT_LANGUAGE
    ? translations.find(x => x.language_code === lang) || null
    : null
  const served: LanguageCode = t ? lang : DEFAULT_LANGUAGE

  const otherLangs = translations
    .map(x => x.language_code)
    .filter((c): c is LanguageCode => isLanguageCode(c) && c !== DEFAULT_LANGUAGE)
  const availableLanguages: LanguageCode[] = [DEFAULT_LANGUAGE, ...Array.from(new Set(otherLangs))]

  return {
    id:            row.id,
    title:         t?.title || row.title,
    slug:          row.slug,
    excerpt:       (t?.excerpt ?? row.excerpt) || '',
    content:       (t?.content || row.content) || '',
    featuredImage: row.featured_image || null,
    featuredImageMeta: (row.featured_image_meta as FeaturedImageMeta) || null,
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
    availableLanguages,
  }
}
