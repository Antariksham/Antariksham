/**
 * Sky Tonight astronomy — Moon phase, planet visibility windows, and Sun
 * geometry, built on the same JPL elements as the orrery (`orrery.ts`).
 *
 * Pure and DOM-free (unit-tested with node:test, validated against known
 * new/full-moon dates), and deterministic for a given epoch so SSR and
 * client hydration always agree. Accuracy notes per function — everything
 * here is display-grade (arcminutes to a couple of degrees), not
 * ephemeris-grade, which is exactly what a "what's up tonight" page needs.
 */

// Explicit .ts extension (allowImportingTsExtensions): unlike the other pure
// modules this one genuinely depends on the orrery math at runtime, and the
// extension keeps it resolvable by Node's type-stripping test runner.
import { PLANET_ELEMENTS, helioPosition, julianCenturies, normalizeDeg, J2000_MS } from './orrery.ts'

const DEG = Math.PI / 180
export const SYNODIC_MONTH_DAYS = 29.530588

/** Mean obliquity of the ecliptic, deg (J2000 — drift is negligible here). */
const OBLIQUITY = 23.4393

const daysSinceJ2000 = (epochMs: number) => (epochMs - J2000_MS) / 86_400_000

/** Geocentric ecliptic longitude of the Sun, deg (Earth's helio lon + 180). */
export function sunGeoLongitude(epochMs: number): number {
  return normalizeDeg(helioPosition(PLANET_ELEMENTS.earth, epochMs).lonDeg + 180)
}

/**
 * Geocentric ecliptic longitude of the Moon, deg. Mean longitude plus the
 * equation of centre (the Moon's dominant inequality) — good to ~1–2°.
 */
export function moonGeoLongitude(epochMs: number): number {
  const d = daysSinceJ2000(epochMs)
  const L = 218.316 + 13.176396 * d          // mean longitude
  const M = (134.963 + 13.064993 * d) * DEG  // mean anomaly
  return normalizeDeg(L + 6.289 * Math.sin(M))
}

// ── Moon phase ────────────────────────────────────────────────

export type MoonPhaseName =
  | 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
  | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent'

export interface MoonPhase {
  /** Moon − Sun elongation, deg, [0, 360). 0 = new, 180 = full. */
  elongationDeg: number
  /** Fraction of the disc illuminated, 0..1. */
  illumination:  number
  /** Days since new moon (0..29.53). */
  ageDays:       number
  waxing:        boolean
  name:          MoonPhaseName
}

const PHASE_NAMES: MoonPhaseName[] = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
]

export function moonPhase(epochMs: number): MoonPhase {
  const elong = normalizeDeg(moonGeoLongitude(epochMs) - sunGeoLongitude(epochMs))
  const illumination = (1 - Math.cos(elong * DEG)) / 2
  const ageDays = (elong / 360) * SYNODIC_MONTH_DAYS
  // Octiles centred on the principal phases: [−22.5°, +22.5°) → New, etc.
  const name = PHASE_NAMES[Math.floor(normalizeDeg(elong + 22.5) / 45)]
  return { elongationDeg: elong, illumination, ageDays, waxing: elong < 180, name }
}

/**
 * Next time the Moon reaches the given principal phase, scanning forward in
 * 1-hour steps (±1 h accuracy — plenty for "next full moon: 28 Aug").
 */
export function nextMoonEvent(epochMs: number, target: 'new' | 'full'): number {
  const targetDeg = target === 'new' ? 0 : 180
  const stepMs = 3_600_000
  let prev = normalizeDeg(moonPhase(epochMs).elongationDeg - targetDeg)
  for (let t = epochMs + stepMs; t <= epochMs + 32 * 86_400_000; t += stepMs) {
    const cur = normalizeDeg(moonPhase(t).elongationDeg - targetDeg)
    // Elongation-relative angle grows monotonically (~0.5°/h) and wraps
    // 360 → 0 exactly at the target phase.
    if (cur < prev) return t - stepMs / 2
    prev = cur
  }
  return epochMs // unreachable: a synodic month always fits in 32 days
}

// ── Planet visibility windows ─────────────────────────────────

export type SkyWindow = 'evening' | 'morning' | 'all-night' | 'hidden'

export interface PlanetSky {
  id:            string
  /** Angular separation from the Sun, deg, 0..180. */
  elongationDeg: number
  window:        SkyWindow
}

/** Below this solar elongation a planet is lost in twilight glare. */
const GLARE_DEG = 15
/** Above this elongation an outer planet is effectively up all night. */
const OPPOSITION_DEG = 150

const VISIBLE_PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']

