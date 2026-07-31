/**
 * The Antariksham brand mark.
 *
 * Drawn as inline SVG rather than shipped as an image file, for three reasons
 * that matter to this codebase specifically:
 *
 *  1. **It themes itself.** Every path is `fill="currentColor"`, so the mark
 *     inherits whatever text colour its container sets. In the nav that is
 *     `var(--white)` — `#ffffff` in dark, `#0f0f1a` in light — so the logo is
 *     correct in both themes with no second asset and no hardcoded colour
 *     (MIGRATION.md §6 rules 1 and 2). A white-on-black PNG would be invisible
 *     in light mode.
 *  2. **No network request and no layout shift.** It is markup, so it paints
 *     with the nav on first render.
 *  3. **It scales.** One `size` prop drives a 16px favicon-ish mark and a 96px
 *     hero mark identically.
 *
 * The geometry lives in a 100×100 viewBox with no background: two tapered
 * blades forming the "A", a four-point star in the counter, and an arc across
 * the base. The standalone asset versions (`app/icon.svg`, `public/logo.svg`)
 * repeat these same paths over a dark plate, because a file cannot read a CSS
 * variable — see the comments there.
 *
 * ⚠ The four path strings below are duplicated in `app/icon.svg`,
 * `public/logo.svg`, `app/opengraph-image.tsx` and `scripts/generate-icons.mjs`
 * (which rasterises the PWA and iOS PNGs). If you reshape the mark, update all
 * of them and re-run `npm i --no-save sharp && node scripts/generate-icons.mjs`.
 */

export interface LogoProps {
  /** Rendered width and height in px. Default 28. */
  size?: number
  className?: string
  style?: React.CSSProperties
}

/** Left blade of the "A" — apex to the lower-left foot. */
const BLADE_LEFT  = 'M50 5C44.5 32 33 62 7 92L28 84C48 56 50.5 30 50 5Z'
/** Right blade — the mirror of the left about x=50. */
const BLADE_RIGHT = 'M50 5C55.5 32 67 62 93 92L72 84C52 56 49.5 30 50 5Z'
/** The arc across the base of the "A". */
const ARC   = 'M24 83Q52 101 80 80Q52 92 24 83Z'
/** Four-point star sitting in the counter of the "A". */
const STAR  = 'M50 58C50.4 62.2 53.4 64.6 56.5 65C53.4 65.4 50.4 67.8 50 72C49.6 67.8 46.6 65.4 43.5 65C46.6 64.6 49.6 62.2 50 58Z'

/**
 * The mark on its own, with no wordmark. Decorative by default — the
 * accessible name comes from the text next to it in `<Logo>`, or from the
 * link that wraps it. Pass `title` when it appears without adjacent text.
 */
export function LogoMark({ size = 28, className, style, title }: LogoProps & { title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={BLADE_LEFT} />
      <path d={BLADE_RIGHT} />
      <path d={ARC} />
      <path d={STAR} />
    </svg>
  )
}

/**
 * Mark + wordmark, laid out for the nav and footer. The wordmark is real text
 * in the site's sans stack rather than outlined paths, so it stays crisp at any
 * size, is selectable, and is read correctly by screen readers.
 */
export function Logo({
  size = 26,
  wordmarkSize = 22,
  showWordmark = true,
  className,
  style,
}: LogoProps & { wordmarkSize?: number; showWordmark?: boolean }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--white)', ...style }}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span
          // Stable hook so callers can hide the wordmark responsively without
          // needing a child combinator — React escapes ">" inside <style>{`…`},
          // which silently breaks any rule that uses one.
          className="logo-wordmark"
          style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      `${wordmarkSize}px`,
            fontWeight:    600,
            // The wordmark in the source logo is widely tracked — that spacing
            // is part of the mark, not a typographic accident.
            letterSpacing: '0.14em',
            lineHeight:    1,
            whiteSpace:    'nowrap',
          }}
        >
          Antariksham
        </span>
      )}
    </span>
  )
}
