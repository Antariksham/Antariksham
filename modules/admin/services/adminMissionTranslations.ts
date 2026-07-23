import { supabaseAdmin } from '@/lib/supabase'
import type { LanguageCode } from '@/lib/i18n'

// Admin CRUD for mission translations (service-role, bypasses RLS).

export interface MissionTranslation {
  languageCode: LanguageCode
  name:         string
  description:  string
  isPublished:  boolean
}

export interface MissionTranslationPayload {
  name:        string
  description: string
  isPublished: boolean
}

export async function getMissionTranslation(
  missionId: string, lang: LanguageCode,
): Promise<MissionTranslation | null> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('mission_translations')
    .select('language_code, name, description, is_published')
    .eq('mission_id', missionId)
    .eq('language_code', lang)
    .maybeSingle()

  if (error) { console.error('getMissionTranslation error:', error); return null }
  if (!data)  return null

  return {
    languageCode: data.language_code,
    name:         data.name        || '',
    description:  data.description || '',
    isPublished:  data.is_published || false,
  }
}

export async function upsertMissionTranslation(
  missionId: string, lang: LanguageCode, payload: MissionTranslationPayload,
): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('mission_translations')
    .upsert(
      {
        mission_id:    missionId,
        language_code: lang,
        name:          payload.name,
        description:   payload.description || null,
        is_published:  payload.isPublished,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'mission_id,language_code' },
    )
  if (error) { console.error('upsertMissionTranslation error:', error); return false }
  return true
}

export async function deleteMissionTranslation(missionId: string, lang: LanguageCode): Promise<boolean> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('mission_translations')
    .delete()
    .eq('mission_id', missionId)
    .eq('language_code', lang)
  if (error) { console.error('deleteMissionTranslation error:', error); return false }
  return true
}
