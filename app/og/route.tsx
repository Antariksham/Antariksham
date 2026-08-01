import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'
import { OgCard, OG_CARD_SIZE } from '@/modules/seo/ogCard'
import { isLatinRenderable, OG_HEADLINE_MAX } from '@/modules/seo/socialMeta'

/**
 * Per-page share card: `/og?title=…&eyebrow=…&footer=…`.
 *
 * Content pages that have no image of their own (an article published without a
 * featured image, a mission with no hero, an author with no avatar) used to
 * ship `images: []` — an override that left them with no card at all. They now
 * point here, so a share still lands as a branded card carrying the headline,
 * the way Medium and Substack do it.
 *
 * A route handler rather than a per-segment `opengraph-image.tsx` for two
 * reasons: `opengraph-image` receives only `params`, so a card for an article
 * would have to re-read it from the database on every scraper hit — and
 * `getArticleBySlug` increments the view counter, so every preview would
 * inflate the count. Taking the text as query params keeps this a pure
 * renderer with no I/O. It lives at `/og` and not `/api/og` because
 * `app/robots.ts` disallows `/api/`, and Twitter and Google both honour
 * robots.txt when fetching card images.
 */

// Satori runs from `next/dist/compiled/@vercel/og/index.node.js` here; the
// bundled face is Noto Sans Latin, which is why non-Latin headlines are
// rejected below rather than rendered as tofu.
export const runtime = 'nodejs'

const clamp = (value: string | null, max: number) =>
  (value ?? '').replace(/\s+/g, ' ').trim().slice(0, max) || undefined

export function GET(request: Request) {
  const q = new URL(request.url).searchParams

  const headline = clamp(q.get('title'), OG_HEADLINE_MAX)
  const eyebrow  = clamp(q.get('eyebrow'), 40)
  const footer   = clamp(q.get('footer'), 60)

  // Anything the bundled font cannot draw falls back to the brand card, which
  // carries no caller-supplied text at all.
  const renderable = (t?: string) => (t && isLatinRenderable(t) ? t : undefined)

  return new ImageResponse(
    (
      <OgCard
        headline={renderable(headline)}
        eyebrow={renderable(eyebrow)}
        footer={renderable(footer)}
        siteName={siteConfig.name}
        tagline={siteConfig.tagline}
        domain={siteConfig.domain}
      />
    ),
    OG_CARD_SIZE,
  )
}
