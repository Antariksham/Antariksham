import { NextRequest, NextResponse } from 'next/server'
import { getArticles } from '@/modules/news/services/getArticles'

export const dynamic = 'force-dynamic'

// Paged feed of published articles for the /news infinite scroll. The first
// page is rendered on the server (SSR) for fast load + SEO; this route serves
// subsequent pages as the reader scrolls, so we never fetch everything at once.
export async function GET(req: NextRequest) {
  const page    = Math.max(1,  parseInt(req.nextUrl.searchParams.get('page')    || '1',  10) || 1)
  const perPage = Math.min(24, Math.max(1, parseInt(req.nextUrl.searchParams.get('perPage') || '12', 10) || 12))

  const { articles, total } = await getArticles({ page, perPage })
  return NextResponse.json({ articles, total, page })
}
