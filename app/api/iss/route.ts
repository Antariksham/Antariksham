import { NextResponse } from 'next/server'

// Live proxy to wheretheiss.at via a no-store upstream fetch — must never be
// statically evaluated at build time. Without this, Next tries to prerender the
// handler, the no-store fetch throws DYNAMIC_SERVER_USAGE, and the catch below
// swallows that signal into a baked-in 500 response.
export const dynamic = 'force-dynamic'

// ISS_ID for the International Space Station on wheretheiss.at
const ISS_ID = 25544

// GET /api/iss — proxies ISS position and crew data
export async function GET() {
  try {
    // wheretheiss.at is reliable and returns lat, lng, altitude, velocity
    const posRes = await fetch(
      `https://api.wheretheiss.at/v1/satellites/${ISS_ID}`,
      { cache: 'no-store' }
    )

    if (!posRes.ok) throw new Error(`Position API error: ${posRes.status}`)

    const pos = await posRes.json()

    return NextResponse.json({
      position: {
        latitude:  pos.latitude,
        longitude: pos.longitude,
        altitude:  Math.round(pos.altitude),
        velocity:  Math.round(pos.velocity),
        timestamp: pos.timestamp,
      },
      // Crew data — hardcoded for now since open-notify is down
      // Update manually when crew changes
      crew: [
        { name: 'Oleg Kononenko',    craft: 'ISS' },
        { name: 'Nikolai Chub',      craft: 'ISS' },
        { name: 'Tracy Dyson',       craft: 'ISS' },
        { name: 'Matthew Dominick',  craft: 'ISS' },
        { name: 'Michael Barratt',   craft: 'ISS' },
        { name: 'Jeanette Epps',     craft: 'ISS' },
        { name: 'Alexander Grebenkin',craft: 'ISS' },
      ],
    })

  } catch (err: any) {
    console.error('ISS API error:', err)
    return NextResponse.json(
      { error: err.message || 'ISS API failed' },
      { status: 500 }
    )
  }
}
