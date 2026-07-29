import { NextResponse } from 'next/server'
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'
import { getTLE, type TLE } from '@/modules/iss/services/tle'

// Live proxy — must never be statically evaluated at build time (a no-store
// upstream fetch during prerender throws DYNAMIC_SERVER_USAGE).
export const dynamic = 'force-dynamic'

// Cap the function so a slow upstream can't blow past Vercel's serverless limit
// (Hobby = 10s). In practice the per-request path is pure local math (the TLE
// fetch+cache lives in modules/iss/services/tle.ts), so this is just a safety
// net for the occasional TLE refresh.
export const maxDuration = 10

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
