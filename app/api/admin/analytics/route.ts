import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics, type RangeKey } from '@/modules/admin/analytics/getAnalytics'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

const RANGES: RangeKey[] = ['day', 'week', 'month', 'year', 'custom']

// GET /api/admin/analytics?range=week[&from=ISO&to=ISO]
// Admin-only proxy that lets the dashboard refresh its data client-side when the
// range changes, without a full navigation.
export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const rangeParam = params.get('range') as RangeKey | null
  const range: RangeKey = rangeParam && RANGES.includes(rangeParam) ? rangeParam : 'week'
  const from = params.get('from') || undefined
  const to = params.get('to') || undefined

  try {
    const data = await getAnalytics(range, from, to)
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/admin/analytics:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
