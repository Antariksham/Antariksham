import type { Metadata }                  from 'next'
import { notFound }                       from 'next/navigation'
import { getKnowledgeArticleBySlug,
         getAllKnowledgeSlugs }            from '@/modules/learn/services/getKnowledgeArticles'
import { LearnArticlePage }               from '@/modules/learn/components/LearnArticlePage'
import { siteConfig }                     from '@/config/site'

export const revalidate = 300

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const slugs = await getAllKnowledgeSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getKnowledgeArticleBySlug(params.slug)
  if (!article) return { title: 'Not Found' }

  return {
    title:       `${article.title} — ${siteConfig.name}`,
    description: article.excerpt,
  }
}

export default async function LearnArticleRoute({ params }: Props) {
  const article = await getKnowledgeArticleBySlug(params.slug)
  if (!article) notFound()

  return <LearnArticlePage article={article} />
}
