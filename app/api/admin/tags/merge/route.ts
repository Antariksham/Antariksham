import { NextRequest, NextResponse } from 'next/server'
import { mergeTags, InvalidMergeError } from '@/modules/admin/services/adminTags'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

// POST /api/admin/tags/merge — fold one tag into another.
//
// Body: { sourceId, targetId }. Every article tagged with the source ends up
// tagged with the target, and the source tag is deleted. Its own route rather
// than a flag on POST /api/admin/tags, which already means "create".
//
// Returns how many join rows moved and how many were dropped as duplicates —
// the UI reports that back, because "3 articles moved" is the only way an
// author can tell the merge did what they meant.
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body     = await request.json()
    const sourceId = String(body?.sourceId ?? '')
    const targetId = String(body?.targetId ?? '')
    if (!sourceId || !targetId) {
      return NextResponse.json({ error: 'Both sourceId and targetId are required.' }, { status: 400 })
    }

    return NextResponse.json(await mergeTags(sourceId, targetId))
  } catch (err) {
    if (err instanceof InvalidMergeError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('POST /api/admin/tags/merge:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
