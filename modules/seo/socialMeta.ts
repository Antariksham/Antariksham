/**
 * Shared social-card (Open Graph / Twitter) resolution.
 *
 * Every public page previously assembled its own `openGraph` block by hand, and
 * the results diverged three ways:
 *
 *   1. Pages that set no `openGraph` at all inherited the root layout's, which
 *      hardcoded the site title, the site description and `url: siteConfig.url`
 *      — so sharing /articles, /learn, /live or /missions produced a card
 *      claiming to be the homepage.
 *   2. Pages that *did* set `openGraph` suppressed Next's file-convention
 *      `app/opengraph-image.tsx` (it is only merged when the segment's own
 *      metadata has no `openGraph` key), so /explore, /gallery and friends
 *      shipped with no `og:image` whatsoever.
 *   3. Content pages passed `images: featured ? [featured] : []` — an empty
 *      array is still an override, so any article or mission without a featured
 *      image also shipped with no card image.
 *
 * On top of that nothing emitted `og:image:width`/`height`/`alt`, which is what
 * makes WhatsApp, Facebook and LinkedIn render a large card on first scrape
 * instead of a thumbnail, and the root layout pinned `twitter:title`/
 * `twitter:description` to the site defaults, which blocked Next's per-page
 * inheritance and put the generic site title on every shared article.
 *
 * This module is the single place those decisions now live. Pure and
 * isomorphic — no DOM, no Next imports, no `@/` alias — so it runs under the
 * bare node test runner like `jsonLd.ts` next to it.
 */

/** Canonical Open Graph card dimensions. 1.91:1, the size every scraper wants. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const

/** Route of the generated site-wide card (`app/opengraph-image.tsx`). */
export const DEFAULT_OG_PATH = '/opengraph-image'

/** Route of the per-page generated card (`app/og/route.tsx`). */
export const OG_CARD_ROUTE = '/og'

/**
 * Headline budget for a generated card. Past this the type has to shrink far
 * enough that the card reads worse than the brand card, and the URL starts
 * costing more than the picture is worth.
 */
export const OG_HEADLINE_MAX = 150

/**
 * Facebook renders ~300 characters of `og:description` and Twitter ~200.
 * Longer text is not rejected, it is truncated mid-word by the scraper — so
 * clamp on a word boundary here and keep control of where the cut lands.
 */
export const OG_DESCRIPTION_MAX = 300

/**
 * The slice of `config/site.ts` these builders need, passed in rather than
 * imported — same contract as `SiteInfo` in `jsonLd.ts`, and for the same two
 * reasons: no `@/` alias so this stays testable under bare node, and the domain
 * keeps living in exactly one place (CLAUDE.md rule 9). `siteConfig` satisfies
 * it structurally — just pass it.
 */
export interface SocialSite {
  readonly url:     string
  readonly name:    string
  readonly locale:  string
  readonly twitter: string
}

export type OgType = 'website' | 'article' | 'profile'

export interface SocialInput {
  /** Site-relative path of this page, e.g. `/article/artemis-ii`. */
  path:           string
  /** The page's own headline — no site suffix; `og:site_name` carries the brand. */
  title:          string
  description:    string
  /** Content image (featured image, avatar, APOD…). Falsy → the generated card. */
  image?:         string | null
  imageAlt?:      string | null
  type?:          OgType
  /** OG locale, e.g. `en_US`. Defaults to the site locale. */
  locale?:        string
  publishedTime?: string | null
  modifiedTime?:  string | null
  authors?:       string[]
  section?:       string | null
  tags?:          string[]
}

export interface OgImage {
  url:    string
  width:  number
  height: number
  alt:    string
  type?:  string
}

export interface SocialCard {
  openGraph: {
    title:          string
    description:    string
    url:            string
    siteName:       string
    locale:         string
    type:           OgType
    images:         OgImage[]
    publishedTime?: string
    modifiedTime?:  string
    authors?:       string[]
    section?:       string
    tags?:          string[]
  }
  twitter: {
    title:       string
    description: string
    site:        string
    creator:     string
    images:      string[]
  }
}

const trimSlash = (s: string) => s.replace(/\/$/, '')

/**
 * Absolute URL for a site-relative path.
 *
 * Absolute inputs pass through untouched — a Supabase or Cloudinary image is
 * already on another origin, and prefixing it would break the card.
 */
export function absoluteUrl(site: SocialSite, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('//'))      return `https:${path}`
  const base = trimSlash(site.url)
  // `https://site/` is the canonical form of a root URL. Next normalises it to
  // the bare origin when it resolves `alternates.canonical`, so emitting it
  // here keeps `og:url` and the canonical link agreeing either way.
  if (!path || path === '/')      return `${base}/`
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * MIME type for a card image, from its extension.
 *
 * Optional in the spec but worth emitting: Facebook and LinkedIn use
 * `og:image:type` to decide whether to fetch the image at all when they are
 * rate-limited, and a wrong guess is worse than none — so anything unrecognised
 * returns undefined rather than defaulting to PNG. Query strings are stripped
 * first (Supabase signs URLs with `?token=`).
 */
