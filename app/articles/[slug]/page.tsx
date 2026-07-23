import { getArticleBySlug, getRelatedArticles } from '@/modules/articles/services/getArticles'
import { buildArticleMetadata } from '@/modules/articles/services/articleMetadata'
import { ArticleView } from '@/modules/articles/components/ArticleView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'en' as const

// Rendered dynamically (per request). The root layout reads headers()
// (x-pathname), so this route can't be statically pre-rendered / ISR-revalidated
// without throwing DYNAMIC_SERVER_USAGE — which meant a newly-published article
// (not in the last build) 500'd on-demand. Dynamic rendering fixes that and
// keeps content + the shared view counter fresh on every view.
export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug, LANG)
  if (!article) return { title: 'Article Not Found' }
  return buildArticleMetadata(article, LANG)
}

export default async function ArticlePage(
  { params }: { params: { slug: string } }
) {
  const article = await getArticleBySlug(params.slug, LANG)
  if (!article) notFound()

  const related = await getRelatedArticles(article.id, 3, LANG)

  return <ArticleView article={article} related={related} lang={LANG} />
}
