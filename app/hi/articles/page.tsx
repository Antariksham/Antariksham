import { getArticles, getFeaturedArticles } from '@/modules/articles/services/getArticles'
import { ArticlesPage } from '@/modules/articles/components/ArticlesPage'
import type { Metadata } from 'next'

const LANG = 'hi' as const

export const metadata: Metadata = {
  title:       'लेख',
  description: 'नासा, इसरो, स्पेसएक्स, ईएसए और अन्य से अंतरिक्ष लेख, मिशन अपडेट और वैज्ञानिक खोजें।',
  alternates: {
    canonical: '/hi/articles',
    languages: {
      en:          '/articles',
      hi:          '/hi/articles',
      'x-default': '/articles',
    },
  },
}

export const revalidate = 300

export default async function HindiArticlesRoute() {
  const [{ articles, total }, featured] = await Promise.all([
    getArticles({ page: 1, perPage: 12, lang: LANG }),
    getFeaturedArticles(7, LANG),
  ])

  return (
    <ArticlesPage
      articles={articles}
      featured={featured}
      total={total}
      lang={LANG}
    />
  )
}
