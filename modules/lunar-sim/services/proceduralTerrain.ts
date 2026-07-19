// Procedural lunar terrain + stochastic mission generator for the
// SELENE simulator.
//
// Every "New Mission" rolls a fresh seed and builds a unique world from
// it: a seeded 2-D simplex-noise height field (hills, flatlands, micro
// roughness) with explicit bowl-and-rim craters layered on top. The
// generator then scans that surface for the flattest reachable "safe
// zone" (the mission target), and surveys the approach corridor for
// rough stretches which are handed to the C++ flight software as terrain
// hazard zones — so the hazard-avoidance logic reasons about the same
// surface the user sees rendered.
//
// Everything here is deterministic in the seed: the Three.js mesh, the
// safe-zone pick and the hazard survey all reproduce exactly from one
// integer, which keeps the wasm scenario and the rendered world in sync.

import type { SeleneScenarioConfig } from './loadSelene'

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 2-D simplex noise (Gustavson's algorithm, seeded permutation) ────
const GRAD2: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
]
const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

export function makeSimplexNoise2D(rand: () => number): (x: number, y: number) => number {
  const perm = new Uint8Array(512)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  return (xin: number, yin: number): number => {
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const x0 = xin - (i - t)
    const y0 = yin - (j - t)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255
    let n = 0
    let tt = 0.5 - x0 * x0 - y0 * y0
    if (tt > 0) {
      const g = GRAD2[perm[ii + perm[jj]] % 8]
      n += tt * tt * tt * tt * (g[0] * x0 + g[1] * y0)
    }
    tt = 0.5 - x1 * x1 - y1 * y1
    if (tt > 0) {
      const g = GRAD2[perm[ii + i1 + perm[jj + j1]] % 8]
      n += tt * tt * tt * tt * (g[0] * x1 + g[1] * y1)
    }
    tt = 0.5 - x2 * x2 - y2 * y2
    if (tt > 0) {
      const g = GRAD2[perm[ii + 1 + perm[jj + 1]] % 8]
      n += tt * tt * tt * tt * (g[0] * x2 + g[1] * y2)
    }
    return 70 * n // scaled to roughly [-1, 1]
  }
}

// ── Terrain definition ───────────────────────────────────────────────
export interface Crater {
  x: number
  z: number
  radiusM: number
  depthM: number
}

export interface TerrainData {
  seed: number
  /** Rendered plane spans [-sizeM/2, +sizeM/2] on both axes. */
  sizeM: number
  craters: Crater[]
  /** Surface height (m) at any point of the infinite noise field. */
  heightAt: (x: number, z: number) => number
}

const TERRAIN_SIZE_M = 6000

export function generateTerrain(seed: number): TerrainData {
  const rand = mulberry32(seed)
  const noise = makeSimplexNoise2D(rand)

  // Craters: a few giants plus a scattered field, denser near the middle
  // of the map where the mission flies.
  const craters: Crater[] = []
  const craterCount = 26 + Math.floor(rand() * 14)
  for (let i = 0; i < craterCount; i++) {
    const big = rand() < 0.18
    const radiusM = big ? 120 + rand() * 140 : 25 + rand() * 70
    const span = i % 3 === 0 ? 1600 : 2800 // every 3rd crater stays central
    craters.push({
      x: (rand() * 2 - 1) * span,
      z: (rand() * 2 - 1) * span,
      radiusM,
      depthM: radiusM * (0.07 + rand() * 0.06),
    })
  }

  const heightAt = (x: number, z: number): number => {
    // Rolling hills and flatlands (three octaves of simplex fBm) plus
    // fine regolith texture.
    let h =
      noise(x / 900, z / 900) * 12 +
      noise(x / 260, z / 260) * 3.4 +
      noise(x / 62, z / 62) * 0.9 +
      noise(x / 11, z / 11) * 0.18

    // Bowl-and-rim craters layered on the noise field.
    for (const c of craters) {
      const dx = x - c.x
      const dz = z - c.z
      const d2 = dx * dx + dz * dz
      const reach = c.radiusM * 1.35
      if (d2 > reach * reach) continue
      const d = Math.sqrt(d2) / c.radiusM
      if (d < 1) {
        const bowl = 1 - d * d
        h -= c.depthM * bowl * bowl
      }
      const rim = (d - 1) / 0.18
      h += c.depthM * 0.32 * Math.exp(-rim * rim)
    }
    return h
  }

  return { seed, sizeM: TERRAIN_SIZE_M, craters, heightAt }
}

