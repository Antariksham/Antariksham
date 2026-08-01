import type { Metadata } from 'next'
import { localizedAlternates, type LanguageCode } from '@/lib/i18n'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { ogCardPath } from '@/modules/seo/socialMeta'
import type { KnowledgeArticle } from '@/types/knowledge'

const LEVEL_LABEL: Record<KnowledgeArticle['difficultyLevel'], string> = {
  beginner:     'Learn / Beginner',
  intermediate: 'Learn / Intermediate',
  advanced:     'Learn / Advanced',
}

// hreflang/canonical-aware metadata for a Learn article. A language URL serving
// English fallback is canonical → EN + noindex.
export function buildKnowledgeMetadata(article: KnowledgeArticle, lang: LanguageCode): Metadata {
  const { isFallback, canonical, languages } = localizedAlternates(
    'learn', article.slug, article.availableLanguages, article.language, lang,
  )

  return buildPageMetadata({
    path:        canonical,
    canonical,
    languages,
    noindex:     isFallback,
    // Bare title: the root layout's titleTemplate appends "| Antariksham" and
    // og:site_name carries the brand, so the old `${title} — ${siteConfig.name}`
    // rendered as "… — Antariksham | Antariksham" in the tab.
    title:       article.title,
    description: article.excerpt,
    // Learn pages had no openGraph at all, so every share showed the site
    // title and pointed at the homepage.
    image:       article.thumbnail,
    imageAlt:    article.title,
    fallbackImagePath: ogCardPath({
      title:   article.title,
      eyebrow: LEVEL_LABEL[article.difficultyLevel],
    }),
    type:         'article',
    locale:       lang === 'hi' ? 'hi_IN' : 'en_US',
    modifiedTime: article.updatedAt,
  })
}
