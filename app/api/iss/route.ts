import { NextResponse } from 'next/server'

// Live proxy to wheretheiss.at via a no-store upstream fetch — must never be
// statically evaluated at build time. Without this, Next tries to prerender the
// handler, the no-store fetch throws DYNAMIC_SERVER_USAGE, and the catch below
// swallows that signal into a baked-in 500 response.
export const dynamic = 'force-dynamic'

// Cap the function so a slow upstream can't blow past Vercel's serverless limit
// (Hobby = 10s). The internal fetch timeout below (8s) is the real guarantee.
export const maxDuration = 10

// ISS_ID for the International Space Station on wheretheiss.at
const ISS_ID = 25544

// Crew — hardcoded for now (open-notify's crew feed is defunct).
// Update manually on crew rotation.
const CREW = [
  { name: 'Oleg Kononenko',     craft: 'ISS' },
  { name: 'Nikolai Chub',       craft: 'ISS' },
  { name: 'Tracy Dyson',        craft: 'ISS' },
  { name: 'Matthew Dominick',   craft: 'ISS' },
  { name: 'Michael Barratt',    craft: 'ISS' },
  { name: 'Jeanette Epps',      craft: 'ISS' },
  { name: 'Alexander Grebenkin', craft: 'ISS' },
]

interface ISSPosition {
  latitude:  number
  longitude: number
  altitude:  number
  velocity:  number
  timestamp: number
}
interface ISSPayload {
  position: ISSPosition
  crew:     { name: string; craft: string }[]
  stale?:   boolean
}

// Module-level last-good cache. On a warm serverless instance this both throttles
// the upstream (wheretheiss.at rate-limits ~1 req/s per IP, and every visitor's
// 5s poll funnels through Vercel's shared egress IP) and provides a fallback when
// the upstream blips — the two causes of the intermittent "Signal Lost".
let cache: { payload: ISSPayload; ts: number } | null = null
// ISS moves ~7.6 km/s, so a 4s cache is ~30km off — negligible on a world map.
const CACHE_TTL_MS = 4000
// Serve the last-good position (flagged stale) for up to this long when the
// upstream is failing, so brief trouble shows the last location instead of going
// dark. Beyond this it's genuinely lost (the orbit is ~90 min), so we 503.
const STALE_MAX_MS = 60_000

// NOTE: the previous open-notify fallback was removed — that service is defunct
// (connection reset), so it never helped and its ~11s hang could push the whole
// function past Vercel's 10s limit, causing a 504. wheretheiss.at is the single
// source; resilience comes from the cache + stale-serving below.
async function fetchISS(timeoutMs = 8000): Promise<ISSPosition> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`https://api.wheretheiss.at/v1/satellites/${ISS_ID}`, {
      cache:   'no-store',
      signal:  ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`wheretheiss.at -> ${res.status}`)
    const p = await res.json()
    return {
      latitude:  p.latitude,
      longitude: p.longitude,
      altitude:  Math.round(p.altitude),
      velocity:  Math.round(p.velocity),
      timestamp: p.timestamp,
    }
  } finally {
    clearTimeout(timer)
  }
}

// GET /api/iss — proxies ISS position and crew data
export async function GET() {
  const now = Date.now()

  // Serve a fresh cached value without touching the upstream (throttle).
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload)
  }

  try {
    const position = await fetchISS()
    const payload: ISSPayload = { position, crew: CREW }
    cache = { payload, ts: now }
    return NextResponse.json(payload)
  } catch (err: any) {
    // Upstream slow/blocked — serve the last good value (flagged stale) so the UI
    // keeps the last known position, unless it's too old to be meaningful.
    if (cache && now - cache.ts < STALE_MAX_MS) {
      return NextResponse.json({ ...cache.payload, stale: true })
    }
    console.error('ISS API error:', err)
    return NextResponse.json(
      { error: err.message || 'ISS position unavailable' },
      { status: 503 }
    )
  }
}
