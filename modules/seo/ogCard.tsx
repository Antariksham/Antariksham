/**
 * The generated share card, shared by every `opengraph-image` route.
 *
 * Two layouts from one component: pass a `headline` and it renders the
 * editorial card (masthead, headline, footer) that a shared article gets when
 * it has no featured image of its own; omit it and it renders the brand card
 * used as the site-wide default.
 *
 * Colours are literal hex here rather than the `styles/globals.css` tokens
 * (CLAUDE.md rule 1). Satori rasterises this outside the browser — there is no
 * cascade to read a custom property from — and a share card has no theme to
 * follow, so the dark treatment is the canonical one. The values below are the
 * dark-theme tokens, kept in step with them by hand; this file and
 * `app/opengraph-image.tsx`'s gradient are the only places they are repeated.
 */

const COLOR = {
  ground:  '#0a0a0f',   // --black  (dark)
  lift:    '#12121c',   // gradient top, a touch above --black
  ink:     '#ffffff',   // --white  (dark)
  muted:   '#b4b4c2',   // --text-muted (dark)
  accent:  '#4f8ef7',   // --accent (dark)
  border:  '#2a2a3e',   // --border (dark)
} as const

export const OG_CARD_SIZE = { width: 1200, height: 630 } as const

// Satori renders an <img> from a data URI reliably, which is why the mark is
// inlined this way rather than as JSX <svg> children. encodeURIComponent keeps
// this runtime-agnostic — no Buffer, so it works on Node or the edge.
const mark = (fill: string) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="${fill}">
<path d="M50 5C44.5 32 33 62 7 92L28 84C48 56 50.5 30 50 5Z"/>
<path d="M50 5C55.5 32 67 62 93 92L72 84C52 56 49.5 30 50 5Z"/>
<path d="M24 83Q52 101 80 80Q52 92 24 83Z"/>
<path d="M50 58C50.4 62.2 53.4 64.6 56.5 65C53.4 65.4 50.4 67.8 50 72C49.6 67.8 46.6 65.4 43.5 65C46.6 64.6 49.6 62.2 50 58Z"/>
</svg>`,
)}`

const MARK_INK = mark(COLOR.ink)

/**
 * Headline size, stepped down as the headline gets longer.
 *
 * Satori has no `text-overflow`, so an overlong headline would push the footer
 * off the card rather than ellipsing. Three steps keep every real headline
 * inside 1200×630 while letting short ones stay large.
 */
export function headlineSize(headline: string): number {
  if (headline.length <= 48)  return 72
  if (headline.length <= 90)  return 60
  if (headline.length <= 140) return 50
  return 42
}

export interface OgCardProps {
  /** Article/page headline. Omitted → the brand card. */
  headline?: string
  /** Small uppercase label above the headline, e.g. "ANALYSIS". */
  eyebrow?:  string
  /** Line under the rule — byline, date, section. Defaults to the domain. */
  footer?:   string
  siteName:  string
  tagline:   string
  domain:    string
}

export function OgCard({ headline, eyebrow, footer, siteName, tagline, domain }: OgCardProps) {
  const base: React.CSSProperties = {
    width:      '100%',
    height:     '100%',
    display:    'flex',
    background: `linear-gradient(160deg, ${COLOR.lift} 0%, ${COLOR.ground} 55%, ${COLOR.ground} 100%)`,
    color:      COLOR.ink,
  }

  // ── Brand card: the site-wide default, and the fallback for any page whose
  // headline would not render (see the script note in articleMetadata.ts).
  if (!headline) {
    return (
      <div style={{ ...base, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori rasterises
            this; next/image has no meaning outside the browser. */}
        <img src={MARK_INK} width={190} height={190} alt="" />
        <div style={{ display: 'flex', fontSize: 74, fontWeight: 600, letterSpacing: '0.1em', marginTop: 26 }}>
          {siteName}
        </div>
        <div style={{ display: 'flex', width: 220, height: 3, marginTop: 34, marginBottom: 30, background: COLOR.accent }} />
        <div style={{
          display: 'flex', fontSize: 29, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: COLOR.muted, textAlign: 'center', maxWidth: 880,
        }}>
          {tagline}
        </div>
      </div>
    )
  }

  // ── Editorial card: masthead, headline, footer. The left accent stripe is the
  // signature that makes a shared card recognisable at thumbnail size.
  return (
    <div style={base}>
      <div style={{ display: 'flex', width: 14, height: '100%', background: COLOR.accent }} />

      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        flex: 1, padding: '58px 68px 54px 62px',
      }}>
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img src={MARK_INK} width={46} height={46} alt="" />
          <div style={{ display: 'flex', fontSize: 31, fontWeight: 600, letterSpacing: '0.1em', marginLeft: 16 }}>
            {siteName}
          </div>
        </div>

        {/* Headline block */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, marginBottom: 30 }}>
          {eyebrow ? (
            <div style={{
              display: 'flex', fontSize: 22, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: COLOR.accent, marginBottom: 20,
            }}>
              {eyebrow}
            </div>
          ) : null}
          <div style={{
            display: 'flex', fontSize: headlineSize(headline), fontWeight: 700,
            lineHeight: 1.16, letterSpacing: '-0.015em', maxWidth: 1010,
          }}>
            {headline}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', width: '100%', height: 1, background: COLOR.border, marginBottom: 22 }} />
          <div style={{
            display: 'flex', fontSize: 24, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: COLOR.muted,
          }}>
            {footer || domain}
          </div>
        </div>
      </div>
    </div>
  )
}
