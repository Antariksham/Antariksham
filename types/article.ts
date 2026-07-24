import type { LanguageCode } from '@/lib/i18n'

export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export type ArticleType =
  | 'breaking-news'
  | 'analysis'
  | 'editorial'
  | 'mission-update'
  | 'research-breakdown'
  | 'explainer'
  | 'guide'

export type ArticleCategory =
  | 'NASA'
  | 'SpaceX'
  | 'ISRO'
  | 'ESA'
  | 'JAXA'
  | 'Astronomy'
  | 'Discoveries'
  | 'Technology'
  | 'Missions'
  | 'Science'

// Newsroom-grade metadata for the featured image. Stored in the additive
// `articles.featured_image_meta` JSONB column (all fields optional; the whole
// object is null on articles that predate the column).
export interface FeaturedImageMeta {
  alt?:          string
  caption?:      string
  credit?:       string
  photographer?: string
  organization?: string
  sourceUrl?:    string
  license?:      string
  copyright?:    string
  focalX?:       number   // 0–100, horizontal focal point for object-position
  focalY?:       number   // 0–100, vertical focal point
}

export interface Author {
  id:          string
  slug:        string
  name:        string
  bio:         string | null
  avatar:      string | null
  socialLinks: Record<string, string> | null
  featured:    boolean
}

export interface Article {
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  content:       string
  featuredImage: string | null
  featuredImageMeta: FeaturedImageMeta | null
  author:        Author | null
  authorId:      string
  status:        ArticleStatus
  articleType:   ArticleType
  publishedAt:   string | null
  updatedAt:     string
  featured:      boolean
  readingTime:   number
  views:         number
  categories:    ArticleCategory[]
  tags:          string[]
  // i18n — the language actually served (falls back to 'en' when no published
  // translation exists) and every language this article is readable in.
  language:           LanguageCode
  availableLanguages: LanguageCode[]
}

export interface ArticleCard {
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  featuredImage: string | null
  author:        Pick<Author, 'name' | 'avatar'> | null
  publishedAt:   string | null
  readingTime:   number
  articleType:   ArticleType
  categories:    ArticleCategory[]
  featured:      boolean
}
