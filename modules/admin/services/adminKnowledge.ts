import { supabaseAdmin } from '@/lib/supabase'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'
import type { DifficultyLevel } from '@/types/knowledge'

// ── Row shape for the admin list ──────────────────────────────

export interface AdminKnowledgeRow {
  id:              string
  title:           string
  slug:            string
  difficultyLevel: DifficultyLevel
  icon:            string
  featured:        boolean
  hasThumbnail:    boolean
  updatedAt:       string
}

export async function getAdminKnowledge(): Promise<AdminKnowledgeRow[]> {
  const db = supabaseAdmin()

  // Try to read `thumbnail`; if the column isn't there yet, read without it.
  let { data, error }: { data: any[] | null; error: any } = await db
    .from('knowledge_articles')
    .select('id, title, slug, difficulty_level, icon, featured, thumbnail, updated_at')
    .order('updated_at', { ascending: false })

  if (error && isMissingThumbnailColumn(error)) {
    ({ data, error } = await db
      .from('knowledge_articles')
      .select('id, title, slug, difficulty_level, icon, featured, updated_at')
      .order('updated_at', { ascending: false }))
  }

  if (error) {
    console.error('getAdminKnowledge error:', error)
    return []
  }

  return (data || []).map((r: any) => ({
    id:              r.id,
    title:           r.title,
    slug:            r.slug,
    difficultyLevel: r.difficulty_level || 'beginner',
    icon:            r.icon || '🔭',
    featured:        r.featured || false,
    hasThumbnail:    Boolean(r.thumbnail),
    updatedAt:       r.updated_at || '',
  }))
}

// ── Single article for editing ────────────────────────────────

export interface AdminKnowledgeFull {
  id:              string
  title:           string
  slug:            string
  excerpt:         string
  content:         string
  difficultyLevel: DifficultyLevel
  icon:            string
  thumbnail:       string
  relatedTopics:   string[]
  featured:        boolean
}

export async function getAdminKnowledgeById(id: string): Promise<AdminKnowledgeFull | null> {
  const db = supabaseAdmin()

  let { data, error }: { data: any; error: any } = await db
    .from('knowledge_articles')
    .select('id, title, slug, excerpt, content, difficulty_level, icon, thumbnail, related_topics, featured')
    .eq('id', id)
    .single()

  if (error && isMissingThumbnailColumn(error)) {
    ({ data, error } = await db
      .from('knowledge_articles')
      .select('id, title, slug, excerpt, content, difficulty_level, icon, related_topics, featured')
      .eq('id', id)
      .single())
  }

  if (error || !data) return null

  return {
    id:              data.id,
    title:           data.title,
    slug:            data.slug,
    excerpt:         data.excerpt || '',
    content:         data.content || '',
    difficultyLevel: data.difficulty_level || 'beginner',
    icon:            data.icon || '🔭',
    thumbnail:       (data as any).thumbnail || '',
    relatedTopics:   data.related_topics || [],
    featured:        data.featured || false,
  }
}

// ── Payload ───────────────────────────────────────────────────

export interface KnowledgePayload {
  title:           string
  slug:            string
  excerpt:         string
  content:         string
  difficultyLevel: DifficultyLevel
  icon:            string
  thumbnail:       string | null
  relatedTopics:   string[]
  featured:        boolean
}

function toRecord(p: KnowledgePayload) {
  return {
    title:            p.title,
    slug:             p.slug,
    excerpt:          p.excerpt,
    content:          p.content,
    difficulty_level: p.difficultyLevel,
    icon:             p.icon || '🔭',
    thumbnail:        p.thumbnail || null,
    related_topics:   p.relatedTopics,
    featured:         p.featured,
  }
}

// ── Create ────────────────────────────────────────────────────

export async function createAdminKnowledge(payload: KnowledgePayload): Promise<{ id: string } | null> {
  const db     = supabaseAdmin()
  const record = toRecord(payload)

  await assertSlugAvailable(db, 'knowledge_articles', payload.slug)

  let { data, error } = await db.from('knowledge_articles').insert(record).select('id').single()

  // Retry without thumbnail if the column hasn't been added yet
  if (error && isMissingThumbnailColumn(error)) {
    const { thumbnail, ...rest } = record
    ;({ data, error } = await db.from('knowledge_articles').insert(rest).select('id').single())
  }

  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminKnowledge error:', error)
    return null
  }
  return { id: data.id }
}

// ── Update ────────────────────────────────────────────────────

export async function updateAdminKnowledge(id: string, payload: KnowledgePayload): Promise<boolean> {
  const db     = supabaseAdmin()
  const record = toRecord(payload)

  await assertSlugAvailable(db, 'knowledge_articles', payload.slug, id)

  let { error } = await db.from('knowledge_articles').update(record).eq('id', id)

  if (error && isMissingThumbnailColumn(error)) {
    const { thumbnail, ...rest } = record
    ;({ error } = await db.from('knowledge_articles').update(rest).eq('id', id))
  }

  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminKnowledge error:', error)
    return false
  }
  return true
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteAdminKnowledge(id: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db.from('knowledge_articles').delete().eq('id', id)
  if (error) {
    console.error('deleteAdminKnowledge error:', error)
    return false
  }
  return true
}

// ── Helper ────────────────────────────────────────────────────
// Detects "column knowledge_articles.thumbnail does not exist" so the editor
// keeps working before the thumbnail migration has been applied.
function isMissingThumbnailColumn(error: any): boolean {
  const msg = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return msg.includes('thumbnail') && (msg.includes('does not exist') || msg.includes('column') || error?.code === '42703')
}
