import type { Metadata }       from 'next'
import { siteConfig }          from '@/config/site'
import { HomePage }            from '@/modules/homepage/components/HomePage'
import { getLatestArticles }   from '@/modules/articles/services/getArticles'
import { getActiveMissions }   from '@/modules/missions/services/getMissions'
import { buildWebSiteJsonLd, buildOrganizationJsonLd } from '@/modules/seo/jsonLd'
import { localizedMetadata }   from '@/lib/pageMetadata'
import { translator }          from '@/lib/dictionaries'

const LANG = 'hi' as const
const t = translator(LANG)

export const metadata: Metadata = localizedMetadata({
  path:        '/',
  lang:        LANG,
  title:       t('page.home.title'),
  description: t('page.home.desc'),
})

export const revalidate = 300

export default async function HindiHomeRoute() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(6, LANG),
    // 6 fills the desktop grid (3 columns × 2 rows); mobile hides the last 2 (see responsive.css)
    getActiveMissions(6, LANG),
  ])

  return (
    <>
      {/* WebSite + Organization describe the site as a whole, so they are
          identical in every language and are emitted here too — a Hindi reader
          landing from search should get the same rich result the English home
          page produces. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          buildWebSiteJsonLd(siteConfig),
          buildOrganizationJsonLd(siteConfig),
        ]) }}
      />
      <HomePage articles={articles} missions={missions} lang={LANG} />
    </>
  )
}
