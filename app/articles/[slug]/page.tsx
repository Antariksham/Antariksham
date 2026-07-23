import { getArticleBySlug, getAllArticleSlugs, getRelatedArticles } from '@/modules/articles/services/getArticles'
import { buildArticleMetadata } from '@/modules/articles/services/articleMetadata'
import { ArticleView } from '@/modules/articles/components/ArticleView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'en' as const

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs()
  return slugs.map(slug => ({ slug }))
}

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
