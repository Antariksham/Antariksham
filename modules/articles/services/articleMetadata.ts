import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
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
