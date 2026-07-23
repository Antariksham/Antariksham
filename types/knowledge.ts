import type { LanguageCode } from '@/lib/i18n'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface KnowledgeArticle {
  id:              string
  title:           string
  slug:            string
  content:         string
  excerpt:         string
  difficultyLevel: DifficultyLevel
  relatedTopics:   string[]
  icon:            string
  featured:        boolean
  thumbnail:       string | null
  seoId:           string | null
  createdAt:       string
  updatedAt:       string
  // i18n — language actually served (falls back to 'en') + every language it
  // can be read in.
  language:           LanguageCode
  availableLanguages: LanguageCode[]
}

export interface KnowledgeArticleCard {
  id:              string
  title:           string
  slug:            string
  excerpt:         string
  difficultyLevel: DifficultyLevel
  relatedTopics:   string[]
  icon:            string
  featured:        boolean
  thumbnail?:      string | null
}
