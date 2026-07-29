/**
 * Shared ISS TLE fetch + cache (server-side only).
 *
 * Extracted from app/api/iss/route.ts so both the position route and the
 * pass-prediction route (/api/iss/passes) reuse one Celestrak fetch and one
 * in-memory cache. Orbital elements stay accurate for days, so we refresh at
 * most every few hours and compute everything else locally with satellite.js
 * (sub-millisecond, no per-request network).
 */

// International Space Station (NORAD catalog number 25544)
const ISS_CATNR = 25544
const TLE_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_CATNR}&FORMAT=TLE`

export interface TLE { line1: string; line2: string }

let tleCache: { tle: TLE; ts: number } | null = null
const TLE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours

async function fetchTLE(timeoutMs = 8000): Promise<TLE> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(TLE_URL, { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(`celestrak -> ${res.status}`)
    const text  = await res.text()
    const lines = text.split('\n').map(l => l.trimEnd()).filter(Boolean)
    const line1 = lines.find(l => l.startsWith('1 '))
    const line2 = lines.find(l => l.startsWith('2 '))
    if (!line1 || !line2) throw new Error('celestrak: malformed TLE')
    return { line1, line2 }
  } finally {
    clearTimeout(timer)
  }
}

export async function getTLE(): Promise<TLE> {
  const now = Date.now()
  if (tleCache && now - tleCache.ts < TLE_TTL_MS) return tleCache.tle
  try {
    const tle = await fetchTLE()
    tleCache = { tle, ts: now }
    return tle
  } catch (err) {
    // Celestrak blip — keep using the last TLE (valid for days) if we have one.
    if (tleCache) return tleCache.tle
    throw err
  }
}
