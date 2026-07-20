import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminKnowledge,
  updateAdminKnowledge,
  deleteAdminKnowledge,
} from '@/modules/admin/services/adminKnowledge'
import { slugify } from '@/lib/utils'
import type { KnowledgePayload } from '@/modules/admin/services/adminKnowledge'
import type { DifficultyLevel } from '@/types/knowledge'
import { SlugConflictError } from '@/modules/admin/services/adminErrors'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

const LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced']

// POST /api/admin/learn — create
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = buildPayload(await request.json())
    if (!payload.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    const result = await createAdminKnowledge(payload)
    if (!result) return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/learn?id=xxx — update
export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const payload = buildPayload(await request.json())
    const ok = await updateAdminKnowledge(id, payload)
    if (!ok) return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/learn?id=xxx — delete
export async function DELETE(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const ok = await deleteAdminKnowledge(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SlugConflictError) return NextResponse.json({ error: err.message }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── Helper ────────────────────────────────────────────────────

function buildPayload(body: any): KnowledgePayload {
  const title = String(body.title || '').trim()
  const level = LEVELS.includes(body.difficultyLevel) ? body.difficultyLevel : 'beginner'
  return {
    title,
    slug:            String(body.slug || slugify(title)).trim(),
    excerpt:         String(body.excerpt || '').trim(),
    content:         String(body.content || '').trim(),
    difficultyLevel: level,
    icon:            String(body.icon || '🔭').trim(),
    thumbnail:       body.thumbnail ? String(body.thumbnail).trim() : null,
    relatedTopics:   Array.isArray(body.relatedTopics)
      ? body.relatedTopics.map((t: any) => String(t).trim()).filter(Boolean)
      : [],
    featured:        Boolean(body.featured),
  }
}
