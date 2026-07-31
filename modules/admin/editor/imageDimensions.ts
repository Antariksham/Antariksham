/**
 * Intrinsic image dimensions for editor-inserted images.
 *
 * Why this exists: `.article-body img` is `max-width: 100%; height: auto`, so
 * until an image's bytes arrive the browser has no idea how tall it will be and
 * the text below it jumps when it loads. That is cumulative layout shift, on the
 * one surface where it matters most — a reader mid-paragraph.
 *
 * The fix is not CSS. Give the `<img>` real `width` and `height` attributes and
 * the browser derives an aspect-ratio from them, reserving the correct box
 * *while still* honouring `height: auto` for responsive scaling. So the CSS
 * stays exactly as it is and the markup carries the information.
 *
 * The editor is the right place to capture this: it has the image in a browser
 * at the moment of insertion, so the size costs one already-cached decode.
 * `sanitizeHtml` had to be taught to keep the two attributes, or they were
 * stripped straight back out again.
 */

export interface ImageSize { width: number; height: number }

/** Upper bound on how long insertion will wait for an image to report its size. */
const PROBE_TIMEOUT_MS = 5000

/**
 * Serialises a probed size into `width`/`height` attributes.
 *
 * Returns an empty string for anything unusable, so a failed probe degrades to
 * exactly today's markup rather than emitting `width="0"` — which would collapse
 * the image instead of merely failing to reserve space for it.
 */
export function imageSizeAttrs(size: ImageSize | null | undefined): string {
  if (!size) return ''
  const { width, height } = size
  if (!Number.isFinite(width) || !Number.isFinite(height)) return ''
  if (width <= 0 || height <= 0) return ''
  return ` width="${Math.round(width)}" height="${Math.round(height)}"`
}

/**
 * Loads `src` off-document to read its intrinsic size.
 *
 * Never rejects: a broken URL, a hotlink-blocked host or a slow CDN resolves to
 * null and the image is inserted without dimensions. Failing to optimise is an
 * acceptable outcome here; failing to insert the author's image is not.
 */
export function probeImageSize(
  src: string,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<ImageSize | null> {
  if (typeof window === 'undefined' || !src) return Promise.resolve(null)

  return new Promise(resolve => {
    const img = new window.Image()
    let settled = false

    const finish = (value: ImageSize | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      // Drop the handlers so a late load cannot resolve after the timeout.
      img.onload = null
      img.onerror = null
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    img.onload = () =>
      finish(
        img.naturalWidth && img.naturalHeight
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      )
    img.onerror = () => finish(null)

    // Anonymous so a CORS-enabled host does not taint anything; harmless when
    // the host sends no CORS headers, because only the dimensions are read.
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}
