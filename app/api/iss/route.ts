import { NextResponse } from 'next/server'

// Live proxy to wheretheiss.at via a no-store upstream fetch — must never be
// statically evaluated at build time. Without this, Next tries to prerender the
// handler, the no-store fetch throws DYNAMIC_SERVER_USAGE, and the catch below
// swallows that signal into a baked-in 500 response.
export const dynamic = 'force-dynamic'

// ISS_ID for the International Space Station on wheretheiss.at
const ISS_ID = 25544

// Fallbacks for fields the secondary source (open-notify) doesn't return.
const AVG_ALTITUDE_KM = 408
const AVG_VELOCITY_KMH = 27600

// Crew — hardcoded for now since open-notify's crew feed is unreliable.
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

async function fetchJSON(url: string, timeoutMs = 7000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(`${url} -> ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchPosition(): Promise<ISSPosition> {
  // Primary: wheretheiss.at (gives altitude + velocity too).
  try {
    const p = await fetchJSON(`https://api.wheretheiss.at/v1/satellites/${ISS_ID}`)
    return {
      latitude:  p.latitude,
      longitude: p.longitude,
      altitude:  Math.round(p.altitude),
      velocity:  Math.round(p.velocity),
      timestamp: p.timestamp,
    }
  } catch {
    // Fallback: open-notify (lat/lng only; fill the rest with known averages).
    const o = await fetchJSON('https://api.open-notify.org/iss-now.json')
    return {
      latitude:  parseFloat(o.iss_position.latitude),
      longitude: parseFloat(o.iss_position.longitude),
      altitude:  AVG_ALTITUDE_KM,
      velocity:  AVG_VELOCITY_KMH,
      timestamp: o.timestamp,
    }
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
    const position = await fetchPosition()
    const payload: ISSPayload = { position, crew: CREW }
    cache = { payload, ts: now }
    return NextResponse.json(payload)
  } catch (err: any) {
    // Total upstream failure — serve the last good value (flagged stale) rather
    // than a hard error, so the tracker keeps showing the last known position.
    if (cache) {
      return NextResponse.json({ ...cache.payload, stale: true })
    }
    console.error('ISS API error:', err)
    return NextResponse.json(
      { error: err.message || 'ISS position unavailable' },
      { status: 503 }
    )
  }
}
