/** @type {import('next').NextConfig} */
const nextConfig = {
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