/**
 * Tonight's visibility window for each planet, from geocentric ecliptic
 * longitudes (location-independent — which twilight a planet belongs to is
 * the same for every observer on Earth on a given night).
 */
export function planetsTonight(epochMs: number): PlanetSky[] {
  const earth = helioPosition(PLANET_ELEMENTS.earth, epochMs)
  const ex = earth.rAU * Math.cos(earth.lonDeg * DEG)
  const ey = earth.rAU * Math.sin(earth.lonDeg * DEG)
  const sunLon = sunGeoLongitude(epochMs)

  return VISIBLE_PLANETS.map(id => {
    const p = helioPosition(PLANET_ELEMENTS[id], epochMs)
    const gx = p.rAU * Math.cos(p.lonDeg * DEG) - ex
    const gy = p.rAU * Math.sin(p.lonDeg * DEG) - ey
    const geoLon = normalizeDeg(Math.atan2(gy, gx) / DEG)

    // 0–180 → east of the Sun (sets after it: evening sky);
    // 180–360 → west of the Sun (rises before it: morning sky).
    const rel = normalizeDeg(geoLon - sunLon)
    const east = rel <= 180
    const elongationDeg = east ? rel : 360 - rel

    const window: SkyWindow =
      elongationDeg < GLARE_DEG      ? 'hidden'
      : elongationDeg > OPPOSITION_DEG ? 'all-night'
      : east ? 'evening' : 'morning'

    return { id, elongationDeg, window }
  })
}

// ── Sun geometry for an observer ──────────────────────────────

/** Right ascension + declination of the Sun, deg. */
export function sunEquatorial(epochMs: number): { raDeg: number; decDeg: number } {
  const lon = sunGeoLongitude(epochMs) * DEG
  const eps = OBLIQUITY * DEG
  const raDeg  = normalizeDeg(Math.atan2(Math.cos(eps) * Math.sin(lon), Math.cos(lon)) / DEG)
  const decDeg = Math.asin(Math.sin(eps) * Math.sin(lon)) / DEG
  return { raDeg, decDeg }
}

/** Greenwich mean sidereal time, deg. */
export function gmstDeg(epochMs: number): number {
  return normalizeDeg(280.46061837 + 360.98564736629 * daysSinceJ2000(epochMs))
}

/** Altitude of the Sun above the horizon for an observer, deg. */
export function sunAltitudeDeg(epochMs: number, latDeg: number, lonDeg: number): number {
  const { raDeg, decDeg } = sunEquatorial(epochMs)
  const H   = (gmstDeg(epochMs) + lonDeg - raDeg) * DEG // local hour angle
  const lat = latDeg * DEG
  const dec = decDeg * DEG
  return Math.asin(
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H),
  ) / DEG
}

export interface SunTimes {
  kind:      'normal' | 'polar-day' | 'polar-night'
  /** ms epochs; null unless kind === 'normal'. */
  sunriseMs: number | null
  sunsetMs:  number | null
}

/**
 * Sunrise/sunset (upper-limb, standard −0.833° refraction altitude) for the
 * UTC day containing `epochMs`. NOAA-style approximation, ±3 min.
 */
export function sunTimes(epochMs: number, latDeg: number, lonDeg: number): SunTimes {
  const dayStart = Math.floor(epochMs / 86_400_000) * 86_400_000

  // Solar noon = 12:00 UTC − longitude − equation of time.
  const T = julianCenturies(epochMs)
  const el = PLANET_ELEMENTS.earth
  const meanSunLon = normalizeDeg(el.L + el.LDot * T + 180)
  const approxNoon = dayStart + (12 - lonDeg / 15) * 3_600_000
  const { raDeg, decDeg } = sunEquatorial(approxNoon)
  // Equation of time as an angle; ±20 min max, so the ±180° wrap is safe.
  let eotDeg = meanSunLon - raDeg
  eotDeg = ((eotDeg + 540) % 360) - 180
  const noonMs = approxNoon - (eotDeg / 15) * 3_600_000

  const lat = latDeg * DEG
  const dec = decDeg * DEG
  const cosH = (Math.sin(-0.833 * DEG) - Math.sin(lat) * Math.sin(dec)) /
               (Math.cos(lat) * Math.cos(dec))
  if (cosH < -1) return { kind: 'polar-day',   sunriseMs: null, sunsetMs: null }
  if (cosH >  1) return { kind: 'polar-night', sunriseMs: null, sunsetMs: null }

  const halfDayMs = (Math.acos(cosH) / DEG / 15) * 3_600_000
  return { kind: 'normal', sunriseMs: noonMs - halfDayMs, sunsetMs: noonMs + halfDayMs }
}
