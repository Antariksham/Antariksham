/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // `next build` (and `next lint`) only lint Next's own default folders —
    // app, pages, components, lib, src. Almost all of this codebase lives in
    // modules/, which meant ~80% of it was never linted, on Vercel or locally.
    // Listing the real source roots closes that gap in the build we already run.
    dirs: ['app', 'components', 'modules', 'lib', 'utils', 'config', 'actions', 'types'],
  },
  async redirects() {
    // The articles section was renamed from /news → /articles. Keep the old
    // URLs alive with permanent (301) redirects so links and SEO equity survive.
    return [
      { source: '/news',       destination: '/articles',       permanent: true },
      { source: '/news/:slug', destination: '/articles/:slug', permanent: true },
    ]
  },
}

module.exports = nextConfig
