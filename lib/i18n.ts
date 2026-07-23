// Language configuration for bilingual (and beyond) article content.
//
// English is the default and lives in `public.articles`. Every other language
// is a translation stored in `public.article_translations`, keyed to the same
// article (same slug, same shared view counter). Add a language here + write
// its translations in the admin — no schema change required.
//
// URL model: English is unprefixed (`/articles/:slug`); every other language is
// path-prefixed by its code (`/hi/articles/:slug`). `pathPrefix` centralises
// that so links and routes stay consistent.

export type LanguageCode = 'en' | 'hi'

export interface Language {
  code:   LanguageCode
  /** English name, for aria-labels / hreflang. */
  label:  string
  /** Endonym — how the language names itself, for the visible toggle. */
  native: string
  /** URL segment: '' for the default language, '/<code>' otherwise. */
  pathPrefix: string
}

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export const LANGUAGES: Record<LanguageCode, Language> = {
  en: { code: 'en', label: 'English', native: 'English',  pathPrefix: ''    },
  hi: { code: 'hi', label: 'Hindi',   native: 'हिन्दी',    pathPrefix: '/hi' },
}

export const LANGUAGE_LIST: Language[] = Object.values(LANGUAGES)

/** Non-default languages — the ones stored in `article_translations`. */
export const TRANSLATION_LANGUAGES: Language[] =
  LANGUAGE_LIST.filter(l => l.code !== DEFAULT_LANGUAGE)

export function isLanguageCode(value: string): value is LanguageCode {
  return value === 'en' || value === 'hi'
}

export function getLanguage(code: string): Language {
  return isLanguageCode(code) ? LANGUAGES[code] : LANGUAGES[DEFAULT_LANGUAGE]
}

/** Path prefix for a language: '' for English, '/hi' for Hindi, etc. */
export function langPrefix(code: string): string {
  return getLanguage(code).pathPrefix
}

/** Build an article URL for a given language: `/articles/x` or `/hi/articles/x`. */
export function articleHref(slug: string, code: string): string {
  return `${langPrefix(code)}/articles/${slug}`
}

/** Build the articles listing URL for a given language. */
export function articlesListHref(code: string): string {
  return `${langPrefix(code)}/articles`
}
