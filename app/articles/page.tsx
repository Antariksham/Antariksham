import { getArticles, getFeaturedArticles } from '@/modules/articles/services/getArticles'
import { getCategories } from '@/modules/articles/services/getCategories'
import { ArticlesPage } from '@/modules/articles/components/ArticlesPage'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  path:        '/articles',
  title:       'Articles',
  description: 'Space articles, mission updates, and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',
  languages: {
    en:          '/articles',
    hi:          '/hi/articles',
    'x-default': '/articles',
  },
})

export const revalidate = 300

export default async function ArticlesRoute() {
  const [{ articles, total }, featured, categories] = await Promise.all([
    getArticles({ page: 1, perPage: 12 }),
    getFeaturedArticles(7),
    getCategories(),
  ])

  return (
    <ArticlesPage
      articles={articles}
      featured={featured}
      total={total}
      categories={categories}
    />
  )
}
