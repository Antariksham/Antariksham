import { getArticleBySlug, getTranslatedArticleSlugs, getRelatedArticles } from '@/modules/articles/services/getArticles'
import { buildArticleMetadata } from '@/modules/articles/services/articleMetadata'
import { ArticleView } from '@/modules/articles/components/ArticleView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'hi' as const

export const revalidate = 300

// Pre-render only the articles that actually have a published Hindi
// translation. Other slugs still resolve on demand (dynamicParams) and fall
// back to English content — handled in buildArticleMetadata (canonical +
// noindex) and getArticleBySlug (served language).
export async function generateStaticParams() {
  const slugs = await getTranslatedArticleSlugs(LANG)
  return slugs.map(slug => ({ slug }))
}

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
