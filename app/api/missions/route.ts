import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/modules/missions/services/getMissions'
import type { MissionStatus } from '@/types/mission'

// Dynamic (reads searchParams), but public read-only data — cache it at the CDN
// edge so scroll/pagination bursts don't hammer the database.
const CACHE = 'public, s-maxage=60, stale-while-revalidate=300'

// Paged feed of missions for the /missions infinite scroll. The first page is
// server-rendered (SSR) for fast load + SEO; this serves later pages as the
// reader scrolls, so we never fetch every mission at once.
export async function GET(req: NextRequest) {
  const page    = Math.max(1,  parseInt(req.nextUrl.searchParams.get('page')    || '1',  10) || 1)
  const perPage = Math.min(24, Math.max(1, parseInt(req.nextUrl.searchParams.get('perPage') || '12', 10) || 12))
  const status  = req.nextUrl.searchParams.get('status') || undefined

  const { missions, total } = await getMissions({ page, perPage, status: status as MissionStatus | undefined })
  return NextResponse.json({ missions, total, page }, { headers: { 'Cache-Control': CACHE } })
}
