import { NextRequest, NextResponse } from 'next/server'
import { getMissions } from '@/modules/missions/services/getMissions'

export const dynamic = 'force-dynamic'

// Paged feed of missions for the /missions infinite scroll. The first page is
// server-rendered (SSR) for fast load + SEO; this serves later pages as the
// reader scrolls, so we never fetch every mission at once.
export async function GET(req: NextRequest) {
  const page    = Math.max(1,  parseInt(req.nextUrl.searchParams.get('page')    || '1',  10) || 1)
  const perPage = Math.min(24, Math.max(1, parseInt(req.nextUrl.searchParams.get('perPage') || '12', 10) || 12))

  const { missions, total } = await getMissions({ page, perPage })
  return NextResponse.json({ missions, total, page })
}
