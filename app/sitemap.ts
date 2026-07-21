import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { getAllArticleSlugs }   from '@/modules/news/services/getArticles'
import { getAllMissionSlugs }   from '@/modules/missions/services/getMissions'
import { getAllKnowledgeSlugs } from '@/modules/learn/services/getKnowledgeArticles'

// Rebuilt hourly. Content pages are listed dynamically from the database; if a
// query fails at build/runtime it degrades to the static routes rather than
// erroring the whole sitemap.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const now  = new Date()

  const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',                  priority: 1.0, freq: 'daily'   },
    { path: '/news',             priority: 0.9, freq: 'hourly'  },
    { path: '/missions',         priority: 0.8, freq: 'daily'   },
    { path: '/learn',            priority: 0.8, freq: 'weekly'  },
    { path: '/live',             priority: 0.7, freq: 'always'  },
    { path: '/lunar-sim',        priority: 0.6, freq: 'monthly' },
    { path: '/about',            priority: 0.5, freq: 'monthly' },
    { path: '/contact',          priority: 0.4, freq: 'yearly'  },
    { path: '/sources',          priority: 0.4, freq: 'monthly' },
    { path: '/editorial-policy', priority: 0.3, freq: 'yearly'  },
    { path: '/privacy',          priority: 0.3, freq: 'yearly'  },
    { path: '/terms',            priority: 0.3, freq: 'yearly'  },
  ]

  const [articleSlugs, missionSlugs, learnSlugs] = await Promise.all([
    getAllArticleSlugs().catch(() => []),
    getAllMissionSlugs().catch(() => []),
    getAllKnowledgeSlugs().catch(() => []),
  ])

  const staticRoutes: MetadataRoute.Sitemap = STATIC.map(s => ({
    url: `${base}${s.path}`, lastModified: now, changeFrequency: s.freq, priority: s.priority,
  }))

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...articleSlugs.map(slug => ({ url: `${base}/news/${slug}`,     lastModified: now, changeFrequency: 'weekly'  as const, priority: 0.8 })),
    ...missionSlugs.map(slug => ({ url: `${base}/missions/${slug}`, lastModified: now, changeFrequency: 'weekly'  as const, priority: 0.6 })),
    ...learnSlugs.map(slug  => ({ url: `${base}/learn/${slug}`,     lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ]

  return [...staticRoutes, ...dynamicRoutes]
}
