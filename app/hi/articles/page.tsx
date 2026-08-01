import { getArticles, getFeaturedArticles } from '@/modules/articles/services/getArticles'
import { getCategories } from '@/modules/articles/services/getCategories'
import { ArticlesPage } from '@/modules/articles/components/ArticlesPage'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import type { Metadata } from 'next'

const LANG = 'hi' as const

export const metadata: Metadata = buildPageMetadata({
  path:        '/hi/articles',
  title:       'लेख',
  description: 'नासा, इसरो, स्पेसएक्स, ईएसए और अन्य से अंतरिक्ष लेख, मिशन अपडेट और वैज्ञानिक खोजें।',
  locale:      'hi_IN',
  languages: {
    en:          '/articles',
    hi:          '/hi/articles',
    'x-default': '/articles',
  },
  // No fallbackImagePath: the generated card's bundled font is Latin-only, so
  // a Devanagari headline would rasterise as empty boxes. The brand card, which
  // carries no page text, is the right default here.
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
