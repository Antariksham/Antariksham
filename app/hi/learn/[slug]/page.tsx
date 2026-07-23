import type { Metadata }                from 'next'
import { notFound }                     from 'next/navigation'
import { getKnowledgeArticleBySlug }    from '@/modules/learn/services/getKnowledgeArticles'
import { buildKnowledgeMetadata }       from '@/modules/learn/services/knowledgeMetadata'
import { LearnArticlePage }             from '@/modules/learn/components/LearnArticlePage'
import 'katex/dist/katex.min.css'

const LANG = 'hi' as const

// Dynamic: which Hindi slugs exist depends on which translations are published,
// and the root layout reads headers() (see /articles/[slug] for the full note).
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getKnowledgeArticleBySlug(params.slug, LANG)
  if (!article) return { title: 'नहीं मिला' }
  return buildKnowledgeMetadata(article, LANG)
}

export default async function HindiLearnArticleRoute({ params }: Props) {
  const article = await getKnowledgeArticleBySlug(params.slug, LANG)
  if (!article) notFound()

  return <LearnArticlePage article={article} lang={LANG} />
}
