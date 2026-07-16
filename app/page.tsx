import type { Metadata }       from 'next'
import { siteConfig }          from '@/config/site'
import { HomePage }            from '@/modules/homepage/components/HomePage'
import { getLatestArticles }   from '@/modules/news/services/getArticles'
import { getFeaturedMissions } from '@/modules/missions/services/getMissions'

export const metadata: Metadata = {
  title:       siteConfig.seo.defaultTitle,
  description: siteConfig.description,
}

export const revalidate = 300

export default async function Page() {
  const [articles, missions] = await Promise.all([
    getLatestArticles(6),
    getFeaturedMissions(4),
  ])

  return <HomePage articles={articles} missions={missions} />
}
