import { NextResponse } from 'next/server'
import { slimSearchResponse, sanitizeQuery } from '@/modules/gallery/services/nasaImages'

// Live proxy for the NASA Image and Video Library (images-api.nasa.gov) —
// NASA's official, keyless library API. Per-request query → never statically
// evaluated; results are cached in-memory for 10 minutes to be a polite
// upstream citizen.
export const dynamic = 'force-dynamic'
export const maxDuration = 10

const PAGE_SIZE = 24
const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_MAX_KEYS = 80

const cache = new Map<string, { ts: number; body: unknown }>()

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > CACHE_TTL_MS) { cache.delete(key); return null }
  return hit.body
}

function cacheSet(key: string, body: unknown) {
  if (cache.size >= CACHE_MAX_KEYS) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { ts: Date.now(), body })
}

// GET /api/gallery?q=…&page=… — slimmed image search results.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = sanitizeQuery(searchParams.get('q')) || 'space'
  const pageRaw = Number(searchParams.get('page'))
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 && pageRaw <= 100 ? pageRaw : 1

  const key = `${q}|${page}`
  const cached = cacheGet(key)
  if (cached) return NextResponse.json(cached)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const upstream =
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}` +
      `&media_type=image&page=${page}&page_size=${PAGE_SIZE}`
    const res = await fetch(upstream, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(`images-api -> ${res.status}`)
    const slim = slimSearchResponse(await res.json(), page)
    cacheSet(key, slim)
    return NextResponse.json(slim)
  } catch (err: any) {
    console.error('Gallery API error:', err)
    return NextResponse.json(
      { error: err?.message || 'image library unavailable' },
      { status: 503 },
    )
  } finally {
    clearTimeout(timer)
  }
}
