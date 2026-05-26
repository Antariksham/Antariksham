import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'  // never pre-render at build time

// ── Probe registry ────────────────────────────────────────────
// SPKID codes for NASA Horizons System
// Distances in AU from Horizons VECTORS ephemeris (heliocentric)
const PROBES = [
  {
    id:           'voyager-1',
    name:         'Voyager 1',
    spkid:        '-31',
    agency:       'NASA',
    launchDate:   '1977-09-05',
    targetBody:   'Interstellar Space',
    missionPhase: 'Interstellar Mission',
    communicationStatus: 'nominal' as const,
    // Fallback values (updated May 2026) — used if Horizons fails
    fallback: {
      distanceFromSun:   163.5,  // AU
      distanceFromEarth: 163.4,  // AU
      velocity:          17.0,   // km/s
      signalDelay:       22.6,   // hours one-way
    },
  },
  {
    id:           'voyager-2',
    name:         'Voyager 2',
    spkid:        '-32',
    agency:       'NASA',
    launchDate:   '1977-08-20',
    targetBody:   'Interstellar Space',
    missionPhase: 'Interstellar Mission',
    communicationStatus: 'nominal' as const,
    fallback: {
      distanceFromSun:   136.0,
      distanceFromEarth: 135.9,
      velocity:          15.4,
      signalDelay:       18.8,
    },
  },
  {
    id:           'parker-solar-probe',
    name:         'Parker Solar Probe',
    spkid:        '-96',
    agency:       'NASA',
    launchDate:   '2018-08-12',
    targetBody:   'Sun',
    missionPhase: 'Solar Encounter',
    communicationStatus: 'nominal' as const,
    fallback: {
      distanceFromSun:   0.046,
      distanceFromEarth: 0.98,
      velocity:          192.0,
      signalDelay:       0.09,
    },
  },
  {
    id:           'europa-clipper',
    name:         'Europa Clipper',
    spkid:        '-159',
    agency:       'NASA',
    launchDate:   '2024-10-14',
    targetBody:   'Europa (Jupiter Moon)',
    missionPhase: 'Cruise Phase',
    communicationStatus: 'nominal' as const,
    fallback: {
      distanceFromSun:   4.8,
      distanceFromEarth: 4.1,
      velocity:          9.8,
      signalDelay:       0.57,
    },
  },
  {
    id:           'lucy',
    name:         'Lucy',
    spkid:        '-49',
    agency:       'NASA',
    launchDate:   '2021-10-16',
    targetBody:   'Trojan Asteroids',
    missionPhase: 'Cruise Phase',
    communicationStatus: 'nominal' as const,
    fallback: {
      distanceFromSun:   4.1,
      distanceFromEarth: 3.6,
      velocity:          14.2,
      signalDelay:       0.50,
    },
  },
]

