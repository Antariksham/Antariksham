import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { buildSocialCard, type SocialInput } from './socialMeta'

/**
 * The one way a public page declares its metadata.
 *
 * Next replaces `openGraph` and `twitter` wholesale per segment — it does not
 * deep-merge them with the root layout — so a page that sets `openGraph` and
 * forgets `siteName`, `url` or an image simply ships without them. That is how
 * the site ended up with cards claiming to be the homepage and pages with no
 * `og:image` at all. Routing every page through here means the full set is
 * always emitted and a page only has to say what makes it different.
 *
 * `title` is the bare page name: the root layout's `titleTemplate` appends
 * "| Antariksham" for the browser tab, and `og:site_name` carries the brand in
 * the share card — so passing "Learn — Antariksham" here would render
 * "Learn — Antariksham | Antariksham", which is what several pages used to do.
 */
export interface PageMetaInput extends SocialInput {
  /** Canonical path. Defaults to `path`; pass this only when they differ. */
  canonical?: string
  /** hreflang map, from `localizedAlternates()`. */
  languages?: Record<string, string>
  /** Language URLs serving fallback content are canonical → default + noindex. */
  noindex?:   boolean
  /**
   * Route of a card generated for this page specifically, used when the page
   * has no content image of its own. Defaults to the site-wide card.
   */
  fallbackImagePath?: string
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const { canonical, languages, noindex, fallbackImagePath, ...social } = input
  const { openGraph, twitter } = buildSocialCard(siteConfig, social, fallbackImagePath)

  return {
    title:       social.title,
    description: openGraph.description,
    alternates: {
      canonical: canonical ?? social.path,
      ...(languages ? { languages } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph,
    twitter: { card: siteConfig.seo.twitterCard, ...twitter },
  }
}
