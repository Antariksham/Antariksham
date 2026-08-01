// Language configuration for bilingual (and beyond) article content.
//
// English is the default and lives in `public.articles`. Every other language
// is a translation stored in `public.article_translations`, keyed to the same
// article (same slug, same shared view counter). Add a language here + write
// its translations in the admin — no schema change required.
//
// URL model: English is unprefixed (`/article/:slug`); every other language is
// path-prefixed by its code (`/hi/article/:slug`). `pathPrefix` centralises
// that so links and routes stay consistent.
//
// Listing and detail use *different* segments: the plural browses (`/articles`),
// the singular reads one (`/article/:slug`) — the same split NASA and most
// publishers use. `DETAIL_SEGMENT` below is the only place that mapping lives.

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

/**
 * Detail-route segment for a section whose listing is named differently.
 *
 * A listing is plural because it holds many (`/articles`); a detail page is
 * singular because it is one (`/article/water-on-the-moon`). Sections absent
 * from this map use their own name for both — `learn` is a mass noun with no
 * singular to move to, and `authors` has no listing page at all.
 *
 * Everything downstream — links, canonicals, hreflang, JSON-LD, the sitemap —
 * routes through `sectionHref`, so this map is the single edit point if a
 * section is ever renamed again.
 */
const DETAIL_SEGMENT: Record<string, string> = {
  articles: 'article',
  missions: 'mission',
}

/** Detail-route segment for a section: `articles` → `article`, `learn` → `learn`. */
export function detailSegment(section: string): string {
  return DETAIL_SEGMENT[section] ?? section
}

/** Build a detail URL for any section: `/article/x`, `/hi/learn/x`, … */
export function sectionHref(section: string, slug: string, code: string): string {
  return `${langPrefix(code)}/${detailSegment(section)}/${slug}`
}

/** Build a section listing URL: `/articles`, `/hi/missions`, … */
export function sectionListHref(section: string, code: string): string {
  return `${langPrefix(code)}/${section}`
}

/** Build an article URL for a given language: `/article/x` or `/hi/article/x`. */
export function articleHref(slug: string, code: string): string {
  return sectionHref('articles', slug, code)
}

/** Build the articles listing URL for a given language. */
export function articlesListHref(code: string): string {
  return sectionListHref('articles', code)
}

// ── Path ↔ language mapping ───────────────────────────────────────────────────
//
// The universal language switch has to answer one question on EVERY route, not
// just the three translated content types: "what is this same page, in the other
// language?". That is a pure path transform — `/articles` ↔ `/hi/articles` — so
// it lives here next to `pathPrefix` rather than in the component. Adding a
// language to LANGUAGES above makes both functions handle it with no edit.

/** Normalise to a leading slash and no trailing slash (root stays '/'). */
function normalizePath(pathname: string): string {
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  return withSlash.length > 1 && withSlash.endsWith('/')
    ? withSlash.slice(0, -1)
    : withSlash
}

/**
 * Split a path into its language and the language-neutral remainder.
 *
 *   '/hi/articles' → { lang: 'hi', rest: '/articles' }
 *   '/articles'    → { lang: 'en', rest: '/articles' }
 *   '/hi'          → { lang: 'hi', rest: '/' }
 *
 * Matching is segment-aware: '/hindi-rocketry' is English, not a '/hi' page.
 */
export function stripLangPrefix(pathname: string): { lang: LanguageCode; rest: string } {
  const path = normalizePath(pathname)
  for (const l of TRANSLATION_LANGUAGES) {
    if (path === l.pathPrefix || path.startsWith(`${l.pathPrefix}/`)) {
      const rest = path.slice(l.pathPrefix.length)
      return { lang: l.code, rest: rest === '' ? '/' : rest }
    }
  }
  return { lang: DEFAULT_LANGUAGE, rest: path }
}

/** The language a path renders in — `stripLangPrefix` without the remainder. */
export function pathLanguage(pathname: string): LanguageCode {
  return stripLangPrefix(pathname).lang
}

/**
 * The same page in another language: `swapLangPath('/hi/articles', 'en')` →
 * '/articles'. Idempotent, and preserves any query string / hash so switching
 * language on `/articles?page=2` keeps the reader on page 2.
 */
export function swapLangPath(url: string, code: string): string {
  const cut    = url.search(/[?#]/)
  const path   = cut === -1 ? url : url.slice(0, cut)
  const suffix = cut === -1 ? ''  : url.slice(cut)

  const { rest } = stripLangPrefix(path)
  const prefix   = langPrefix(code)
  const base     = rest === '/' ? (prefix || '/') : `${prefix}${rest}`
  return `${base}${suffix}`
}

// Devanagari-first font stacks for Hindi. The stacks themselves are defined
// once as tokens in styles/globals.css (--font-sans-hi / --font-serif-hi);
// these constants only reference them, so there is a single place to edit and
// no chance of the CSS and the TS drifting apart.
//
// Most type is switched globally by the `:lang(hi)` rules in globals.css. These
// remain for the few places that compute a font family in JS (the article
// reader, which mixes Latin and Devanagari runs in one component).
export const HI_SANS  = 'var(--font-sans-hi)'
export const HI_SERIF = 'var(--font-serif-hi)'

// Shared hreflang / canonical logic for a localized detail page. `servedLang`
// is what actually rendered (may fall back to the default), `requestedLang` is
// the URL's language. When they differ (a language URL serving fallback
// content), the page should canonical → default and be noindex.
export function localizedAlternates(
  section: string,
  slug: string,
  availableLanguages: string[],
  servedLang: string,
  requestedLang: string,
): { isFallback: boolean; canonical: string; languages: Record<string, string> } {
  const isFallback = servedLang !== requestedLang
  const languages: Record<string, string> = {}
  for (const code of availableLanguages) languages[code] = sectionHref(section, slug, code)
  languages['x-default'] = sectionHref(section, slug, DEFAULT_LANGUAGE)
  const canonical = isFallback
    ? sectionHref(section, slug, DEFAULT_LANGUAGE)
    : sectionHref(section, slug, requestedLang)
  return { isFallback, canonical, languages }
}
