import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

/**
 * Replaces the former public/robots.txt, which carried its own hardcoded copy
 * of the domain and so could drift from the one in config/site.ts — it already
 * had. Deriving the sitemap URL from siteConfig makes that impossible: change
 * the domain in one place and robots, sitemap, canonicals, JSON-LD and OG URLs
 * all follow.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow:     '/',
      // The admin CMS sits behind auth and has nothing to index. The API routes
      // are data endpoints for the site's own client code, not pages — keeping
      // crawlers off them saves budget without affecting in-page fetches, which
      // robots.txt does not govern.
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
