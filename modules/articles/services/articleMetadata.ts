import type { Metadata } from 'next'
import { articleHref, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import type { Article } from '@/types/article'

// Build the <head> metadata for an article in a given language.
//
// SEO rules baked in:
//   • hreflang alternates for every language the article actually exists in,
//     plus x-default → the English URL, so Google serves the right language.
//   • Canonical points at the current language's URL…
//   • …UNLESS this is a fallback render (a /hi URL for an article with no Hindi
//     translation yet, so English is shown): then canonical points to the
//     English URL and the page is set noindex, so Google never indexes a
//     duplicate-content language page.
export function buildArticleMetadata(article: Article, lang: LanguageCode): Metadata {
  const isFallback = article.language !== lang

  const languages: Record<string, string> = {}
  for (const code of article.availableLanguages) {
    languages[code] = articleHref(article.slug, code)
  }
  languages['x-default'] = articleHref(article.slug, DEFAULT_LANGUAGE)

  const canonical = isFallback
    ? articleHref(article.slug, DEFAULT_LANGUAGE)
    : articleHref(article.slug, lang)

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
