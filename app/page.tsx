import type { Metadata }       from 'next'
import { siteConfig }          from '@/config/site'
import { HomePage }            from '@/modules/homepage/components/HomePage'
import { getLatestArticles }   from '@/modules/news/services/getArticles'
import { getActiveMissions }   from '@/modules/missions/services/getMissions'

export const metadata: Metadata = {
  title:       siteConfig.seo.defaultTitle,
  description: siteConfig.description,
}

export const revalidate = 300

export default async function Page() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(6),
    // 6 fills the desktop grid (3 columns × 2 rows); mobile hides the last 2 (see responsive.css)
    getActiveMissions(6),
  ])

  return <HomePage articles={articles} missions={missions} />
}