// ── Horizons vector fetch ──────────────────────────────────────
// Returns heliocentric state vectors for a probe at current epoch
async function fetchHorizonsVectors(spkid: string): Promise<{
  distanceFromSun:   number
  distanceFromEarth: number
  velocity:          number
  signalDelay:       number
} | null> {
  try {
    const now   = new Date()
    const start = now.toISOString().split('T')[0]
    const stop  = new Date(now.getTime() + 86_400_000).toISOString().split('T')[0]

    // Heliocentric vectors (CENTER = Sun)
    const helioUrl = [
      'https://ssd.jpl.nasa.gov/api/horizons.api',
      '?format=json',
      `&COMMAND='${spkid}'`,
      `&CENTER='500@10'`,      // Sun centre
      `&START_TIME='${start}'`,
      `&STOP_TIME='${stop}'`,
      `&STEP_SIZE='1d'`,
      `&MAKE_EPHEM='YES'`,
      `&EPHEM_TYPE='VECTORS'`,
      `&OUT_UNITS='AU-D'`,
      `&VEC_TABLE='3'`,        // position + velocity vectors
      `&OBJ_DATA='NO'`,
    ].join('')

    const helioRes = await fetch(helioUrl, {
      cache: 'no-store',  // always fresh — we cache at the component level
    })

    if (!helioRes.ok) return null

    const helioJson = await helioRes.json()
    const helioRaw  = (helioJson.result || '') as string

    // Parse $$SOE ... $$EOE block for vector data
    // Horizons VEC_TABLE=3 format per epoch:
    //   Line 0: JDTDB, CalendarDate(TDB), X, Y, Z, VX, VY, VZ
    //   (all on one CSV-like line, or split across 2 lines)
    // We use regex to extract named values directly — more robust than line indexing
    const soeMatch = helioRaw.match(/\$\$SOE([\s\S]*?)\$\$EOE/)
    if (!soeMatch) return null

    const block = soeMatch[1]

    // Try regex extraction of X,Y,Z,VX,VY,VZ values
    // Horizons outputs: X = 1.23E+02  Y = -4.56E+01  Z = 7.89E+00
    const xMatch  = block.match(/X\s*=\s*([\-\+\d\.E]+)/i)
    const yMatch  = block.match(/Y\s*=\s*([\-\+\d\.E]+)/i)
    const zMatch  = block.match(/Z\s*=\s*([\-\+\d\.E]+)/i)
    const vxMatch = block.match(/VX\s*=\s*([\-\+\d\.E]+)/i)
    const vyMatch = block.match(/VY\s*=\s*([\-\+\d\.E]+)/i)
    const vzMatch = block.match(/VZ\s*=\s*([\-\+\d\.E]+)/i)

    let x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0

    if (xMatch && yMatch && zMatch && vxMatch && vyMatch && vzMatch) {
      x  = parseFloat(xMatch[1])
      y  = parseFloat(yMatch[1])
      z  = parseFloat(zMatch[1])
      vx = parseFloat(vxMatch[1])
      vy = parseFloat(vyMatch[1])
      vz = parseFloat(vzMatch[1])
    } else {
      // Fallback: split lines and try positional parsing
      const lines = block.trim().split('\n').filter((l: string) => l.trim())
      if (lines.length < 2) return null
      // Find the line with numeric data (skip the date line)
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(/[\s,]+/)
        const nums  = parts.map((p: string) => parseFloat(p)).filter((n: number) => !isNaN(n))
        if (nums.length >= 6) {
          // First 3 are X Y Z, next 3 are VX VY VZ
          x = nums[0]; y = nums[1]; z = nums[2]
          vx = nums[3]; vy = nums[4]; vz = nums[5]
          break
        }
      }
    }

    if (x === 0 && y === 0 && z === 0) return null

    const distFromSun = Math.sqrt(x * x + y * y + z * z) // AU

    // Velocity: AU/day → km/s  (1 AU/day = 1731.46 km/s)
    const velKms = Math.sqrt(vx * vx + vy * vy + vz * vz) * 1731.456_8

    // Distance from Earth: approximate using Earth's heliocentric position
    // For simplicity, distFromEarth ≈ distFromSun (error < 1 AU for outer probes)
    // For inner probes we approximate as |distFromSun - 1 AU|
    const distFromEarth =
      distFromSun > 2
        ? distFromSun - 1.0 // rough approximation for outer probes
        : Math.abs(distFromSun - 1.0)

    // Signal delay: distance in AU × 8.317 minutes/AU → hours
    const signalDelayHours = (distFromEarth * 8.317) / 60

    return {
      distanceFromSun:   Math.round(distFromSun   * 1000) / 1000,
      distanceFromEarth: Math.round(distFromEarth * 1000) / 1000,
      velocity:          Math.round(velKms        * 10)   / 10,
      signalDelay:       Math.round(signalDelayHours * 100) / 100,
    }
  } catch {
    return null
  }
}

// ── Route handler ─────────────────────────────────────────────
export async function GET() {
  const results = await Promise.all(
    PROBES.map(async probe => {
      const live = await fetchHorizonsVectors(probe.spkid)

      const telemetry = live ?? probe.fallback

      return {
        id:                  probe.id,
        name:                probe.name,
        agency:              probe.agency,
        launchDate:          probe.launchDate,
        targetBody:          probe.targetBody,
        missionPhase:        probe.missionPhase,
        communicationStatus: probe.communicationStatus,
        distanceFromEarth:   telemetry.distanceFromEarth,
        distanceFromSun:     telemetry.distanceFromSun,
        velocity:            telemetry.velocity,
        signalDelay:         telemetry.signalDelay,
        liveData:            live !== null,
        lastUpdated:         new Date().toISOString(),
      }
    })
  )

  return NextResponse.json(
    { probes: results, updatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
      },
    }
  )
}