// ── Terrain analysis (shared by safe-zone scan + hazard survey) ──────
const DEG = 180 / Math.PI

/** Local gradient magnitude of the surface, as a slope angle in degrees. */
export function slopeDegAt(terrain: TerrainData, x: number, z: number): number {
  const e = 2.5
  const gx = (terrain.heightAt(x + e, z) - terrain.heightAt(x - e, z)) / (2 * e)
  const gz = (terrain.heightAt(x, z + e) - terrain.heightAt(x, z - e)) / (2 * e)
  return Math.atan(Math.sqrt(gx * gx + gz * gz)) * DEG
}

/** Small-scale height scatter (m) inside a landing-pad-sized footprint. */
export function roughnessAt(terrain: TerrainData, x: number, z: number): number {
  const r = 3.5
  const center = terrain.heightAt(x, z)
  let lo = center
  let hi = center
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const h = terrain.heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r)
    // Remove the planar trend so gentle slopes don't read as roughness.
    const trend =
      center +
      (terrain.heightAt(x + Math.cos(a) * 2 * r, z + Math.sin(a) * 2 * r) - center) / 2
    const residual = h - trend
    if (residual < lo - center) lo = center + residual
    if (residual > hi - center) hi = center + residual
  }
  return (hi - lo) / 2
}

// ── Safe-zone selection ──────────────────────────────────────────────
export interface SafeZone {
  x: number
  z: number
  /** Ground distance from the descent gate (world origin) to the site. */
  downrangeM: number
  /** Direction of flight: origin → site, radians about +y from +x. */
  azimuthRad: number
  siteHeightM: number
  slopeDeg: number
  roughnessM: number
}

/**
 * Scan the generated surface for a relatively flat "safe zone" inside the
 * reachable annulus [rMinM, rMaxM] around the descent gate. Candidates are
 * scored over the full landing footprint (center + ring samples, matching
 * the flight selector's 10 m footprint), flattest wins.
 */
export function findSafeZone(
  terrain: TerrainData,
  rMinM: number,
  rMaxM: number,
): SafeZone {
  let best: SafeZone | null = null
  let bestScore = Infinity
  const FOOT_R = 10

  for (let r = rMinM; r <= rMaxM; r += 22) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 24) {
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      let slope = slopeDegAt(terrain, x, z)
      let rough = roughnessAt(terrain, x, z)
      for (let k = 0; k < 4; k++) {
        const fa = (k / 4) * Math.PI * 2
        const fx = x + Math.cos(fa) * FOOT_R
        const fz = z + Math.sin(fa) * FOOT_R
        slope = Math.max(slope, slopeDegAt(terrain, fx, fz))
        rough = Math.max(rough, roughnessAt(terrain, fx, fz))
      }
      // Flatness dominates; a mild range preference breaks ties toward
      // the middle of the annulus (comfortable guidance margins).
      const rangeBias = Math.abs(r - (rMinM + rMaxM) / 2) / (rMaxM - rMinM)
      const score = slope + rough * 12 + rangeBias * 0.8
      if (score < bestScore) {
        bestScore = score
        best = {
          x, z,
          downrangeM: r,
          azimuthRad: a,
          siteHeightM: terrain.heightAt(x, z),
          slopeDeg: slope,
          roughnessM: rough,
        }
      }
    }
  }
  // The scan always visits at least one candidate (rMinM <= rMaxM).
  return best!
}

// ── Corridor hazard survey (handed to the C++ HDA via the bridge) ────
export interface HazardZoneSpec {
  startM: number
  endM: number
  slopeDeg: number
  roughnessM: number
}

