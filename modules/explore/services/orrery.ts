/**
 * Orrery math — heliocentric positions for the Solar System explorer.
 *
 * Planet positions are computed from JPL's "Approximate Positions of the
 * Planets" Keplerian elements (J2000 mean elements + centennial rates, valid
 * 1800–2050; Pluto from the extended table). For a top-down 2-D orrery we
 * project onto the ecliptic plane: the heliocentric ecliptic longitude is
 * exact to well under a degree in this era — more than enough for display.
 *
 * Everything here is pure and DOM-free (unit-tested with node:test), and
 * deterministic for a given epoch so SSR and client hydration always agree.
 */

const DEG = Math.PI / 180

/** JD 2451545.0 — the J2000.0 epoch (2000-01-01 12:00). */
export const J2000_MS = Date.UTC(2000, 0, 1, 12)

export interface OrbitalElements {
  /** Semi-major axis, AU (+ rate per Julian century). */
  a: number; aDot: number
  /** Eccentricity. */
  e: number; eDot: number
  /** Inclination to the ecliptic, deg. */
  i: number; iDot: number
  /** Mean longitude, deg. */
  L: number; LDot: number
  /** Longitude of perihelion ϖ, deg. */
  peri: number; periDot: number
  /** Longitude of the ascending node Ω, deg. */
  node: number; nodeDot: number
}

/** JPL J2000 mean elements + rates per Julian century (Table 1; Pluto Table 2a). */
export const PLANET_ELEMENTS: Record<string, OrbitalElements> = {
  mercury: { a: 0.38709927, aDot:  0.00000037, e: 0.20563593, eDot:  0.00001906, i: 7.00497902,  iDot: -0.00594749, L: 252.25032350, LDot: 149472.67411175, peri:  77.45779628, periDot:  0.16047689, node:  48.33076593, nodeDot: -0.12534081 },
  venus:   { a: 0.72333566, aDot:  0.00000390, e: 0.00677672, eDot: -0.00004107, i: 3.39467605,  iDot: -0.00078890, L: 181.97909950, LDot:  58517.81538729, peri: 131.60246718, periDot:  0.00268329, node:  76.67984255, nodeDot: -0.27769418 },
  earth:   { a: 1.00000261, aDot:  0.00000562, e: 0.01671123, eDot: -0.00004392, i: -0.00001531, iDot: -0.01294668, L: 100.46457166, LDot:  35999.37244981, peri: 102.93768193, periDot:  0.32327364, node:   0.0,        nodeDot:  0.0        },
  mars:    { a: 1.52371034, aDot:  0.00001847, e: 0.09339410, eDot:  0.00007882, i: 1.84969142,  iDot: -0.00813131, L:  -4.55343205, LDot:  19140.30268499, peri: -23.94362959, periDot:  0.44441088, node:  49.55953891, nodeDot: -0.29257343 },
  jupiter: { a: 5.20288700, aDot: -0.00011607, e: 0.04838624, eDot: -0.00013253, i: 1.30439695,  iDot: -0.00183714, L:  34.39644051, LDot:   3034.74612775, peri:  14.72847983, periDot:  0.21252668, node: 100.47390909, nodeDot:  0.20469106 },
  saturn:  { a: 9.53667594, aDot: -0.00125060, e: 0.05386179, eDot: -0.00050991, i: 2.48599187,  iDot:  0.00193609, L:  49.95424423, LDot:   1222.49362201, peri:  92.59887831, periDot: -0.41897216, node: 113.66242448, nodeDot: -0.28867794 },
  uranus:  { a: 19.18916464, aDot: -0.00196176, e: 0.04725744, eDot: -0.00004397, i: 0.77263783, iDot: -0.00242939, L: 313.23810451, LDot:    428.48202785, peri: 170.95427630, periDot:  0.40805281, node:  74.01692503, nodeDot:  0.04240589 },
  neptune: { a: 30.06992276, aDot:  0.00026291, e: 0.00859048, eDot:  0.00005105, i: 1.77004347, iDot:  0.00035372, L: -55.12002969, LDot:    218.45945325, peri:  44.96476227, periDot: -0.32241464, node: 131.78422574, nodeDot: -0.00508664 },
  pluto:   { a: 39.48211675, aDot: -0.00031596, e: 0.24882730, eDot:  0.00005170, i: 17.14001206, iDot: 0.00004818, L: 238.92903833, LDot:    145.20780515, peri: 224.06891629, periDot: -0.04062942, node: 110.30393684, nodeDot: -0.01183482 },
}

/** Julian centuries since J2000.0 for a JS epoch (ms). */
export function julianCenturies(epochMs: number): number {
  return (epochMs - J2000_MS) / (86_400_000 * 36525)
}

