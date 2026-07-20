import { NextRequest, NextResponse } from 'next/server'
import {
  updateSectionEnabled,
  updateSectionOrder,
  updateHeroConfig,
} from '@/modules/admin/services/adminHomepage'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

// PATCH /api/admin/homepage
// Body options:
//   { action: 'toggle',  id, enabled }
//   { action: 'reorder', id, sortOrder }
//   { action: 'hero',    config: HeroConfig }

export async function PATCH(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (body.action === 'toggle') {
      const ok = await updateSectionEnabled(body.id, Boolean(body.enabled))
      if (!ok) return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (body.action === 'reorder') {
      const ok = await updateSectionOrder(body.id, Number(body.sortOrder))
      if (!ok) return NextResponse.json({ error: 'Failed to reorder section' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (body.action === 'hero') {
      const ok = await updateHeroConfig(body.config)
      if (!ok) return NextResponse.json({ error: 'Failed to update hero' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('homepage API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
