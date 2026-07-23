import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type { KnowledgeArticle, KnowledgeArticleCard } from '@/types/knowledge'
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@/lib/i18n'

interface KnowledgeTranslation { language_code: string; title: string; excerpt: string | null; content: string | null }

// Published translations for a knowledge article (all languages). Tolerant: if
// the knowledge_translations table doesn't exist yet or the query fails, returns
// [] so the English content still renders.
async function fetchKnowledgeTranslations(articleId: string): Promise<KnowledgeTranslation[]> {
  const { data, error } = await supabase
    .from('knowledge_translations')
    .select('language_code, title, excerpt, content')
    .eq('knowledge_article_id', articleId)
    .eq('is_published', true)
  if (error || !data) return []
  return data as KnowledgeTranslation[]
}

const CARD_SELECT = `
  id, title, slug, excerpt, difficulty_level, related_topics, icon, featured, thumbnail
`

// Fallback for databases where the `thumbnail` column hasn't been added yet.
const CARD_SELECT_NO_THUMB = `
  id, title, slug, excerpt, difficulty_level, related_topics, icon, featured
`

const FULL_SELECT = `
  id, title, slug, content, excerpt, difficulty_level, related_topics, icon,
  featured, thumbnail, seo_id, created_at, updated_at
`

const FULL_SELECT_NO_THUMB = `
  id, title, slug, content, excerpt, difficulty_level, related_topics, icon,
  featured, seo_id, created_at, updated_at
`

// Tolerant card-title/excerpt overlay for a language (empty on any failure).
async function fetchKnowledgeCardTranslations(
  ids: string[], lang: LanguageCode,
): Promise<Map<string, { title: string; excerpt: string | null }>> {
  const map = new Map<string, { title: string; excerpt: string | null }>()
  if (lang === DEFAULT_LANGUAGE || ids.length === 0) return map
  const { data, error } = await supabase
    .from('knowledge_translations')
    .select('knowledge_article_id, title, excerpt')
    .in('knowledge_article_id', ids)
    .eq('language_code', lang)
    .eq('is_published', true)
  if (error || !data) return map
  for (const r of data as any[]) map.set(r.knowledge_article_id, { title: r.title, excerpt: r.excerpt })
  return map
}

// ── All articles (card shape) ─────────────────────────────────
export async function getKnowledgeArticles(lang: LanguageCode = DEFAULT_LANGUAGE): Promise<KnowledgeArticleCard[]> {
  let { data, error }: { data: any[] | null; error: any } = await supabase
    .from('knowledge_articles')
    .select(CARD_SELECT)
    .order('created_at', { ascending: false })

  // Retry without `thumbnail` if the column hasn't been migrated yet.
  if (error && isMissingThumbnailColumn(error)) {
    ({ data, error } = await supabase
      .from('knowledge_articles')
      .select(CARD_SELECT_NO_THUMB)
      .order('created_at', { ascending: false }))
  }

  if (error) {
    console.error('getKnowledgeArticles error:', error)
    return []
  }

  const cards = (data || []).map(normalizeCard)
  if (lang === DEFAULT_LANGUAGE) return cards

  const overlay = await fetchKnowledgeCardTranslations(cards.map(c => c.id), lang)
  return cards.map(c => {
    const t = overlay.get(c.id)
    return t ? { ...c, title: t.title || c.title, excerpt: (t.excerpt ?? c.excerpt) || '' } : c
  })
}

// ── Single article by slug ────────────────────────────────────
// Wrapped in cache() so the page's generateMetadata + body share one read.
export const getKnowledgeArticleBySlug = cache(async (
  slug: string,
  lang: LanguageCode = DEFAULT_LANGUAGE,
): Promise<KnowledgeArticle | null> => {
  let { data, error }: { data: any; error: any } = await supabase
    .from('knowledge_articles')
    .select(FULL_SELECT)
    .eq('slug', slug)
    .single()

  if (error && isMissingThumbnailColumn(error)) {
    ({ data, error } = await supabase
      .from('knowledge_articles')
      .select(FULL_SELECT_NO_THUMB)
      .eq('slug', slug)
      .single())
  }

  if (error || !data) return null

  const translations = await fetchKnowledgeTranslations(data.id)
  return normalizeFull(data, lang, translations)
})

// ── All slugs (for generateStaticParams) ─────────────────────
export async function getAllKnowledgeSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('slug')

  if (error) return []
  return (data || []).map((r: any) => r.slug)
}

// ── Normalizers ───────────────────────────────────────────────
function normalizeCard(row: any): KnowledgeArticleCard {
  return {
    id:              row.id,
    title:           row.title,
    slug:            row.slug,
    excerpt:         row.excerpt || '',
    difficultyLevel: row.difficulty_level || 'Beginner',
    relatedTopics:   row.related_topics || [],
    icon:            row.icon || '🔭',
    featured:        row.featured || false,
    thumbnail:       row.thumbnail ?? null,
  }
}

function normalizeFull(row: any, lang: LanguageCode = DEFAULT_LANGUAGE, translations: KnowledgeTranslation[] = []): KnowledgeArticle {
  const t = lang !== DEFAULT_LANGUAGE ? translations.find(x => x.language_code === lang) || null : null
  const served: LanguageCode = t ? lang : DEFAULT_LANGUAGE
  const otherLangs = translations
    .map(x => x.language_code)
    .filter((c): c is LanguageCode => isLanguageCode(c) && c !== DEFAULT_LANGUAGE)

  return {
    id:              row.id,
    title:           t?.title || row.title,
    slug:            row.slug,
    content:         (t?.content || row.content) || '',
    excerpt:         (t?.excerpt ?? row.excerpt) || '',
    difficultyLevel: row.difficulty_level || 'Beginner',
    relatedTopics:   row.related_topics || [],
    icon:            row.icon || '🔭',
    featured:        row.featured || false,
    thumbnail:       row.thumbnail ?? null,
    seoId:           row.seo_id || null,
    createdAt:       row.created_at || '',
    updatedAt:       row.updated_at || '',
    language:            served,
    availableLanguages: [DEFAULT_LANGUAGE, ...Array.from(new Set(otherLangs))],
  }
}

// Detects "column knowledge_articles.thumbnail does not exist" so the public
// pages keep working before the thumbnail migration has been applied.
function isMissingThumbnailColumn(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return msg.includes('thumbnail') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}
