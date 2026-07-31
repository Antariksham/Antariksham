import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'

/**
 * The site-wide default social share card.
 *
 * Next applies this to every route that does not set its own `openGraph.images`,
 * which replaces the `/images/og-default.jpg` that `config/site.ts` used to point
 * at — a file that was never added to the repo, so every share of the pages that
 * referenced it rendered a broken card.
 *
 * Generated rather than static so it always carries the current brand mark, and
 * so pages can later render their own title into the same layout by copying this
 * file into their route segment.
 */

export const alt         = `${siteConfig.name} — ${siteConfig.tagline}`
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Satori (which backs ImageResponse) renders an <img> from a data URI reliably,
// which is why the mark is inlined this way rather than as JSX <svg> children.
// encodeURIComponent keeps this runtime-agnostic — no Buffer, so it works
// whether the route is evaluated on Node or the edge.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#ffffff">
<path d="M50 5C44.5 32 33 62 7 92L28 84C48 56 50.5 30 50 5Z"/>
<path d="M50 5C55.5 32 67 62 93 92L72 84C52 56 49.5 30 50 5Z"/>
<path d="M24 83Q52 101 80 80Q52 92 24 83Z"/>
<path d="M50 58C50.4 62.2 53.4 64.6 56.5 65C53.4 65.4 50.4 67.8 50 72C49.6 67.8 46.6 65.4 43.5 65C46.6 64.6 49.6 62.2 50 58Z"/>
</svg>`

const MARK_SRC = `data:image/svg+xml,${encodeURIComponent(MARK)}`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          // The brand's own ground — --black in dark mode. Share cards have no
          // theme to follow, so the dark treatment is the canonical one.
          background:     'linear-gradient(160deg, #12121c 0%, #0a0a0f 55%, #0a0a0f 100%)',
          color:          '#ffffff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders
            this to a raster at build time; next/image has no meaning here. */}
        <img src={MARK_SRC} width={190} height={190} alt="" />

        <div
          style={{
            display:       'flex',
            fontSize:      74,
            fontWeight:    600,
            letterSpacing: '0.1em',
            marginTop:     26,
          }}
        >
          {siteConfig.name}
        </div>

        <div
          style={{
            display:       'flex',
            width:         220,
            height:        3,
            marginTop:     34,
            marginBottom:  30,
            background:    '#4f8ef7',
          }}
        />

        <div
          style={{
            display:       'flex',
            fontSize:      29,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         '#b4b4c2',
            textAlign:     'center',
            maxWidth:      880,
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    ),
    size,
  )
}
