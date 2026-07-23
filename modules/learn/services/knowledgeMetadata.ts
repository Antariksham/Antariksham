import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import { siteConfig } from '@/config/site'
import type { KnowledgeArticle } from '@/types/knowledge'

// hreflang/canonical-aware metadata for a Learn article. A language URL serving
// English fallback is canonical → EN + noindex.
export function buildKnowledgeMetadata(article: KnowledgeArticle, lang: LanguageCode): Metadata {
  const { isFallback, canonical, languages } = localizedAlternates(
    'learn', article.slug, article.availableLanguages, article.language, lang,
  )
  return {
    title:       `${article.title} — ${siteConfig.name}`,
    description: article.excerpt,
    alternates:  { canonical, languages },
    ...(isFallback ? { robots: { index: false, follow: true } } : {}),
  }
}
