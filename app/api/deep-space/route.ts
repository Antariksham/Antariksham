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
// Uses VEC_TABLE=1 which outputs position + velocity ONLY:
//   X = 1.23E+02   Y =-4.56E+01   Z = 7.89E+00
//  VX= 1.23E-02   VY=-4.56E-03   VZ= 7.89E-04
// VEC_TABLE=2 adds LT/RG/RR fields whose values corrupt the VZ regex.
// VEC_TABLE=3 has a Julian Date CSV column that breaks positional parsing.
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

    // VEC_TABLE=1: labeled X/Y/Z/VX/VY/VZ format — position + velocity only
    const helioUrl = [
      'https://ssd.jpl.nasa.gov/api/horizons.api',
      '?format=json',
      `&COMMAND='${spkid}'`,
      `&CENTER='500@10'`,      // heliocentric (Sun centre)
      `&START_TIME='${start}'`,
      `&STOP_TIME='${stop}'`,
      `&STEP_SIZE='1d'`,
      `&MAKE_EPHEM='YES'`,
      `&EPHEM_TYPE='VECTORS'`,
      `&OUT_UNITS='AU-D'`,
      `&VEC_TABLE='1'`,        // position + velocity only — no LT/RG/RR fields that corrupt velocity regex
      `&OBJ_DATA='NO'`,
    ].join('')

    const helioRes = await fetch(helioUrl, { cache: 'no-store' })
    if (!helioRes.ok) return null

    const helioJson = await helioRes.json()
    const helioRaw  = (helioJson.result || '') as string

    // Extract $$SOE...$$EOE block
    const soeMatch = helioRaw.match(/\$\$SOE([\s\S]*?)\$\$EOE/)
    if (!soeMatch) return null

    const block = soeMatch[1]

    // VEC_TABLE=1 produces only X/Y/Z/VX/VY/VZ — no extra LT/RG/RR fields to confuse the regex.
    // Negative lookbehind (?<![A-Z]) ensures X/Y/Z don't match inside VX/VY/VZ.
    const xMatch  = block.match(/(?<![A-Z])X\s*=\s*([-+]?[\d.E]+)/i)
    const yMatch  = block.match(/(?<![A-Z])Y\s*=\s*([-+]?[\d.E]+)/i)
    const zMatch  = block.match(/(?<![A-Z])Z\s*=\s*([-+]?[\d.E]+)/i)
    const vxMatch = block.match(/VX\s*=\s*([-+]?[\d.E]+)/i)
    const vyMatch = block.match(/VY\s*=\s*([-+]?[\d.E]+)/i)
    const vzMatch = block.match(/VZ\s*=\s*([-+]?[\d.E]+)/i)

    // All six must match — if any fail, return null and use static fallback.
    // Never fall through to positional parsing: that path produced corrupt values
    // when VEC_TABLE=3 CSV timestamps were misread as coordinates.
    if (!xMatch || !yMatch || !zMatch || !vxMatch || !vyMatch || !vzMatch) {
      return null
    }

    const x  = parseFloat(xMatch[1])
    const y  = parseFloat(yMatch[1])
    const z  = parseFloat(zMatch[1])
    const vx = parseFloat(vxMatch[1])
    const vy = parseFloat(vyMatch[1])
    const vz = parseFloat(vzMatch[1])

    // Sanity check — all zeros means parse failed silently
    if (x === 0 && y === 0 && z === 0) return null

    // Distance from Sun (AU)
    const distFromSun = Math.sqrt(x * x + y * y + z * z)

    // Velocity: convert AU/day → km/s  (1 AU/day = 1731.4568 km/s)
    const velKms = Math.sqrt(vx * vx + vy * vy + vz * vz) * 1731.456_8

    // Distance from Earth: approximate heliocentric offset
    // Outer probes (>2 AU): distFromEarth ≈ distFromSun − 1 AU
    // Inner probes (<2 AU): distFromEarth ≈ |distFromSun − 1 AU|
    const distFromEarth =
      distFromSun > 2
        ? distFromSun - 1.0
        : Math.abs(distFromSun - 1.0)

    // Signal delay: 1 AU = 8.317 light-minutes → convert to hours
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
