import { getArticleBySlug, getRelatedArticles } from '@/modules/articles/services/getArticles'
import { buildArticleMetadata } from '@/modules/articles/services/articleMetadata'
import { ArticleView } from '@/modules/articles/components/ArticleView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'hi' as const

// Rendered dynamically (per request), NOT statically pre-generated. Two reasons:
//  1. The root layout reads headers() (x-pathname) — an on-demand *static* (ISR)
//     render of a not-pre-generated slug would throw DYNAMIC_SERVER_USAGE. Which
//     Hindi slugs exist depends on which translations are published, so they
//     can't all be pre-generated at build → this route must be dynamic.
//  2. Authors expect a freshly-written translation to appear immediately, with
//     no wait for revalidation.
export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug, LANG)
  if (!article) return { title: 'लेख नहीं मिला' }
  return buildArticleMetadata(article, LANG)
}

export default async function HindiArticlePage(
  { params }: { params: { slug: string } }
) {
  const article = await getArticleBySlug(params.slug, LANG)
  if (!article) notFound()

  const related = await getRelatedArticles(article.id, 3, LANG)

  return <ArticleView article={article} related={related} lang={LANG} />
}