export function imageMimeType(url: string): string | undefined {
  const ext = trimSlash(url.split(/[?#]/)[0]).toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png':  return 'image/png'
    case 'webp': return 'image/webp'
    case 'gif':  return 'image/gif'
    case 'avif': return 'image/avif'
    default:     return undefined
  }
}

/**
 * Can the generated card's font draw this string?
 *
 * Satori rasterises with the Latin-only Noto Sans that ships inside
 * `next/og` (`noto-sans-v27-latin-regular.ttf`), so a Hindi headline would come
 * out as a row of empty boxes — worse than no headline. Anything outside Latin,
 * Latin Extended and general punctuation/symbols is treated as unrenderable and
 * falls back to the brand card.
 */
export function isLatinRenderable(text: string): boolean {
  // ASCII + Latin-1/Extended-A/B, general punctuation (curly quotes, en/em
  // dashes, ellipsis), currency symbols and letterlike symbols (No., TM).
  return !/[^\u0000-\u024F\u2000-\u206F\u20A0-\u20BF\u2100-\u214F]/.test(text)
}

/**
 * Path of a generated card carrying this page's own headline, for pages with no
 * image of their own. Falls back to the site card when the text cannot be drawn.
 */
export function ogCardPath(
  { title, eyebrow, footer }: { title: string; eyebrow?: string | null; footer?: string | null },
): string {
  const headline = title.replace(/\s+/g, ' ').trim().slice(0, OG_HEADLINE_MAX)
  if (!headline || !isLatinRenderable(headline)) return DEFAULT_OG_PATH

  const q = new URLSearchParams({ title: headline })
  if (eyebrow && isLatinRenderable(eyebrow)) q.set('eyebrow', eyebrow)
  if (footer  && isLatinRenderable(footer))  q.set('footer',  footer)
  return `${OG_CARD_ROUTE}?${q.toString()}`
}

/**
 * Clamp a description to `max` characters on a word boundary.
 *
 * The ellipsis is part of the budget, so the result never exceeds `max`.
 */
export function clampDescription(text: string, max = OG_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, '')}…`
}

/**
 * Resolve the card image: the page's own image when it has one, the generated
 * site card otherwise. Never returns an empty list — an empty `og:image` is
 * what produced the bare, imageless previews this module exists to fix.
 *
 * `fallbackPath` lets a route point at a card generated for it specifically
 * (articles render their headline; see `app/article/[slug]/opengraph-image.tsx`)
 * while everything else falls back to the site card.
 */
export function resolveOgImage(
  site: SocialSite,
  { image, imageAlt, title }: Pick<SocialInput, 'image' | 'imageAlt' | 'title'>,
  fallbackPath: string = DEFAULT_OG_PATH,
): OgImage {
  const src = image?.trim() || fallbackPath
  return {
    url:    absoluteUrl(site, src),
    ...OG_IMAGE_SIZE,
    alt:    imageAlt?.trim() || title,
    type:   imageMimeType(src) ?? (image?.trim() ? undefined : 'image/png'),
  }
}

/**
 * Build the Open Graph + Twitter fields for a page.
 *
 * `twitter` repeats title/description rather than leaning on Next's inheritance
 * because the values differ once clamped, and because being explicit is what
 * stops a future edit to the root layout from silently pinning every page to
 * the site defaults again.
 */
export function buildSocialCard(
  site: SocialSite,
  input: SocialInput,
  fallbackImagePath?: string,
): SocialCard {
  const description = clampDescription(input.description || '')
  const title       = input.title.trim()
  const image       = resolveOgImage(site, input, fallbackImagePath)
  const type        = input.type ?? 'website'

  return {
    openGraph: {
      title,
      description,
      url:      absoluteUrl(site, input.path),
      siteName: site.name,
      locale:   input.locale || site.locale,
      type,
      images:   [image],
      // `article:*` is only meaningful on og:type=article; emitting it elsewhere
      // is noise a scraper has to discard.
      ...(type === 'article' ? {
        ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
        ...(input.modifiedTime  ? { modifiedTime:  input.modifiedTime  } : {}),
        ...(input.authors?.length ? { authors: input.authors } : {}),
        ...(input.section       ? { section: input.section }   : {}),
        ...(input.tags?.length  ? { tags: input.tags.slice(0, 6) } : {}),
      } : {}),
    },
    twitter: {
      title,
      description,
      site:    site.twitter,
      creator: site.twitter,
      images:  [image.url],
    },
  }
}