/** Normalize an angle in degrees to [0, 360). */
export function normalizeDeg(d: number): number {
  const n = d % 360
  return n < 0 ? n + 360 : n
}

/**
 * Solve Kepler's equation M = E − e·sin(E) by Newton iteration.
 * `Mdeg` in degrees; returns the eccentric anomaly E in degrees.
 */
export function solveKepler(Mdeg: number, e: number): number {
  const eStar = e / DEG // eccentricity expressed in degrees
  let E = Mdeg + eStar * Math.sin(Mdeg * DEG)
  for (let k = 0; k < 16; k++) {
    const dM = Mdeg - (E - eStar * Math.sin(E * DEG))
    const dE = dM / (1 - e * Math.cos(E * DEG))
    E += dE
    if (Math.abs(dE) < 1e-7) break
  }
  return E
}

export interface HelioPosition {
  /** Heliocentric ecliptic longitude, deg, in [0, 360). */
  lonDeg: number
  /** Distance from the Sun projected onto the ecliptic, AU. */
  rAU: number
}

/** Heliocentric ecliptic position of a body at a JS epoch (ms). */
export function helioPosition(el: OrbitalElements, epochMs: number): HelioPosition {
  const T = julianCenturies(epochMs)
  const a    = el.a    + el.aDot    * T
  const e    = el.e    + el.eDot    * T
  const inc  = (el.i   + el.iDot    * T) * DEG
  const L    = el.L    + el.LDot    * T
  const peri = el.peri + el.periDot * T
  const node = el.node + el.nodeDot * T

  const M = normalizeDeg(L - peri)          // mean anomaly
  const E = solveKepler(M, e) * DEG         // eccentric anomaly, rad

  // Coordinates in the orbital plane (x' toward perihelion), AU.
  const xOrb = a * (Math.cos(E) - e)
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E)

  // Rotate into ecliptic coordinates (ω = ϖ − Ω).
  const w = (peri - node) * DEG
  const O = node * DEG
  const cosw = Math.cos(w), sinw = Math.sin(w)
  const cosO = Math.cos(O), sinO = Math.sin(O)
  const cosi = Math.cos(inc)

  const x = (cosw * cosO - sinw * sinO * cosi) * xOrb + (-sinw * cosO - cosw * sinO * cosi) * yOrb
  const y = (cosw * sinO + sinw * cosO * cosi) * xOrb + (-sinw * sinO + cosw * cosO * cosi) * yOrb

  return { lonDeg: normalizeDeg(Math.atan2(y, x) / DEG), rAU: Math.hypot(x, y) }
}

/**
 * Geocentric mean longitude of the Moon, deg (~2° decorative accuracy —
 * plenty for the small orbit drawn around the Earth dot).
 */
export function moonAngleDeg(epochMs: number): number {
  const d = (epochMs - J2000_MS) / 86_400_000
  return normalizeDeg(218.316 + 13.17639648 * d)
}

// ── Display scaling ───────────────────────────────────────────
// Real orbital radii span 0.39–49 AU; drawn linearly the inner planets would
// collapse into the Sun. A log scale keeps every orbit readable while
// preserving true ordering (and lets Pluto visibly dip inside Neptune's orbit
// near perihelion, as it really does).

export const SCALE_LO_AU = 0.25
export const SCALE_HI_AU = 55

/** Log-compressed display fraction (0..1, clamped) for a solar distance in AU. */
export function scaledFraction(rAU: number): number {
  if (rAU <= 0) return 0
  const f = (Math.log(rAU) - Math.log(SCALE_LO_AU)) / (Math.log(SCALE_HI_AU) - Math.log(SCALE_LO_AU))
  return Math.min(1, Math.max(0, f))
}

export interface OrreryPoint { x: number; y: number }

/**
 * SVG point for a scaled polar position. Longitude 0° points right (+x) and
 * increases counter-clockwise — the Solar System as seen from ecliptic north.
 */
export function orreryPoint(lonDeg: number, frac: number, cx: number, cy: number, maxR: number): OrreryPoint {
  const rad = lonDeg * DEG
  return { x: cx + maxR * frac * Math.cos(rad), y: cy - maxR * frac * Math.sin(rad) }
}

// ── Deterministic date formatting ─────────────────────────────
// toLocaleDateString depends on the runtime locale, which can differ between
// server and client (hydration mismatch). This formatter cannot.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "12 Mar 2031" — locale-independent UTC date (hydration-safe). */
export function formatUTCDate(epochMs: number): string {
  const d = new Date(epochMs)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
