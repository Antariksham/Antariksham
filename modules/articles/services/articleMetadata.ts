import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import { siteConfig } from '@/config/site'
import type { Article } from '@/types/article'

// Build the <head> metadata for an article in a given language: title/description
// + OG, plus hreflang/canonical alternates. When the requested language falls
// back to English (no published translation), the page is canonical → EN and
// noindex so Google never indexes a duplicate-content language page.
export function buildArticleMetadata(article: Article, lang: LanguageCode): Metadata {
  const { isFallback, canonical, languages } = localizedAlternates(
    'articles', article.slug, article.availableLanguages, article.language, lang,
  )

  return {
    title:       article.title,
    description: article.excerpt,
    alternates:  { canonical, languages },
    ...(isFallback ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title:         article.title,
      description:   article.excerpt,
      images:        article.featuredImage ? [article.featuredImage] : [],
      type:          'article',
      locale:        lang === 'hi' ? 'hi_IN' : 'en_US',
      publishedTime: article.publishedAt || undefined,
    },
  }
}

// Article/NewsArticle JSON-LD for the reading page. Additive SEO (structured
// data was previously absent). JSON.stringify drops the `undefined` fields.
export function buildArticleJsonLd(article: Article): Record<string, unknown> {
  const isNews = article.articleType === 'breaking-news' || article.articleType === 'mission-update'
  const url = `${siteConfig.url}/articles/${article.slug}`
  return {
    '@context': 'https://schema.org',
    '@type':    isNews ? 'NewsArticle' : 'Article',
    headline:   article.title,
    description: article.excerpt || undefined,
    image:      article.featuredImage ? [article.featuredImage] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified:  article.updatedAt || article.publishedAt || undefined,
    author: {
      '@type': article.author?.name ? 'Person' : 'Organization',
      name:    article.author?.name || siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name:    siteConfig.name,
      logo:    { '@type': 'ImageObject', url: `${siteConfig.url}${siteConfig.seo.defaultImage}` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}
