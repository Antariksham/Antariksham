import { NextResponse } from 'next/server'
import { twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles } from 'satellite.js'
import { getTLE } from '@/modules/iss/services/tle'
import { findPasses, type LookSample } from '@/modules/explore/services/issPasses'
import { sunAltitudeDeg, sunEquatorial, sunTimes } from '@/modules/explore/services/skyTonight.ts'

// Live proxy (per-request query → never statically evaluated).
export const dynamic = 'force-dynamic'
export const maxDuration = 10

const DEG = Math.PI / 180
const EARTH_RADIUS_KM = 6371
const SCAN_HOURS = 48
const MIN_ELEV_DEG = 10

/**
 * GET /api/iss/passes?lat=…&lon=…
 *
 * Upcoming ISS passes for an observer. Privacy: coordinates are rounded to
 * one decimal (~11 km) — pass times shift by only seconds across that
 * distance — and are used transiently for the computation, never stored.
 * ~5,800 SGP4 propagations (48 h at 30 s steps) run in a few hundred ms.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'valid lat & lon query params required' }, { status: 400 })
  }
  const latDeg = Math.round(lat * 10) / 10
  const lonDeg = Math.round(lon * 10) / 10

  try {
    const tle = await getTLE()
    const satrec = twoline2satrec(tle.line1, tle.line2)
    const observerGd = { latitude: latDeg * DEG, longitude: lonDeg * DEG, height: 0 }

    const positionAt = (ms: number) => {
      const pv = propagate(satrec, new Date(ms))
      const pos = pv?.position
      return !pos || typeof pos === 'boolean' ? null : pos
    }

    const lookAt = (ms: number): LookSample | null => {
      const pos = positionAt(ms)
      if (!pos) return null
      const look = ecfToLookAngles(observerGd, eciToEcf(pos, gstime(new Date(ms))))
      return { elevDeg: look.elevation / DEG, azDeg: look.azimuth / DEG }
    }

    /** ISS in sunlight (outside Earth's shadow cylinder) at `ms`? */
    const sunlitAt = (ms: number): boolean => {
      const pos = positionAt(ms)
      if (!pos) return false
      // Unit vector to the Sun in the equatorial frame (≈ TEME — plenty here).
      const { raDeg, decDeg } = sunEquatorial(ms)
      const ra = raDeg * DEG, dec = decDeg * DEG
      const sx = Math.cos(dec) * Math.cos(ra)
      const sy = Math.cos(dec) * Math.sin(ra)
      const sz = Math.sin(dec)
      const dot = pos.x * sx + pos.y * sy + pos.z * sz
      if (dot > 0) return true // day side of Earth
      const r2 = pos.x * pos.x + pos.y * pos.y + pos.z * pos.z
      return Math.sqrt(Math.max(0, r2 - dot * dot)) > EARTH_RADIUS_KM
    }

    const now = Date.now()
    const passes = findPasses(lookAt, now, SCAN_HOURS, 30, MIN_ELEV_DEG).map(p => ({
      ...p,
      // Visible = the Station is sunlit while the observer's sky is dark.
      visible: sunlitAt(p.maxElevMs) && sunAltitudeDeg(p.maxElevMs, latDeg, lonDeg) < -6,
    }))

    const sun = sunTimes(now, latDeg, lonDeg)
    return NextResponse.json({
      passes,
      sun,
      scanHours: SCAN_HOURS,
      minElevDeg: MIN_ELEV_DEG,
      generatedAt: now,
    })
  } catch (err: any) {
    console.error('ISS passes API error:', err)
    return NextResponse.json(
      { error: err.message || 'pass prediction unavailable' },
      { status: 503 },
    )
  }
}
