import { NextRequest, NextResponse } from 'next/server'
import {
  getKnowledgeTranslation,
  upsertKnowledgeTranslation,
  deleteKnowledgeTranslation,
} from '@/modules/admin/services/adminKnowledgeTranslations'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { isLanguageCode, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

function parseParams(request: NextRequest): { id: string; lang: LanguageCode } | { error: string } {
  const id   = request.nextUrl.searchParams.get('id') || ''
  const lang = request.nextUrl.searchParams.get('lang') || ''
  if (!id) return { error: 'Missing id' }
  if (!isLanguageCode(lang)) return { error: 'Unsupported language' }
  if (lang === DEFAULT_LANGUAGE) return { error: 'English is edited on the article itself' }
  return { id, lang }
}

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })
  const translation = await getKnowledgeTranslation(p.id, p.lang)
  return NextResponse.json({ translation })
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const ok = await upsertKnowledgeTranslation(p.id, p.lang, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to save translation' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })
  const ok = await deleteKnowledgeTranslation(p.id, p.lang)
  if (!ok) return NextResponse.json({ error: 'Failed to delete translation' }, { status: 500 })
  return NextResponse.json({ success: true })
}
