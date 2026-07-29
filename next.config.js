/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // A single article reads at `/article/:slug` — the exact URL shape
    // cosmosdaily.space already has indexed, so the cutover changes no live
    // article URL (MIGRATION.md §9). The browse-all listing stays `/articles`.
    //
    // Everything below is an older shape kept alive with permanent (301)
    // redirects so links and SEO equity survive.
    return [
      // Section rename: /news → /articles (this engine's own history).
      { source: '/news',       destination: '/articles',      permanent: true },
      { source: '/news/:slug', destination: '/article/:slug', permanent: true },

      // Detail pages were briefly plural here. Nothing public ever served them,
      // but internal links written before the move (article bodies, the admin
      // link tool) still point at the plural form.
      { source: '/articles/:slug',    destination: '/article/:slug',    permanent: true },
      { source: '/hi/articles/:slug', destination: '/hi/article/:slug', permanent: true },

      // CosmosDaily's pre-Next article URL, carried over from the
      // cosmosdaily-nextjs repo this engine replaces.
      {
        source: '/article.html',
        has: [{ type: 'query', key: 'slug', value: '(?<slug>.*)' }],
        destination: '/article/:slug',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
