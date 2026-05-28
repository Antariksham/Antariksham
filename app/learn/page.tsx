import type { Metadata }          from 'next'
import { getKnowledgeArticles }   from '@/modules/learn/services/getKnowledgeArticles'
import { LearnPage }              from '@/modules/learn/components/LearnPage'
import { siteConfig }             from '@/config/site'

export const revalidate = 300

export const metadata: Metadata = {
  title:       `Learn — ${siteConfig.name}`,
  description: 'Deep-dive articles on orbital mechanics, astrophysics, black holes, relativity and the mathematics powering space exploration.',
}

export default async function LearnRoute() {
  const articles = await getKnowledgeArticles()

  return <LearnPage articles={articles} />
}
