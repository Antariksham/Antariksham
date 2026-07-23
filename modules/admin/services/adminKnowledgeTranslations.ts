import { supabaseAdmin } from '@/lib/supabase'
import type { LanguageCode } from '@/lib/i18n'

// Admin CRUD for Learn-article translations (service-role, bypasses RLS).

export interface KnowledgeTranslation {
  languageCode: LanguageCode
  title:        string
  excerpt:      string
  content:      string
  isPublished:  boolean
}

export interface KnowledgeTranslationPayload {
  title:       string
  excerpt:     string
  content:     string
  isPublished: boolean
}

export async function getKnowledgeTranslation(
  articleId: string, lang: LanguageCode,
): Promise<KnowledgeTranslation | null> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('knowledge_translations')
    .select('language_code, title, excerpt, content, is_published')
    .eq('knowledge_article_id', articleId)
    .eq('language_code', lang)
    .maybeSingle()

  if (error) { console.error('getKnowledgeTranslation error:', error); return null }
  if (!data)  return null

  return {
    languageCode: data.language_code,
    title:        data.title   || '',
    excerpt:      data.excerpt || '',
    content:      data.content || '',
    isPublished:  data.is_published || false,
  }
}

export async function upsertKnowledgeTranslation(
  articleId: string, lang: LanguageCode, payload: KnowledgeTranslationPayload,
): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('knowledge_translations')
    .upsert(
      {
        knowledge_article_id: articleId,
        language_code:        lang,
        title:                payload.title,
        excerpt:              payload.excerpt || null,
        content:              payload.content || null,
        is_published:         payload.isPublished,
        updated_at:           new Date().toISOString(),
      },
      { onConflict: 'knowledge_article_id,language_code' },
    )
  if (error) { console.error('upsertKnowledgeTranslation error:', error); return false }
  return true
}

export async function deleteKnowledgeTranslation(articleId: string, lang: LanguageCode): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('knowledge_translations')
    .delete()
    .eq('knowledge_article_id', articleId)
    .eq('language_code', lang)
  if (error) { console.error('deleteKnowledgeTranslation error:', error); return false }
  return true
}
