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
  seoId:           string | null
  createdAt:       string
  updatedAt:       string
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