/** Mirror of the flight SafeSiteSelector mission limits. */
const HAZARD_SLOPE_LIMIT_DEG = 10
const HAZARD_ROUGHNESS_LIMIT_M = 0.3
const MAX_BRIDGE_ZONES = 7 // wasm bridge capacity (one slot is the demo toggle)

/**
 * Sample the surface along the flight corridor (downrange axis toward the
 * safe zone) and cluster the stretches that violate the flight-software
 * mission limits into hazard zones for the wasm TerrainModel.
 */
export function surveyCorridorHazards(
  terrain: TerrainData,
  zone: SafeZone,
  surveyHalfwidthM = 300,
  spacingM = 4,
): HazardZoneSpec[] {
  const dirX = Math.cos(zone.azimuthRad)
  const dirZ = Math.sin(zone.azimuthRad)
  const from = Math.max(20, zone.downrangeM - surveyHalfwidthM)
  const to = zone.downrangeM + surveyHalfwidthM

  const zones: HazardZoneSpec[] = []
  let open: HazardZoneSpec | null = null
  for (let d = from; d <= to; d += spacingM) {
    const x = dirX * d
    const z = dirZ * d
    const slope = slopeDegAt(terrain, x, z)
    const rough = roughnessAt(terrain, x, z)
    const hazardous = slope > HAZARD_SLOPE_LIMIT_DEG || rough > HAZARD_ROUGHNESS_LIMIT_M
    if (hazardous) {
      if (open) {
        open.endM = d + spacingM / 2
        open.slopeDeg = Math.max(open.slopeDeg, slope)
        open.roughnessM = Math.max(open.roughnessM, rough)
      } else {
        open = {
          startM: d - spacingM / 2,
          endM: d + spacingM / 2,
          slopeDeg: slope,
          roughnessM: rough,
        }
      }
    } else if (open) {
      zones.push(open)
      open = null
    }
  }
  if (open) zones.push(open)

  // The bridge holds a bounded zone table: keep the widest stretches.
  zones.sort((a, b) => (b.endM - b.startM) - (a.endM - a.startM))
  const kept = zones.slice(0, MAX_BRIDGE_ZONES)
  kept.sort((a, b) => a.startM - b.startM)
  return kept
}

// ── Stochastic mission roll ──────────────────────────────────────────
export interface MissionPlan {
  seed: number
  scenario: SeleneScenarioConfig
  terrain: TerrainData
  safeZone: SafeZone
  hazards: HazardZoneSpec[]
}

/**
 * Roll one complete mission from a seed: random gate physics inside
 * realistic constraints, a fresh procedural surface, the safe-zone target
 * on it, and the corridor hazard survey.
 *
 *   gate altitude   800 – 1500 m
 *   lateral drift    −5 – +5 m/s   (crosswind at the gate)
 *   descent rate    −12 – −22 m/s
 *   dry mass        260 – 320 kg   (payload variance)
 *   target range    flattest site 130 m – f(altitude) downrange
 *
 * The target-range ceiling scales with gate altitude so the guidance's
 * altitude-keyed ground-speed ramp can always reach the site (validated
 * against the flight software by Monte Carlo).
 */
export function rollMission(seed: number): MissionPlan {
  const rand = mulberry32(seed ^ 0x9e3779b9)
  const gateAltitudeM = 800 + rand() * 700
  const gateVelocityXMps = -5 + rand() * 10
  const gateVelocityZMps = -(12 + rand() * 10)
  const dryMassKg = 260 + rand() * 60
  const gatePitchRad = (rand() - 0.5) * 0.1

  const terrain = generateTerrain(seed)
  const rMaxM = 260 + 0.4 * (gateAltitudeM - 800)
  const safeZone = findSafeZone(terrain, 130, rMaxM)
  const hazards = surveyCorridorHazards(terrain, safeZone)

  return {
    seed,
    terrain,
    safeZone,
    hazards,
    scenario: {
      gateAltitudeM,
      gateVelocityXMps,
      gateVelocityZMps,
      gatePitchRad,
      dryMassKg,
      targetDownrangeM: safeZone.downrangeM,
      perfectNav: false,
      hazardAtTarget: false,
    },
  }
}

/** A fresh, non-deterministic seed for user-triggered missions. */
export function newMissionSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}
