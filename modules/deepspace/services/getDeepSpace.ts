import type { DeepSpaceProbe } from '@/types/api'

export interface DeepSpaceResponse {
  probes:    DeepSpaceProbe[]
  updatedAt: string
}

// Server-side initial fetch (for page.tsx SSR)
export async function getDeepSpaceProbes(): Promise<DeepSpaceResponse> {
  try {
    // During SSR on Vercel, use absolute URL via env or relative path
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/deep-space`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) throw new Error(`deep-space API error: ${res.status}`)

    const data = await res.json()
    return data as DeepSpaceResponse
  } catch (err) {
    console.error('getDeepSpaceProbes error:', err)
    // Return fallback static snapshot — fail-safe rule
    return {
      probes:    FALLBACK_PROBES,
      updatedAt: new Date().toISOString(),
    }
  }
}

// ── Fallback static data (shown if API fails) ─────────────────
const FALLBACK_PROBES: DeepSpaceProbe[] = [
  {
    id:                  'voyager-1',
    name:                'Voyager 1',
    agency:              'NASA',
    launchDate:          '1977-09-05',
    distanceFromEarth:   163.4,
    distanceFromSun:     163.5,
    velocity:            17.0,
    signalDelay:         22.6,
    missionPhase:        'Interstellar Mission',
    targetBody:          'Interstellar Space',
    communicationStatus: 'nominal',
    lastUpdated:         new Date().toISOString(),
  },
  {
    id:                  'voyager-2',
    name:                'Voyager 2',
    agency:              'NASA',
    launchDate:          '1977-08-20',
    distanceFromEarth:   135.9,
    distanceFromSun:     136.0,
    velocity:            15.4,
    signalDelay:         18.8,
    missionPhase:        'Interstellar Mission',
    targetBody:          'Interstellar Space',
    communicationStatus: 'nominal',
    lastUpdated:         new Date().toISOString(),
  },
  {
    id:                  'parker-solar-probe',
    name:                'Parker Solar Probe',
    agency:              'NASA',
    launchDate:          '2018-08-12',
    distanceFromEarth:   0.98,
    distanceFromSun:     0.046,
    velocity:            192.0,
    signalDelay:         0.09,
    missionPhase:        'Solar Encounter',
    targetBody:          'Sun',
    communicationStatus: 'nominal',
    lastUpdated:         new Date().toISOString(),
  },
  {
    id:                  'europa-clipper',
    name:                'Europa Clipper',
    agency:              'NASA',
    launchDate:          '2024-10-14',
    distanceFromEarth:   4.1,
    distanceFromSun:     4.8,
    velocity:            9.8,
    signalDelay:         0.57,
    missionPhase:        'Cruise Phase',
    targetBody:          'Europa (Jupiter Moon)',
    communicationStatus: 'nominal',
    lastUpdated:         new Date().toISOString(),
  },
  {
    id:                  'lucy',
    name:                'Lucy',
    agency:              'NASA',
    launchDate:          '2021-10-16',
    distanceFromEarth:   3.6,
    distanceFromSun:     4.1,
    velocity:            14.2,
    signalDelay:         0.50,
    missionPhase:        'Cruise Phase',
    targetBody:          'Trojan Asteroids',
    communicationStatus: 'nominal',
    lastUpdated:         new Date().toISOString(),
  },
]
