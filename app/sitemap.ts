import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { getAllArticleSlugs, getTranslatedArticleSlugs }     from '@/modules/articles/services/getArticles'
import { getAllMissionSlugs, getTranslatedMissionSlugs }     from '@/modules/missions/services/getMissions'
import { getAllKnowledgeSlugs, getTranslatedKnowledgeSlugs } from '@/modules/learn/services/getKnowledgeArticles'
import { getAllAuthorSlugs }    from '@/modules/authors/services/getAuthors'
import { TOPICS }               from '@/modules/explore/services/topics'
import { LANGUAGE_LIST, DEFAULT_LANGUAGE, swapLangPath, sectionHref, type LanguageCode } from '@/lib/i18n'

// Rebuilt hourly. Content pages are listed dynamically from the database; if a
// query fails at build/runtime it degrades to the static routes rather than
// erroring the whole sitemap.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const now  = new Date()

  const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',                  priority: 1.0, freq: 'daily'   },
    { path: '/articles',         priority: 0.9, freq: 'hourly'  },
    { path: '/missions',         priority: 0.8, freq: 'daily'   },
    { path: '/learn',            priority: 0.8, freq: 'weekly'  },
    { path: '/live',             priority: 0.7, freq: 'always'  },
    { path: '/explore',          priority: 0.7, freq: 'weekly'  },
    { path: '/explore/solar-system', priority: 0.6, freq: 'weekly' },
    { path: '/explore/sky-tonight',  priority: 0.6, freq: 'daily'  },
    { path: '/explore/topics',       priority: 0.7, freq: 'weekly' },
    ...TOPICS.map(t => ({ path: `/explore/topics/${t.slug}`, priority: 0.6, freq: 'weekly' as const })),
    { path: '/gallery',              priority: 0.7, freq: 'weekly' },
    { path: '/gallery/apod',         priority: 0.6, freq: 'daily'  },
    { path: '/lunar-sim',        priority: 0.6, freq: 'monthly' },
    { path: '/about',            priority: 0.5, freq: 'monthly' },
    { path: '/contact',          priority: 0.4, freq: 'yearly'  },
    { path: '/sources',          priority: 0.4, freq: 'monthly' },
    { path: '/editorial-policy', priority: 0.3, freq: 'yearly'  },
    { path: '/privacy',          priority: 0.3, freq: 'yearly'  },
    { path: '/terms',            priority: 0.3, freq: 'yearly'  },
  ]

  // hreflang for a path that exists in every language. Google wants each
  // language's URL to point at the whole cluster INCLUDING itself, so this is
  // emitted on the entry for every language, not just the default.
  const alternatesFor = (path: string) => {
    const languages: Record<string, string> = {}
    for (const l of LANGUAGE_LIST) languages[l.code] = `${base}${swapLangPath(path, l.code)}`
    return { languages }
  }

  const [
    articleSlugs, missionSlugs, learnSlugs, authorSlugs,
    hiArticleSlugs, hiMissionSlugs, hiLearnSlugs,
  ] = await Promise.all([
    getAllArticleSlugs().catch(() => []),
    getAllMissionSlugs().catch(() => []),
    getAllKnowledgeSlugs().catch(() => []),
    getAllAuthorSlugs().catch(() => []),
    // Only slugs with a PUBLISHED Hindi translation. An untranslated slug under
    // /hi serves English and canonicals back to the English URL, so listing it
    // would spend crawl budget advertising a soft duplicate.
    getTranslatedArticleSlugs('hi').catch(() => []),
    getTranslatedMissionSlugs('hi').catch(() => []),
    getTranslatedKnowledgeSlugs('hi').catch(() => []),
  ])

  // Static pages exist in every language, so each gets one entry per language.
  const staticRoutes: MetadataRoute.Sitemap = LANGUAGE_LIST.flatMap(l =>
    STATIC.map(s => ({
      url:             `${base}${swapLangPath(s.path || '/', l.code)}`,
      lastModified:    now,
      changeFrequency: s.freq,
      // Translations rank behind the default language, not against it.
      priority:        l.code === DEFAULT_LANGUAGE ? s.priority : Math.max(0.1, s.priority - 0.1),
      alternates:      alternatesFor(s.path || '/'),
    })),
  )

  // Content pages are per-language: a URL is listed only where that language's
  // text actually exists.
  const contentRoutes = (
    section: 'articles' | 'missions' | 'learn',
    slugs: string[],
    lang: LanguageCode,
    freq: 'weekly' | 'monthly',
    priority: number,
  ): MetadataRoute.Sitemap => slugs.map(slug => ({
    url:             `${base}${sectionHref(section, slug, lang)}`,
    lastModified:    now,
    changeFrequency: freq,
    priority,
    alternates:      alternatesFor(sectionHref(section, slug, DEFAULT_LANGUAGE)),
  }))

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...contentRoutes('articles', articleSlugs,   'en', 'weekly',  0.8),
    ...contentRoutes('missions', missionSlugs,   'en', 'weekly',  0.6),
    ...contentRoutes('learn',    learnSlugs,     'en', 'monthly', 0.6),
    ...contentRoutes('articles', hiArticleSlugs, 'hi', 'weekly',  0.7),
    ...contentRoutes('missions', hiMissionSlugs, 'hi', 'weekly',  0.5),
    ...contentRoutes('learn',    hiLearnSlugs,   'hi', 'monthly', 0.5),
    // Author pages are shared metadata, not translated content — one URL each.
    ...authorSlugs.map(slug => ({
      url: `${base}/authors/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.4,
    })),
  ]

  return [...staticRoutes, ...dynamicRoutes]
}
