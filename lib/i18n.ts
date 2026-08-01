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

// ── Crossing between languages ────────────────────────────────
//
// The sections that exist in every language — both their listing and their
// detail segment, so `/articles` and `/article/:slug` both resolve. Derived
// from DETAIL_SEGMENT rather than hand-listed, so translating a new section
// means adding it here once and nowhere else.
const LOCALIZED_SECTIONS = ['articles', 'learn', 'missions'] as const

const LOCALIZED_ROOTS: Set<string> = new Set(
  LOCALIZED_SECTIONS.flatMap(s => [s, detailSegment(s)]),
)

/** Language a path renders in, read from its prefix: `/hi/…` → 'hi', else 'en'. */
export function langFromPathname(pathname: string): LanguageCode {
  for (const l of TRANSLATION_LANGUAGES) {
    if (pathname === l.pathPrefix || pathname.startsWith(`${l.pathPrefix}/`)) return l.code
  }
  return DEFAULT_LANGUAGE
}

/** Strip a path's language prefix: `/hi/learn/x` → `/learn/x`, `/hi` → `/`. */
export function stripLangPrefix(pathname: string): string {
  const prefix = langPrefix(langFromPathname(pathname))
  if (!prefix) return pathname || '/'
  return pathname.slice(prefix.length) || '/'
}

/**
 * The same page in another language.
 *
 * Only the sections above are translated, so anything else — `/live/*`,
 * `/explore/*`, `/gallery/*`, `/about` — has no counterpart to point at. Those
 * fall back to the target language's **home page** rather than the switch
 * disappearing: chrome that vanishes on some routes is worse than a control
 * that always means "read this site in Hindi", and it can never 404.
 *
 * A detail URL maps straight across even when that item has no translation
 * yet. The route exists and already handles the miss deliberately — it serves
 * the English text under `canonical → EN` + `noindex` (see
 * `localizedAlternates`). Global chrome cannot know what is translated without
 * a per-page read; the on-page `LanguageToggle`, which does know, stays the
 * precise control.
 */
export function counterpartPath(pathname: string, target: string): string {
  return localizedTarget(stripLangPrefix(pathname), target) ?? (langPrefix(target) || '/')
}

/**
 * A **chrome** link — nav, mega-menu, footer, logo — pointed at the language
 * the reader is currently in, so following it doesn't silently drop them back
 * into English.
 *
 * The difference from `counterpartPath` is only the fallback, and it matters.
 * That one answers "the same page in another language", so an untranslated
 * route sends you to that language's home. This one answers "where should this
 * nav item go for a reader in `lang`" — and an untranslated section keeps its
 * own URL, because that is where the content actually is. Clicking "Live" from
 * `/hi` belongs on `/live`, not back at `/hi`.
 */
export function localizeHref(href: string, lang: string): string {
  const bare = stripLangPrefix(href)
  return localizedTarget(bare, lang) ?? bare
}

/** Shared by both: the localized URL for a bare path, or null if untranslated. */
function localizedTarget(bare: string, lang: string): string | null {
  if (bare === '/') return langPrefix(lang) || '/'
  const root = bare.split('/')[1] ?? ''
  return LOCALIZED_ROOTS.has(root) ? `${langPrefix(lang)}${bare}` : null
}

/** Build the articles listing URL for a given language. */
export function articlesListHref(code: string): string {
  return sectionListHref('articles', code)
}

// Devanagari-first font stacks for Hindi. Prepend widely-installed Devanagari
// faces (Android/Windows/Apple all ship one) ahead of the Latin stacks — no
// webfont download, matching the project's system-font convention.
export const HI_SANS  = "'Noto Sans Devanagari','Nirmala UI','Mangal',var(--font-sans)"
export const HI_SERIF = "'Noto Serif Devanagari','Tiro Devanagari Hindi','Nirmala UI',var(--font-serif)"

/**
 * Sans stack for a language, for chrome that renders one language's name
 * inside another language's page — the nav switch shows "हिन्दी" on English
 * pages, where the surrounding stack has no Devanagari and the browser would
 * pick whatever it happens to fall back to.
 */
export function langSans(code: string): string {
  return code === 'hi' ? HI_SANS : 'var(--font-sans)'
}

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
