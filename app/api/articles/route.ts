import { NextRequest, NextResponse } from 'next/server'
import { getArticles } from '@/modules/articles/services/getArticles'
import { isLanguageCode, DEFAULT_LANGUAGE } from '@/lib/i18n'
import type { ArticleCategory } from '@/types/article'

// Dynamic (reads searchParams), but public read-only data — cache it at the CDN
// edge so scroll/pagination bursts don't hammer the database.
const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

// Paged feed of published articles for the /articles infinite scroll. The first
// page is rendered on the server (SSR) for fast load + SEO; this route serves
// subsequent pages as the reader scrolls, so we never fetch everything at once.
export async function GET(req: NextRequest) {
  const page    = Math.max(1,  parseInt(req.nextUrl.searchParams.get('page')    || '1',  10) || 1)
  const perPage = Math.min(24, Math.max(1, parseInt(req.nextUrl.searchParams.get('perPage') || '12', 10) || 12))
  const category = req.nextUrl.searchParams.get('category') || undefined
  const langParam = req.nextUrl.searchParams.get('lang') || ''
  const lang = isLanguageCode(langParam) ? langParam : DEFAULT_LANGUAGE

  const { articles, total } = await getArticles({ page, perPage, category: category as ArticleCategory | undefined, lang })
  return NextResponse.json({ articles, total, page }, { headers: { 'Cache-Control': CACHE } })
}
