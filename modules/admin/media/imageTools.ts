'use client'

import { sha256Hex } from './mediaNaming'

/**
 * Browser-side image work for the upload dialog (Phase 4 — see
 * docs/MEDIA_LIBRARY_ARCHITECTURE.md).
 *
 * The preview derivative is generated here, in a canvas, rather than on the
 * server: the browser already has the decoded image, so it costs nothing extra,
 * and it avoids both a native image dependency in the serverless bundle and the
 * paid Supabase Storage render transform. Cloudinary keeps deriving its own
 * preview from the URL.
 *
 * Every function degrades to null rather than throwing — a browser that cannot
 * encode WebP, or an image too large to rasterise, should cost the upload its
 * thumbnail, not the upload itself.
 */

/** Grid cards are 16:10 with object-fit: cover, so previews are cut to match. */
export const THUMB_WIDTH  = 400
export const THUMB_HEIGHT = 250

/** Below this there is nothing to gain — the original is already preview-sized. */
const MIN_SIZE_FOR_THUMB = 600

export interface ImageMeta {
  width:  number
  height: number
}

export async function hashFile(file: File): Promise<string> {
  return sha256Hex(await file.arrayBuffer())
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })
}

/** Natural dimensions, or null if the file is not a decodable image. */
export async function readImageMeta(file: File): Promise<ImageMeta | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return { width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * A 400×250 WebP crop of the centre of the image. Returns null when the source
 * is already small enough to serve directly, or when the browser declines to
 * encode it.
 */
export async function makeThumbnail(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    if (img.naturalWidth < MIN_SIZE_FOR_THUMB && img.naturalHeight < MIN_SIZE_FOR_THUMB) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width  = THUMB_WIDTH
    canvas.height = THUMB_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Cover: scale to fill, then centre-crop the overflow.
    const scale = Math.max(THUMB_WIDTH / img.naturalWidth, THUMB_HEIGHT / img.naturalHeight)
    const drawW = img.naturalWidth  * scale
    const drawH = img.naturalHeight * scale
    ctx.drawImage(img, (THUMB_WIDTH - drawW) / 2, (THUMB_HEIGHT - drawH) / 2, drawW, drawH)

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', 0.72),
    )
    // A browser without WebP encoding hands back a PNG, which would be larger
    // than the original crop is worth — skip rather than upload it.
    return blob && blob.type === 'image/webp' ? blob : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
