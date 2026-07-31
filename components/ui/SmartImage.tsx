import Image from 'next/image'
import { isOptimizableImage } from '@/config/images'

/**
 * An image that optimises itself when it safely can, and gets out of the way
 * when it cannot.
 *
 * `next/image` gives responsive `srcset` and modern formats, but only for hosts
 * on the `remotePatterns` allow-list — anything else 400s. Article and mission
 * featured images are URLs an editor typed, so they can point anywhere, and
 * that is precisely why `next/image` was removed from this codebase before.
 *
 * So: allow-listed host (Supabase Storage, Cloudinary, or same-origin) →
 * `next/image`. Anything else → a plain `<img>` carrying the same attributes,
 * which is byte-for-byte today's behaviour. Adding an image host later means
 * changing one env-derived list, not hunting call sites.
 *
 * `width`/`height` are required either way. next/image needs them for its
 * aspect-ratio box, and a plain `<img>` uses them to reserve space before load.
 * They are intrinsic-size hints, not a rendered size — CSS still decides how
 * big the image actually is.
 */

/**
 * `sizes` for anything rendered as a `.card-image` in the site's `.grid-3`:
 * one column on phones, two on tablets, three on desktop. Without this the
 * browser assumes the image fills the viewport and downloads roughly three
 * times more than a card needs.
 */
export const CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw'

/** Intrinsic hint for card images. `.card-image` CSS still crops to 200px. */
export const CARD_IMAGE_W = 800
export const CARD_IMAGE_H = 400

export interface SmartImageProps {
  src:        string
  alt:        string
  /** Intrinsic width hint. CSS still controls the rendered size. */
  width:      number
  /** Intrinsic height hint. */
  height:     number
  className?: string
  style?:     React.CSSProperties
  /**
   * Responsive size hint for the generated srcset, e.g.
   * `(max-width: 640px) 100vw, 33vw`. Without it the browser assumes 100vw and
   * downloads a larger file than a card needs.
   */
  sizes?:     string
  /** Set on the LCP image only — disables lazy loading and preloads it. */
  priority?:  boolean
}

export function SmartImage({
  src, alt, width, height, className, style, sizes, priority = false,
}: SmartImageProps) {
  if (!src) return null

  if (isOptimizableImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
      />
    )
  }

  // Deliberate raw <img>: this host is not on the optimiser's allow-list, so
  // next/image would answer 400 for it. This is the one place in the codebase
  // where that fallback lives.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  )
}
