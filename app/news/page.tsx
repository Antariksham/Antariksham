import { getArticles, getFeaturedArticles } from '@/modules/news/services/getArticles'
import { NewsPage } from '@/modules/news/components/NewsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Space News',
  description: 'Latest space news, mission updates, and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',
}

export const revalidate = 300

export default async function NewsRoute() {
  const [{ articles, total }, featured] = await Promise.all([
    getArticles({ page: 1, perPage: 12 }),
    getFeaturedArticles(7),
  ])

  return (
    <NewsPage
      articles={articles}
      featured={featured}
      total={total}
    />
  )
}
