/**
 * ISS pass finding — pure interval-scanning logic, decoupled from the
 * orbital propagator so it can be unit-tested with a synthetic sky.
 *
 * The satellite.js glue that turns a TLE + observer into the `lookAt`
 * function lives client-side in `issLook.ts`; this module never imports it.
 */

export interface LookSample {
  /** Elevation above the horizon, deg (negative = below). */
  elevDeg: number
  /** Azimuth, deg clockwise from north. */
  azDeg:   number
}

export interface IssPass {
  startMs:    number
  endMs:      number
  maxElevDeg: number
  /** When the pass peaks. */
  maxElevMs:  number
  startAzDeg: number
  maxAzDeg:   number
  endAzDeg:   number
}

/**
 * Scan the coming `hours` for horizon passes: contiguous intervals where the
 * satellite sits above `minElevDeg`. `lookAt` may return null (propagation
 * failure) — treated as below the horizon.
 */
export function findPasses(
  lookAt: (ms: number) => LookSample | null,
  startMs: number,
  hours: number,
  stepSec = 30,
  minElevDeg = 10,
  maxPasses = 20,
): IssPass[] {
  const passes: IssPass[] = []
  const stepMs = stepSec * 1000
  const endScan = startMs + hours * 3_600_000

  let cur: IssPass | null = null
  for (let t = startMs; t <= endScan; t += stepMs) {
    const s = lookAt(t)
    const above = s !== null && s.elevDeg >= minElevDeg
    if (above) {
      if (!cur) {
        cur = {
          startMs: t, endMs: t,
          maxElevDeg: s!.elevDeg, maxElevMs: t,
          startAzDeg: s!.azDeg, maxAzDeg: s!.azDeg, endAzDeg: s!.azDeg,
        }
      } else {
        cur.endMs = t
        cur.endAzDeg = s!.azDeg
        if (s!.elevDeg > cur.maxElevDeg) {
          cur.maxElevDeg = s!.elevDeg
          cur.maxElevMs  = t
          cur.maxAzDeg   = s!.azDeg
        }
      }
    } else if (cur) {
      passes.push(cur)
      cur = null
      if (passes.length >= maxPasses) return passes
    }
  }
  if (cur) passes.push(cur)
  return passes
}

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
]

/** 16-wind compass point for an azimuth in degrees. */
export function compassPoint(azDeg: number): string {
  const n = ((azDeg % 360) + 360) % 360
  return COMPASS[Math.round(n / 22.5) % 16]
}

/** "3 min" / "45 s" duration label for a pass. */
export function passDuration(pass: IssPass): string {
  const sec = Math.round((pass.endMs - pass.startMs) / 1000)
  if (sec < 90) return `${sec} s`
  return `${Math.round(sec / 60)} min`
}
