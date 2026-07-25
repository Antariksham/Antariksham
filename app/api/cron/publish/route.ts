import { NextRequest, NextResponse } from 'next/server'
import { runScheduledPublishing } from '@/modules/admin/services/adminArticles'
import { getAdminUser } from '@/modules/admin/services/getAdminUser'

export const dynamic = 'force-dynamic'

// GET/POST /api/cron/publish — promote due scheduled articles and archive
// expired ones. Meant to be called on a schedule by Vercel Cron (see
// vercel.json). Authorised by the CRON_SECRET env (Vercel sends it as a Bearer
// token); an authenticated admin may also trigger it manually from the panel.
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
