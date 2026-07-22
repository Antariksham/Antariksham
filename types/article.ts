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
