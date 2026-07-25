import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { classifyReferrer, deviceFromUA } from '@/modules/admin/analytics/analytics'

export const dynamic = 'force-dynamic'

// POST /api/analytics/collect — record a page event (view / read / share /
// bookmark). Public + privacy-friendly: the client sends only opaque ids +
// scroll/dwell; the server derives device (UA), referrer type + host, and
// country (edge geo header). Always returns 200 so a beacon never retries.
const TYPES = new Set(['view', 'read', 'share', 'bookmark'])
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const clampInt = (v: unknown, lo: number, hi: number) => {
  const x = Math.round(Number(v))
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : 0
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !TYPES.has(body.type)) return NextResponse.json({ ok: false }, { status: 200 })

    const articleId = str(body.articleId, 64)
    if (!articleId) return NextResponse.json({ ok: false }, { status: 200 })

    // Prefer the client-sent document.referrer (the external page that linked
    // here); the Referer header on a beacon is just the current page.
    let refHost = ''
    try { refHost = new URL(str(body.referrer, 512) || req.headers.get('referer') || '').host } catch { refHost = '' }
    const selfHost = req.headers.get('host') || ''
    const ua = req.headers.get('user-agent') || ''
    const country = (req.headers.get('x-vercel-ip-country') || '').slice(0, 2)

    const row = {
      article_id: articleId,
      type:       body.type,
      visitor:    str(body.visitor, 64),
      session:    str(body.session, 64),
      device:     deviceFromUA(ua),
      ref_type:   classifyReferrer(refHost, selfHost),
      referrer:   refHost.slice(0, 128),
      country,
      scroll_pct: clampInt(body.scrollPct, 0, 100),
      dwell_ms:   clampInt(body.dwellMs, 0, 3_600_000),
      path:       str(body.path, 256),
    }

    const { error } = await supabaseAdmin().from('article_events').insert(row)
    if (error) console.error('analytics/collect:', error.message)
    return NextResponse.json({ ok: !error }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
