import type { DeepSpaceProbe } from '@/types/api'

export interface DeepSpaceResponse {
  probes:    DeepSpaceProbe[]
  updatedAt: string
}

// ── Static fallback data ───────────────────────────────────────
// Used for SSR initial render — client refreshes from /api/deep-space
// Values accurate as of May 2026
const STATIC_PROBES: DeepSpaceProbe[] = [
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
    lastUpdated:         '2026-05-25T00:00:00.000Z',
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
    lastUpdated:         '2026-05-25T00:00:00.000Z',
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
    lastUpdated:         '2026-05-25T00:00:00.000Z',
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
    lastUpdated:         '2026-05-25T00:00:00.000Z',
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
    lastUpdated:         '2026-05-25T00:00:00.000Z',
  },
  {
    id:                  'new-horizons',
    name:                'New Horizons',
    agency:              'NASA',
    launchDate:          '2006-01-19',
    distanceFromEarth:   60.8,
    distanceFromSun:     61.5,
    velocity:            13.9,
    signalDelay:         8.43,
    missionPhase:        'Extended Mission — Kuiper Belt',
    targetBody:          'Kuiper Belt',
    communicationStatus: 'nominal',
    lastUpdated:         '2026-05-25T00:00:00.000Z',
  },
  {
    id:                  'juice',
    name:                'JUICE',
    agency:              'ESA',
    launchDate:          '2023-04-14',
    distanceFromEarth:   1.1,
    distanceFromSun:     1.6,
    velocity:            20.0,
    signalDelay:         0.15,
    missionPhase:        'Cruise Phase',
    targetBody:          'Jupiter (Ganymede)',
    communicationStatus: 'nominal',
    lastUpdated:         '2026-05-25T00:00:00.000Z',
  },
]

// Returns static data for SSR — no network call, no hydration risk.
// The client component fetches live data from /api/deep-space after mount.
export function getDeepSpaceProbes(): DeepSpaceResponse {
  return {
    probes:    STATIC_PROBES,
    updatedAt: '2026-05-25T00:00:00.000Z',
  }
}
