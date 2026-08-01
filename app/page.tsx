import type { Metadata }       from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { siteConfig }          from '@/config/site'
import { HomePage }            from '@/modules/homepage/components/HomePage'
import { getLatestArticles }   from '@/modules/articles/services/getArticles'
import { getActiveMissions }   from '@/modules/missions/services/getMissions'
import { buildWebSiteJsonLd, buildOrganizationJsonLd } from '@/modules/seo/jsonLd'

export const metadata: Metadata = buildPageMetadata({
  path:        '/',
  title:       siteConfig.seo.defaultTitle,
  description: siteConfig.description,
})

export const revalidate = 300

export default async function Page() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(6),
    // 6 fills the desktop grid (3 columns × 2 rows); mobile hides the last 2 (see responsive.css)
    getActiveMissions(6),
  ])

  return (
    <>
      {/* WebSite + Organization for the site as a whole. The SearchAction is the
          sitelinks searchbox — worth having now that the search behind it
          actually looks inside article bodies. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          buildWebSiteJsonLd(siteConfig),
          buildOrganizationJsonLd(siteConfig),
        ]) }}
      />
      <HomePage articles={articles} missions={missions} />
    </>
  )
}
