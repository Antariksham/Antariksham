import { NextRequest, NextResponse } from 'next/server'
import { runScheduledPublishing } from '@/modules/admin/services/adminArticles'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// GET/POST /api/cron/publish — promote due scheduled articles and archive
// expired ones. The AUTOMATIC transitions are handled inside Postgres by
// pg_cron (see supabase/migrations/*_article_scheduling.sql), so no external
// scheduler is required. This endpoint remains for a manual "run now": an
// authenticated admin, or a caller presenting the CRON_SECRET (e.g. an external
// uptime pinger) if you ever want to drive it from outside the database.
async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') || ''
    if (auth === `Bearer ${secret}`) return true
    if (req.nextUrl.searchParams.get('secret') === secret) return true
  }
  return !!(await getAdminUser())
}

async function run(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runScheduledPublishing()
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...result })
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
