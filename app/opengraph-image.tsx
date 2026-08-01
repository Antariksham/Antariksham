import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'
import { OgCard, OG_CARD_SIZE } from '@/modules/seo/ogCard'

/**
 * The site-wide default share card.
 *
 * Next applies this by file convention to routes that set no `openGraph` of
 * their own; every page that does set one now names this route explicitly via
 * `modules/seo/pageMetadata.ts`, because a segment's own `openGraph` suppresses
 * the file-convention merge and used to leave those pages with no card at all.
 *
 * The layout itself lives in `modules/seo/ogCard.tsx`, shared with the
 * per-article card so both stay one design.
 */

export const alt         = `${siteConfig.name} — ${siteConfig.tagline}`
export const size        = OG_CARD_SIZE
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        siteName={siteConfig.name}
        tagline={siteConfig.tagline}
        domain={siteConfig.domain}
      />
    ),
    size,
  )
}
