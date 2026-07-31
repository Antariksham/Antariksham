/**
 * Which image hosts Next is allowed to optimise.
 *
 * `next/image` was removed from this codebase once already: with no
 * `images.remotePatterns` configured the optimiser answers 400 for every
 * external host, so featured images entered by an admin simply broke. The fix
 * is not a wildcard pattern — `hostname: '**'` turns the site into an open image
 * proxy that anyone can point at any URL, billed to the site's own Vercel
 * account. Instead only the hosts this site actually uploads to are optimised,
 * and anything else falls back to a plain `<img>`, which is exactly today's
 * behaviour and cannot break.
 *
 * The list is derived from environment variables rather than hardcoded, and
 * `next.config.js` derives its `remotePatterns` from the *same* variables. That
 * is deliberate: if the build-time allow-list and the runtime check could drift,
 * the drift would show up as a 400 on a live image, which is the failure this
 * whole design exists to avoid.
 *
 * Note `process.env.NEXT_PUBLIC_*` must be referenced as a literal member
 * expression — Next inlines it at build time and dynamic lookups do not work.
 */

/** Hosts (including port, when there is one) whose images may be optimised. */
export const OPTIMIZABLE_HOSTS: string[] = (() => {
  const hosts: string[] = []

  // Supabase Storage — where the Media Library uploads.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try { hosts.push(new URL(supabaseUrl).host) } catch { /* malformed env, skip */ }
  }

  // Cloudinary already returns optimised AVIF/WebP itself, but routing it
  // through next/image still gives responsive srcset for free.
  if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) hosts.push('res.cloudinary.com')

  return hosts
})()

/**
 * True when `src` can safely go through the Next image optimiser.
 *
 * Same-origin paths always can. Absolute URLs only if their host is on the
 * list. Everything else — `data:`, `blob:`, an admin-entered URL on some
 * agency's CDN — returns false and gets a plain `<img>`.
 */
export function isOptimizableImage(src: string | null | undefined): boolean {
  if (!src) return false

  // Relative to this site: no allow-list involved.
  if (src.startsWith('/') && !src.startsWith('//')) return true

  try {
    const url = new URL(src)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    return OPTIMIZABLE_HOSTS.includes(url.host)
  } catch {
    return false
  }
}
