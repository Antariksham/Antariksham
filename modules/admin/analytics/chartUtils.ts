/**
 * Chart geometry helpers (Phase 2, Feature 5) — pure & testable.
 * Small SVG path/scale math for the dashboard's single-series line/area chart
 * and horizontal bar lists. No colour decisions here — the components read brand
 * tokens (accent + ink), so charts are theme-aware by construction.
 */

/** Round a max value up to a "nice" axis bound (1/2/5 × 10ⁿ). */
export function niceMax(v: number): number {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return nice * mag
}

export interface Pt { x: number; y: number }

/** Map a series of values to x/y points within a padded box. */
export function linePoints(values: number[], width: number, height: number, max: number, pad = 4): Pt[] {
  const n = values.length
  if (n === 0) return []
  const m = max || 1
  const innerW = Math.max(0, width - pad * 2)
  const innerH = Math.max(0, height - pad * 2)
  const stepX = n > 1 ? innerW / (n - 1) : 0
  return values.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - (Math.max(0, v) / m) * innerH,
  }))
}

/** Polyline path (`M…L…`) from points. */
export function toPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/** Closed area path down to the baseline (for the subtle fill under the line). */
export function toAreaPath(pts: Pt[], height: number, pad = 4): string {
  if (pts.length === 0) return ''
  const base = (height - pad).toFixed(1)
  const first = pts[0], last = pts[pts.length - 1]
  return `${toPath(pts)} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`
}
