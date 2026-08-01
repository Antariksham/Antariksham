import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { ogCardPath } from '@/modules/seo/socialMeta'
import { siteConfig } from '@/config/site'
import type { Article } from '@/types/article'

// Human labels for the eyebrow on a generated share card. Only the types that
// read oddly in kebab-case need an entry; the rest are title-cased below.
const TYPE_LABEL: Partial<Record<Article['articleType'], string>> = {
  'breaking-news':       'Breaking',
  'mission-update':      'Mission Update',
  'research-breakdown':  'Research',
}

function typeLabel(article: Article): string {
  return TYPE_LABEL[article.articleType]
    ?? article.articleType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Build the <head> metadata for an article in a given language: title/description
// + OG, plus hreflang/canonical alternates. When the requested language falls
// back to English (no published translation), the page is canonical → EN and
// noindex so Google never indexes a duplicate-content language page.
export function buildArticleMetadata(article: Article, lang: LanguageCode): Metadata {
  const { isFallback, canonical, languages } = localizedAlternates(
    'articles', article.slug, article.availableLanguages, article.language, lang,
  )

  return buildPageMetadata({
    path:        canonical,
    canonical,
    languages,
    noindex:     isFallback,
    title:       article.title,
    description: article.excerpt,
    // The featured image is the card whenever there is one — a hero photo beats
    // any generated layout, which is why NASA and every wire service use it.
    // Without one the article used to ship `images: []`, i.e. no card at all;
    // it now falls back to a generated card carrying the headline.
    image:       article.featuredImage,
    imageAlt:    article.featuredImageMeta?.alt || article.title,
    fallbackImagePath: ogCardPath({
      title:   article.title,
      eyebrow: typeLabel(article),
      footer:  article.author?.name || siteConfig.domain,
    }),
    type:          'article',
    locale:        lang === 'hi' ? 'hi_IN' : 'en_US',
    publishedTime: article.publishedAt,
    modifiedTime:  article.updatedAt,
    authors:       article.author?.name ? [article.author.name] : undefined,
    section:       article.categories[0],
    tags:          article.tags,
  })
}

// Article/NewsArticle JSON-LD for the reading page. Additive SEO (structured
// data was previously absent). JSON.stringify drops the `undefined` fields.
export function buildArticleJsonLd(article: Article): Record<string, unknown> {
  const isNews = article.articleType === 'breaking-news' || article.articleType === 'mission-update'
  const url = `${siteConfig.url}/article/${article.slug}`
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
      logo:    { '@type': 'ImageObject', url: `${siteConfig.url}${siteConfig.seo.logo}` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}
