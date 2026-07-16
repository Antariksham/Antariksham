import { supabase } from '@/lib/supabase'
import type { KnowledgeArticle, KnowledgeArticleCard } from '@/types/knowledge'

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

// ── All articles (card shape) ─────────────────────────────────
export async function getKnowledgeArticles(): Promise<KnowledgeArticleCard[]> {
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

  return (data || []).map(normalizeCard)
}

// ── Single article by slug ────────────────────────────────────
export async function getKnowledgeArticleBySlug(
  slug: string
): Promise<KnowledgeArticle | null> {
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

  return normalizeFull(data)
}

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

function normalizeFull(row: any): KnowledgeArticle {
  return {
    id:              row.id,
    title:           row.title,
    slug:            row.slug,
    content:         row.content || '',
    excerpt:         row.excerpt || '',
    difficultyLevel: row.difficulty_level || 'Beginner',
    relatedTopics:   row.related_topics || [],
    icon:            row.icon || '🔭',
    featured:        row.featured || false,
    thumbnail:       row.thumbnail ?? null,
    seoId:           row.seo_id || null,
    createdAt:       row.created_at || '',
    updatedAt:       row.updated_at || '',
  }
}

// Detects "column knowledge_articles.thumbnail does not exist" so the public
// pages keep working before the thumbnail migration has been applied.
function isMissingThumbnailColumn(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return msg.includes('thumbnail') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}
