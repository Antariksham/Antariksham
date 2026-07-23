import { NextResponse } from 'next/server'
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'

// Live proxy — must never be statically evaluated at build time (a no-store
// upstream fetch during prerender throws DYNAMIC_SERVER_USAGE).
export const dynamic = 'force-dynamic'

// Cap the function so a slow upstream can't blow past Vercel's serverless limit
// (Hobby = 10s). In practice the per-request path is pure local math (see below),
// so this is just a safety net for the occasional TLE refresh.
export const maxDuration = 10

// International Space Station (NORAD catalog number 25544)
const ISS_CATNR = 25544
const TLE_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_CATNR}&FORMAT=TLE`

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

interface TLE { line1: string; line2: string }

// Why TLE + local propagation instead of a live position API:
// the previous source (wheretheiss.at) takes ~12s per request — over Vercel's
// 10s function limit — so every call 504'd and the tracker showed "Signal Lost".
// Orbital elements (a TLE) stay accurate for days, so we fetch them from
// Celestrak at most every few hours and compute the current position locally
// with satellite.js on each request (sub-millisecond, no per-request network).
let tleCache: { tle: TLE; ts: number } | null = null
const TLE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours

async function fetchTLE(timeoutMs = 8000): Promise<TLE> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(TLE_URL, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(`celestrak -> ${res.status}`)
    const text  = await res.text()
    const lines = text.split('\n').map(l => l.trimEnd()).filter(Boolean)
    const line1 = lines.find(l => l.startsWith('1 '))
    const line2 = lines.find(l => l.startsWith('2 '))
    if (!line1 || !line2) throw new Error('celestrak: malformed TLE')
    return { line1, line2 }
  } finally {
    clearTimeout(timer)
  }
}

async function getTLE(): Promise<TLE> {
  const now = Date.now()
  if (tleCache && now - tleCache.ts < TLE_TTL_MS) return tleCache.tle
  try {
    const tle = await fetchTLE()
    tleCache = { tle, ts: now }
    return tle
  } catch (err) {
    // Celestrak blip — keep using the last TLE (valid for days) if we have one.
    if (tleCache) return tleCache.tle
    throw err
  }
}

function computePosition(tle: TLE) {
  const satrec = twoline2satrec(tle.line1, tle.line2)
  const now    = new Date()
  const pv     = propagate(satrec, now)
  if (!pv || !pv.position || !pv.velocity) throw new Error('propagation failed')

  const gmst = gstime(now)
  const geo  = eciToGeodetic(pv.position, gmst)
  const { x, y, z } = pv.velocity

  return {
    latitude:  degreesLat(geo.latitude),
    longitude: degreesLong(geo.longitude),
    altitude:  Math.round(geo.height),                       // km
    velocity:  Math.round(Math.sqrt(x * x + y * y + z * z) * 3600), // km/s -> km/h
    timestamp: Math.floor(now.getTime() / 1000),
  }
}

// GET /api/iss — computes live ISS position from a cached TLE, plus crew
export async function GET() {
  try {
    const position = computePosition(await getTLE())
    return NextResponse.json({ position, crew: CREW })
  } catch (err: any) {
    console.error('ISS API error:', err)
    return NextResponse.json(
      { error: err.message || 'ISS position unavailable' },
      { status: 503 }
    )
  }
}
