import { getArticles, getFeaturedArticles } from '@/modules/articles/services/getArticles'
import { getCategories } from '@/modules/articles/services/getCategories'
import { ArticlesPage } from '@/modules/articles/components/ArticlesPage'
import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/pageMetadata'
import { translator } from '@/lib/dictionaries'

const LANG = 'hi' as const
const t = translator(LANG)

// Was a hand-written alternates block. Built from the path now, so this route
// cannot drift out of step with the other Hindi twins, and picks up og:locale.
export const metadata: Metadata = localizedMetadata({
  path:        '/articles',
  lang:        LANG,
  title:       t('page.articles.title'),
  description: t('page.articles.desc'),
})

export const revalidate = 300

export default async function HindiArticlesRoute() {
  const [{ articles, total }, featured, categories] = await Promise.all([
    getArticles({ page: 1, perPage: 12, lang: LANG }),
    getFeaturedArticles(7, LANG),
    getCategories(),
  ])

  return (
    <ArticlesPage
      articles={articles}
      featured={featured}
      total={total}
      categories={categories}
      lang={LANG}
    />
  )
}
