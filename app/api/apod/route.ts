import { NextResponse } from 'next/server'
import {
  APOD_EPOCH, isIsoDate, slimApodResponse,
} from '@/modules/nasa/services/apodArchive'

// Live proxy for NASA's APOD archive (api.nasa.gov). Per-request query →
// never statically evaluated. NASA_API_KEY stays server-side.
export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * Past windows are immutable once published, so they can be cached hard;
 * the open-ended "latest" window gains an entry each day.
 */
const TTL_CLOSED_MS = 24 * 60 * 60 * 1000
const TTL_OPEN_MS   = 60 * 60 * 1000
const CACHE_MAX_KEYS = 60
/** Widest span a single request may ask NASA for. */
const MAX_SPAN_DAYS = 60

const cache = new Map<string, { ts: number; ttl: number; body: unknown }>()

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > hit.ttl) { cache.delete(key); return null }
  return hit.body
}

function cacheSet(key: string, body: unknown, ttl: number) {
  if (cache.size >= CACHE_MAX_KEYS) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { ts: Date.now(), ttl, body })
}

/**
 * GET /api/apod?start=YYYY-MM-DD[&end=YYYY-MM-DD]
 *
 * Returns `{ items }` newest-first. `end` is optional and should be omitted
 * for the newest page: NASA 400s on any end_date past its latest entry
 * (its "today" follows US Eastern), so an open end is the safe way to ask
 * for "everything through the most recent APOD".
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const endRaw = searchParams.get('end')

  if (!isIsoDate(start) || start < APOD_EPOCH) {
    return NextResponse.json(
      { error: `start must be an ISO date on or after ${APOD_EPOCH}` },
      { status: 400 },
    )
  }
  const end = endRaw === null || endRaw === '' ? null : endRaw
  if (end !== null && (!isIsoDate(end) || end < start)) {
    return NextResponse.json({ error: 'end must be an ISO date not before start' }, { status: 400 })
  }
  if (end !== null) {
    const span = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000
    if (span > MAX_SPAN_DAYS) {
      return NextResponse.json({ error: `range may not exceed ${MAX_SPAN_DAYS} days` }, { status: 400 })
    }
  }

  const key = `${start}|${end ?? ''}`
  const cached = cacheGet(key)
  if (cached) return NextResponse.json(cached)

  const apiKey = process.env.NASA_API_KEY
  if (!apiKey) {
    console.error('APOD archive: NASA_API_KEY not set')
    return NextResponse.json({ error: 'APOD archive is not configured' }, { status: 503 })
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const upstream = new URL('https://api.nasa.gov/planetary/apod')
    upstream.searchParams.set('api_key', apiKey)
    upstream.searchParams.set('start_date', start)
    if (end) upstream.searchParams.set('end_date', end)
    // Supplies `thumbnail_url` for video entries, which have no still image.
    upstream.searchParams.set('thumbs', 'true')

    const res = await fetch(upstream, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(`apod -> ${res.status}`)

    const body = { items: slimApodResponse(await res.json()) }
    cacheSet(key, body, end === null ? TTL_OPEN_MS : TTL_CLOSED_MS)
    return NextResponse.json(body)
  } catch (err: any) {
    console.error('APOD archive error:', err)
    return NextResponse.json(
      { error: err?.message || 'APOD archive unavailable' },
      { status: 503 },
    )
  } finally {
    clearTimeout(timer)
  }
}
