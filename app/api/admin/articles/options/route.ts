import { NextResponse } from 'next/server'
import { getFormOptions } from '@/modules/admin/services/adminArticles'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// GET /api/admin/articles/options — the categories / tags / authors the Article
// Browser needs for its filter chips and bulk-action selects. Admin-only. Split
// out so the browser can fetch it client-side (the list is fully CSR).
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await getFormOptions())
  } catch (err) {
    console.error('GET /api/admin/articles/options:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
