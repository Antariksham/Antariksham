/**
 * Unit tests for the orrery math (Keplerian positions + display scaling).
 *
 * Zero-dependency: uses Node's built-in test runner + assert (no jest/vitest,
 * which this repo does not use). Run with:
 *
 *     node --test --experimental-strip-types modules/explore/services/orrery.test.ts
 *
 * (Node 22+ strips the TypeScript types at load time.)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  J2000_MS, PLANET_ELEMENTS,
  julianCenturies, normalizeDeg, solveKepler, helioPosition,
  moonAngleDeg, scaledFraction, orreryPoint, formatUTCDate,
} from './orrery.ts'

const DAY_MS = 86_400_000
const DEG = Math.PI / 180

test('julianCenturies: zero at J2000, one century after 36525 days', () => {
  assert.equal(julianCenturies(J2000_MS), 0)
  assert.ok(Math.abs(julianCenturies(J2000_MS + 36525 * DAY_MS) - 1) < 1e-12)
})

test('normalizeDeg: wraps into [0, 360)', () => {
  assert.equal(normalizeDeg(0), 0)
  assert.equal(normalizeDeg(370), 10)
  assert.equal(normalizeDeg(-10), 350)
  assert.equal(normalizeDeg(720), 0)
})

test('solveKepler: satisfies Kepler’s equation M = E − e·sin(E)', () => {
  for (const [M, e] of [[87.5, 0.2], [5, 0.0167], [200, 0.25], [-40, 0.09]] as const) {
    const E = solveKepler(M, e)
    const residual = M - (E - (e / DEG) * Math.sin(E * DEG))
    assert.ok(Math.abs(residual) < 1e-5, `residual ${residual} for M=${M}, e=${e}`)
  }
})

test('solveKepler: circular orbit gives E = M', () => {
  assert.ok(Math.abs(solveKepler(123.4, 0) - 123.4) < 1e-9)
})

test('helioPosition: Earth at J2000 is near perihelion at ~100° longitude', () => {
  const { lonDeg, rAU } = helioPosition(PLANET_ELEMENTS.earth, J2000_MS)
  // Mean longitude 100.46°, ϖ 102.94° → just short of perihelion in early January.
  assert.ok(lonDeg > 95 && lonDeg < 106, `lon ${lonDeg}`)
  assert.ok(rAU > 0.980 && rAU < 0.986, `r ${rAU}`)
})

test('helioPosition: Earth returns to the same longitude after one year', () => {
  const a = helioPosition(PLANET_ELEMENTS.earth, J2000_MS)
  const b = helioPosition(PLANET_ELEMENTS.earth, J2000_MS + 365.25 * DAY_MS)
  const diff = Math.abs(normalizeDeg(b.lonDeg - a.lonDeg + 180) - 180)
  assert.ok(diff < 0.5, `longitude drift ${diff}° after one year`)
})

test('helioPosition: radii stay within perihelion/aphelion bounds', () => {
  for (const [id, el] of Object.entries(PLANET_ELEMENTS)) {
    for (let k = 0; k < 12; k++) {
      const { rAU } = helioPosition(el, J2000_MS + k * 400 * DAY_MS)
      // Small tolerance: rAU is the ecliptic-plane projection.
      assert.ok(rAU > el.a * (1 - el.e) * 0.95, `${id} r ${rAU} below perihelion`)
      assert.ok(rAU < el.a * (1 + el.e) * 1.05, `${id} r ${rAU} above aphelion`)
    }
  }
})

test('moonAngleDeg: advances ~13.18°/day', () => {
  const t = J2000_MS + 1234 * DAY_MS
  const rate = normalizeDeg(moonAngleDeg(t + DAY_MS) - moonAngleDeg(t))
  assert.ok(Math.abs(rate - 13.176) < 0.01, `rate ${rate}`)
})

test('scaledFraction: clamped, monotonic, and ordered like the real planets', () => {
  assert.equal(scaledFraction(0.05), 0)
  assert.equal(scaledFraction(500), 1)
  const order = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
  let prev = -1
  for (const id of order) {
    const f = scaledFraction(PLANET_ELEMENTS[id].a)
    assert.ok(f > prev, `${id} fraction ${f} not > ${prev}`)
    assert.ok(f > 0 && f < 1, `${id} fraction ${f} out of range`)
    prev = f
  }
})

test('orreryPoint: longitude 0° points right, 90° points up (SVG y down)', () => {
  const p0 = orreryPoint(0, 0.5, 360, 360, 330)
  assert.ok(Math.abs(p0.x - (360 + 165)) < 1e-9 && Math.abs(p0.y - 360) < 1e-9)
  const p90 = orreryPoint(90, 0.5, 360, 360, 330)
  assert.ok(Math.abs(p90.x - 360) < 1e-9 && p90.y < 360)
})

test('formatUTCDate: locale-independent and UTC-based', () => {
  assert.equal(formatUTCDate(Date.UTC(2026, 6, 29)), '29 Jul 2026')
  assert.equal(formatUTCDate(Date.UTC(2000, 0, 1, 12)), '1 Jan 2000')
})
