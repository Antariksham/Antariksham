import { supabaseAdmin } from '@/lib/supabase'
import type { LanguageCode } from '@/lib/i18n'

// Admin CRUD for per-article translations. Uses the service-role client, which
// bypasses RLS — the public anon key can only ever READ published translations.

export interface ArticleTranslation {
  languageCode: LanguageCode
  title:        string
  excerpt:      string
  content:      string
  isPublished:  boolean
  updatedAt:    string | null
}

export interface TranslationSummary {
  languageCode: LanguageCode
  isPublished:  boolean
}

export interface TranslationPayload {
  title:       string
  excerpt:     string
  content:     string
  isPublished: boolean
}

// One language's translation for an article (or null if none written yet).
export async function getArticleTranslation(
  articleId: string, lang: LanguageCode,
): Promise<ArticleTranslation | null> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('article_translations')
    .select('language_code, title, excerpt, content, is_published, updated_at')
    .eq('article_id', articleId)
    .eq('language_code', lang)
    .maybeSingle()

  if (error) { console.error('getArticleTranslation error:', error); return null }
  if (!data)  return null

  return {
    languageCode: data.language_code,
    title:        data.title   || '',
    excerpt:      data.excerpt || '',
    content:      data.content || '',
    isPublished:  data.is_published || false,
    updatedAt:    data.updated_at   || null,
  }
}

// Which languages an article has been translated into (for the editor's tabs).
export async function listArticleTranslations(articleId: string): Promise<TranslationSummary[]> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('article_translations')
    .select('language_code, is_published')
    .eq('article_id', articleId)

  if (error) { console.error('listArticleTranslations error:', error); return [] }
  return (data || []).map((r: any) => ({
    languageCode: r.language_code,
    isPublished:  r.is_published || false,
  }))
}

// Create or update the translation for (article, language).
export async function upsertArticleTranslation(
  articleId: string, lang: LanguageCode, payload: TranslationPayload,
): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('article_translations')
    .upsert(
      {
        article_id:    articleId,
        language_code: lang,
        title:         payload.title,
        excerpt:       payload.excerpt || null,
        content:       payload.content || null,
        is_published:  payload.isPublished,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'article_id,language_code' },
    )

  if (error) { console.error('upsertArticleTranslation error:', error); return false }
  return true
}

export async function deleteArticleTranslation(articleId: string, lang: LanguageCode): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('article_translations')
    .delete()
    .eq('article_id', articleId)
    .eq('language_code', lang)

  if (error) { console.error('deleteArticleTranslation error:', error); return false }
  return true
}
