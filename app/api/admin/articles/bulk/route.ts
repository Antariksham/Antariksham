import { NextRequest, NextResponse } from 'next/server'
import {
  bulkUpdateStatus, bulkDeleteArticles, bulkAssignAuthor, bulkAddCategory, bulkAddTag,
} from '@/modules/admin/services/adminArticles'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import type { ArticleStatus } from '@/types/article'

const STATUSES: ArticleStatus[] = ['draft', 'published', 'scheduled', 'archived']

// POST /api/admin/articles/bulk — apply an action to many selected articles.
// Body: { action, ids: string[], value?: string }
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, ids, value } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No articles selected' }, { status: 400 })
    }
    const cleanIds = ids.filter((x: unknown): x is string => typeof x === 'string')

    let ok = false
    switch (action) {
      case 'status':
        if (!STATUSES.includes(value)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        ok = await bulkUpdateStatus(cleanIds, value)
        break
      case 'delete':      ok = await bulkDeleteArticles(cleanIds); break
      case 'author':      ok = await bulkAssignAuthor(cleanIds, String(value || '')); break
      case 'addCategory': ok = await bulkAddCategory(cleanIds, String(value || '')); break
      case 'addTag':      ok = await bulkAddTag(cleanIds, String(value || '')); break
      default:            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (!ok) return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 })
    return NextResponse.json({ success: true, count: cleanIds.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
