import { NextRequest, NextResponse } from 'next/server'
import { getAdminArticles, type AdminArticleQuery } from '@/modules/admin/services/adminArticles'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import type { ArticleStatus, ArticleType } from '@/types/article'
import type { SortKey, SortDir } from '@/modules/admin/search/articleSearch'

export const dynamic = 'force-dynamic'

const STATUSES: (ArticleStatus | 'all')[] = ['all', 'draft', 'published', 'scheduled', 'archived']
const TYPES: (ArticleType | 'all')[] = ['all', 'breaking-news', 'analysis', 'editorial', 'mission-update', 'research-breakdown', 'explainer', 'guide']
const SORTS: SortKey[] = ['updated', 'published', 'title', 'views', 'reading']

const numOrNull = (v: string | null): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// GET /api/admin/articles/list — paginated, filtered, sorted article list.
// Admin-only. Every filter runs in the database; the response is a single page,
// so the browser never pulls more than one page of rows no matter the corpus.
export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const p = request.nextUrl.searchParams
  const status = p.get('status') as ArticleStatus | 'all' | null
  const type = p.get('type') as ArticleType | 'all' | null
  const sort = p.get('sort') as SortKey | null
  const sortDir = p.get('sortDir') === 'asc' ? 'asc' : 'desc'

  const query: AdminArticleQuery = {
    page:       numOrNull(p.get('page')) ?? 1,
    perPage:    numOrNull(p.get('perPage')) ?? 25,
    status:     status && STATUSES.includes(status) ? status : 'all',
    type:       type && TYPES.includes(type) ? type : 'all',
    search:     p.get('search') || undefined,
    categoryId: p.get('categoryId') || null,
    tagId:      p.get('tagId') || null,
    authorId:   p.get('authorId') || null,
    featuredOnly: p.get('featuredOnly') === '1',
    viewsMin:   numOrNull(p.get('viewsMin')),
    viewsMax:   numOrNull(p.get('viewsMax')),
    readingMin: numOrNull(p.get('readingMin')),
    readingMax: numOrNull(p.get('readingMax')),
    dateFrom:   p.get('dateFrom') || null,
    dateTo:     p.get('dateTo') || null,
    sort:       sort && SORTS.includes(sort) ? sort : 'updated',
    sortDir:    sortDir as SortDir,
  }

  try {
    const result = await getAdminArticles(query)
    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/admin/articles/list:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
