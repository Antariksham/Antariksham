import { NextRequest, NextResponse } from 'next/server'
import {
  getMissionTranslation,
  upsertMissionTranslation,
  deleteMissionTranslation,
} from '@/modules/admin/services/adminMissionTranslations'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'
import { isLanguageCode, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

function parseParams(request: NextRequest): { id: string; lang: LanguageCode } | { error: string } {
  const id   = request.nextUrl.searchParams.get('id') || ''
  const lang = request.nextUrl.searchParams.get('lang') || ''
  if (!id) return { error: 'Missing id' }
  if (!isLanguageCode(lang)) return { error: 'Unsupported language' }
  if (lang === DEFAULT_LANGUAGE) return { error: 'English is edited on the mission itself' }
  return { id, lang }
}

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })
  const translation = await getMissionTranslation(p.id, p.lang)
  return NextResponse.json({ translation })
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = parseParams(request)
  if ('error' in p) return NextResponse.json({ error: p.error }, { status: 400 })
  try {
    const body = await request.json()
    const payload = {
      name:        String(body.name        || '').trim(),
      description: String(body.description || '').trim(),
      isPublished: Boolean(body.isPublished),
    }
    if (!payload.name)        return NextResponse.json({ error: 'Name is required.' },        { status: 400 })
    if (!payload.description) return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    const ok = await upsertMissionTranslation(p.id, p.lang, payload)
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
  const ok = await deleteMissionTranslation(p.id, p.lang)
  if (!ok) return NextResponse.json({ error: 'Failed to delete translation' }, { status: 500 })
  return NextResponse.json({ success: true })
}
