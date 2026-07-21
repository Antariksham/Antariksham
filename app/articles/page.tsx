import { getArticles, getFeaturedArticles } from '@/modules/articles/services/getArticles'
import { ArticlesPage } from '@/modules/articles/components/ArticlesPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Articles',
  description: 'Space articles, mission updates, and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',
}

export const revalidate = 300

export default async function ArticlesRoute() {
  const [{ articles, total }, featured] = await Promise.all([
    getArticles({ page: 1, perPage: 12 }),
    getFeaturedArticles(7),
  ])

  return (
    <ArticlesPage
      articles={articles}
      featured={featured}
      total={total}
    />
  )
}
