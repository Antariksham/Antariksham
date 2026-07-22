import { NextRequest, NextResponse } from 'next/server'
import {
  getArticleTranslation,
  upsertArticleTranslation,
  deleteArticleTranslation,
} from '@/modules/admin/services/adminArticleTranslations'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { isLanguageCode, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

// Resolve + validate the (articleId, lang) pair from the query string. English
// is never stored here — it lives on the articles row itself.
function parseParams(request: NextRequest): { articleId: string; lang: LanguageCode } | { error: string } {
  const articleId = request.nextUrl.searchParams.get('articleId') || ''
  const langParam = request.nextUrl.searchParams.get('lang') || ''
  if (!articleId) return { error: 'Missing articleId' }
  if (!isLanguageCode(langParam)) return { error: 'Unsupported language' }
  if (langParam === DEFAULT_LANGUAGE) return { error: 'English is edited on the article itself, not as a translation' }
  return { articleId, lang: langParam }
}

// GET /api/admin/articles/translations?articleId=&lang= — load one translation
export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })

  const translation = await getArticleTranslation(p.articleId, p.lang)
  return NextResponse.json({ translation })
}

// PUT /api/admin/articles/translations?articleId=&lang= — create/update
export async function PUT(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })

  try {
    const body = await request.json()
    const payload = {
      title:       String(body.title   || '').trim(),
      excerpt:     String(body.excerpt || '').trim(),
      content:     String(body.content || '').trim(),
      isPublished: Boolean(body.isPublished),
    }
    if (!payload.title)   return NextResponse.json({ error: 'Title is required.' },   { status: 400 })
    if (!payload.content) return NextResponse.json({ error: 'Content is required.' }, { status: 400 })

    const ok = await upsertArticleTranslation(p.articleId, p.lang, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to save translation' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/articles/translations?articleId=&lang= — remove a translation
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })

  const ok = await deleteArticleTranslation(p.articleId, p.lang)
  if (!ok) return NextResponse.json({ error: 'Failed to delete translation' }, { status: 500 })
  return NextResponse.json({ success: true })
}
