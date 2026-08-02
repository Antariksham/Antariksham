import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { getAllArticleSlugs,   getTranslatedArticleSlugs }   from '@/modules/articles/services/getArticles'
import { getAllMissionSlugs,   getTranslatedMissionSlugs }   from '@/modules/missions/services/getMissions'
import { getAllKnowledgeSlugs, getTranslatedKnowledgeSlugs } from '@/modules/learn/services/getKnowledgeArticles'
import { getAllAuthorSlugs }    from '@/modules/authors/services/getAuthors'
import { TOPICS }               from '@/modules/explore/services/topics'
import { localizeHref, TRANSLATION_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n'

// Rebuilt hourly. Content pages are listed dynamically from the database; if a
// query fails at build/runtime it degrades to the static routes rather than
// erroring the whole sitemap.
export const revalidate = 3600

type Freq = MetadataRoute.Sitemap[number]['changeFrequency']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const now  = new Date()

  const abs = (path: string) => `${base}${path}`

  /**
   * One sitemap entry per language a path exists in, each carrying the **same**
   * `alternates.languages` map naming all of them.
   *
   * The reciprocity is the entire point. Google treats hreflang as a mutual
   * declaration and discards any annotation the other side does not confirm —
   * so listing `/hi/articles` while `/articles` stays silent leaves *both*
   * unclustered, which is the state this site was in. Every variant therefore
   * names every other one, itself included, plus `x-default`.
   *
   * `translated` decides whether the Hindi half exists at all. For a section
   * listing it is always true; for a detail page only when that item has a
   * published translation. An untranslated `/hi/article/:slug` still *renders*
   * — it serves the English text under canonical→EN + noindex — and listing
   * that would ask Google to crawl a page whose own head tells it not to index.
   *
   * The Hindi path comes from `localizeHref`, the same function the nav and the
   * language switch use, so the sitemap cannot drift from where the site
   * actually links. Adding a section to `LOCALIZED_SECTIONS` in lib/i18n.ts
   * brings it in here with no edit.
   */
  function localized(
    path: string,
    { priority, freq, translated = true }: { priority: number; freq: Freq; translated?: boolean },
  ): MetadataRoute.Sitemap {
    const variants: [string, string][] = [[DEFAULT_LANGUAGE, path]]

    if (translated) {
      for (const { code } of TRANSLATION_LANGUAGES) {
        const localizedPath = localizeHref(path, code)
        // Unchanged means the section has no counterpart in that language.
        if (localizedPath !== path) variants.push([code, localizedPath])
      }
    }

    // A single-language URL needs no alternates — an hreflang set of one says
    // nothing, and emitting it is noise on every crawl.
    if (variants.length === 1) {
      return [{ url: abs(path), lastModified: now, changeFrequency: freq, priority }]
    }

    const languages: Record<string, string> = Object.fromEntries(
      variants.map(([code, p]) => [code, abs(p)]),
    )
    languages['x-default'] = abs(path)

    return variants.map(([, p]) => ({
      url:             abs(p),
      lastModified:    now,
      changeFrequency: freq,
      priority,
      alternates: { languages },
    }))
  }

  const STATIC: { path: string; priority: number; freq: Freq }[] = [
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

  // Hindi is the only translation language today, so one lookup per section is
  // enough. The shape still generalises: `localized()` walks
  // TRANSLATION_LANGUAGES rather than hardcoding 'hi'.
  const HI = 'hi'

  const [
    articleSlugs, missionSlugs, learnSlugs, authorSlugs,
    hiArticleSlugs, hiMissionSlugs, hiLearnSlugs,
  ] = await Promise.all([
    getAllArticleSlugs().catch(() => []),
    getAllMissionSlugs().catch(() => []),
    getAllKnowledgeSlugs().catch(() => []),
    getAllAuthorSlugs().catch(() => []),
    getTranslatedArticleSlugs(HI).catch(() => []),
    getTranslatedMissionSlugs(HI).catch(() => []),
    getTranslatedKnowledgeSlugs(HI).catch(() => []),
  ])

  const hiArticles = new Set(hiArticleSlugs)
  const hiMissions = new Set(hiMissionSlugs)
  const hiLearn    = new Set(hiLearnSlugs)

  const staticRoutes = STATIC.flatMap(s => localized(s.path, { priority: s.priority, freq: s.freq }))

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...articleSlugs.flatMap(slug =>
      localized(`/article/${slug}`, { priority: 0.8, freq: 'weekly',  translated: hiArticles.has(slug) })),
    ...missionSlugs.flatMap(slug =>
      localized(`/mission/${slug}`, { priority: 0.6, freq: 'weekly',  translated: hiMissions.has(slug) })),
    ...learnSlugs.flatMap(slug =>
      localized(`/learn/${slug}`,   { priority: 0.6, freq: 'monthly', translated: hiLearn.has(slug) })),
    // Author pages have no translated counterpart.
    ...authorSlugs.map(slug => ({
      url: abs(`/authors/${slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.4,
    })),
  ]

  return [...staticRoutes, ...dynamicRoutes]
}
