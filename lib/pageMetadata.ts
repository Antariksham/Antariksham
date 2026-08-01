// Metadata for a static page that exists in more than one language.
//
// Every localized route needs the same four things right — title, description,
// a self-referencing canonical, and a complete hreflang set — and getting any
// of them wrong is an SEO defect that is invisible in the browser. Building
// them from the path in one place means a new `/hi` twin cannot ship with the
// English canonical pasted in by mistake.
//
// The URLs here are ROOT-RELATIVE on purpose. Next resolves them against
// `metadataBase` (set once in app/layout.tsx from config/site.ts), so the
// domain stays in exactly one file — CLAUDE.md rule 9.
//
// Article, Learn and Mission detail pages do NOT use this: their alternates
// depend on which translations are actually published, which is a per-row
// question answered by `localizedAlternates` in lib/i18n.ts.

import type { Metadata } from 'next'
import {
  LANGUAGE_LIST, DEFAULT_LANGUAGE, swapLangPath, getLanguage, type LanguageCode,
} from '@/lib/i18n'

export interface LocalizedPageMeta {
  /** Path in ANY language — the language prefix is normalised away. */
  path:        string
  lang:        LanguageCode
  title:       string
  description: string
}

export function localizedMetadata(
  { path, lang, title, description }: LocalizedPageMeta,
): Metadata {
  const languages: Record<string, string> = {}
  for (const l of LANGUAGE_LIST) languages[l.code] = swapLangPath(path, l.code)
  // x-default points at the language served to a reader whose own language we
  // do not publish — always the site default.
  languages['x-default'] = swapLangPath(path, DEFAULT_LANGUAGE)

  const canonical = swapLangPath(path, lang)

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url:    canonical,
      locale: getLanguage(lang).ogLocale,
      // Tells crawlers the same page exists in the other languages, which is
      // what promotes a translation from "duplicate" to "alternate".
      alternateLocale: LANGUAGE_LIST
        .filter(l => l.code !== lang)
        .map(l => l.ogLocale),
    },
  }
}
