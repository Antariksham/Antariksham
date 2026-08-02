import type { Metadata }          from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { getKnowledgeArticles }   from '@/modules/learn/services/getKnowledgeArticles'
import { LearnPage }              from '@/modules/learn/components/LearnPage'

export const revalidate = 300

export const metadata: Metadata = buildPageMetadata({
  path:        '/learn',
  title:       'Learn',
  description: 'Deep-dive articles on orbital mechanics, astrophysics, black holes, relativity and the mathematics powering space exploration.',
  languages: {
    en:          '/learn',
    hi:          '/hi/learn',
    'x-default': '/learn',
  },
})

export default async function LearnRoute() {
  const articles = await getKnowledgeArticles()

  return <LearnPage articles={articles} />
}
