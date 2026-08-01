/**
 * Hosts the image optimiser may fetch from.
 *
 * Derived from the same environment variables as `config/images.ts`, which does
 * the matching check at render time. Keeping both sides on one source means the
 * build-time allow-list and the runtime decision cannot disagree — a
 * disagreement would surface as a 400 on a live image, which is exactly why
 * next/image was pulled out of this codebase once before.
 *
 * Deliberately NOT `hostname: '**'`. A wildcard makes the site an open image
 * proxy: anyone can pass any URL through it and the resizing is billed here.
 * Images on hosts outside this list render as plain <img> instead (see
 * components/ui/SmartImage.tsx) — unoptimised, but never broken.
 */
function imageRemotePatterns() {
  const patterns = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const u = new URL(supabaseUrl)
      patterns.push({
        protocol: u.protocol.replace(':', ''),
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: '/**',
      })
    } catch { /* malformed env — fall through with no pattern */ }
  }

  if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    patterns.push({ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' })
  }

  return patterns
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageRemotePatterns(),
    // The optimiser will not rasterise SVG, so a hostile SVG can never be
    // served back through this origin.
    dangerouslyAllowSVG: false,
  },
  eslint: {
    // `next build` (and `next lint`) only lint Next's own default folders —
    // app, pages, components, lib, src. Almost all of this codebase lives in
    // modules/, which meant ~80% of it was never linted, on Vercel or locally.
    // Listing the real source roots closes that gap in the build we already run.
    dirs: ['app', 'components', 'modules', 'lib', 'utils', 'config', 'actions', 'types'],
  },
  // No `redirects()`. The `/news → /articles` 301s that used to live here were
  // written for link equity the site never had — it is pre-launch, with no
  // domain attached, nothing in Search Console and no sitemap submitted, so no
  // old URL was ever reachable to preserve. Permanent redirects are permanent;
  // carrying them for URLs nobody visited is cost with no benefit.
  //
  // This reasoning expires at launch. Once real URLs are indexed, moving one
  // means a 301 here — see ENGINEERING.md §6.
}

module.exports = nextConfig
