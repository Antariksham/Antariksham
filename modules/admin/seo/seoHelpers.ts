import { siteConfig } from '@/config/site'

/** Plain text from trusted HTML. */
export function textFromHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

/** The canonical public URL for an article slug. */
export function canonicalFor(slug: string): string {
  return `${siteConfig.url}/articles/${slug || ''}`
}

/** Apply the site title template, keeping the whole thing within ~60 chars. */
export function suggestSeoTitle(title: string): string {
  const t = title.trim()
  if (!t) return ''
  const templated = siteConfig.seo.titleTemplate.replace('%s', t)
  return templated.length <= 60 ? templated : t.slice(0, 60)
}

/** Generate a 120–160 char meta description from the excerpt, then the body. */
export function generateMetaDescription(excerpt: string, content: string): string {
  const source = excerpt.trim() || textFromHtml(content)
  if (!source) return ''
  if (source.length <= 158) return source
  const cut = source.slice(0, 157)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 110 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

export interface JsonLdInput {
  title:         string
  excerpt:       string
  slug:          string
  featuredImage: string | null
  authorName?:   string | null
  publishedAt?:  string | null
  updatedAt?:    string | null
  articleType?:  string
}

/** Build the Article/NewsArticle JSON-LD that should ship in <head>. */
export function buildArticleJsonLd(input: JsonLdInput): Record<string, unknown> {
  const isNews = input.articleType === 'breaking-news' || input.articleType === 'mission-update'
  const url = canonicalFor(input.slug)
  return {
    '@context': 'https://schema.org',
    '@type':    isNews ? 'NewsArticle' : 'Article',
    headline:   input.title || 'Untitled',
    description: input.excerpt || undefined,
    image:      input.featuredImage ? [input.featuredImage] : undefined,
    datePublished: input.publishedAt || undefined,
    dateModified:  input.updatedAt || input.publishedAt || undefined,
    author: {
      '@type': input.authorName ? 'Person' : 'Organization',
      name:    input.authorName || siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name:    siteConfig.name,
      logo:    { '@type': 'ImageObject', url: `${siteConfig.url}${siteConfig.seo.defaultImage}` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

/** Prune undefined so the emitted JSON-LD stays clean. */
export function cleanJsonLd(obj: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj, (_k, v) => (v === undefined ? undefined : v)))
}
