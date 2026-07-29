/**
 * Unit tests for the pure ISS pass-finding logic, using a synthetic sky
 * (no satellite.js — that glue is exercised in the browser).
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/explore/services/issPasses.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPasses, compassPoint, passDuration, type LookSample } from './issPasses.ts'

const MIN = 60_000
const T0 = Date.UTC(2026, 6, 29)

/** A sinusoidal "pass" peaking at `peakMs` with max elevation `peakElev`. */
const bump = (peakMs: number, peakElev: number, halfWidthMin = 5) =>
  (ms: number): LookSample => {
    const x = (ms - peakMs) / (halfWidthMin * MIN) // −1..1 across the bump
    const elevDeg = Math.abs(x) > 1 ? -10 : peakElev * Math.cos((x * Math.PI) / 2)
    return { elevDeg, azDeg: ((ms - peakMs) / MIN) * 18 + 180 } // az sweeps through 180
  }

test('findPasses: one bump → one pass with the right peak', () => {
  const peak = T0 + 60 * MIN
  const passes = findPasses(bump(peak, 45), T0, 3)
  assert.equal(passes.length, 1)
  const p = passes[0]
  assert.ok(Math.abs(p.maxElevMs - peak) <= 30_000, `peak off by ${p.maxElevMs - peak}ms`)
  assert.ok(Math.abs(p.maxElevDeg - 45) < 1)
  assert.ok(p.startMs < peak && p.endMs > peak)
  assert.ok(p.startAzDeg < p.maxAzDeg && p.maxAzDeg < p.endAzDeg)
})

test('findPasses: two bumps → two passes, in order', () => {
  const a = T0 + 50 * MIN
  const b = T0 + 300 * MIN
  const lookAt = (ms: number): LookSample => {
    const s1 = bump(a, 60)(ms)
    const s2 = bump(b, 25)(ms)
    return s1.elevDeg >= s2.elevDeg ? s1 : s2
  }
  const passes = findPasses(lookAt, T0, 8)
  assert.equal(passes.length, 2)
  assert.ok(Math.abs(passes[0].maxElevDeg - 60) < 1)
  assert.ok(Math.abs(passes[1].maxElevDeg - 25) < 1)
})

test('findPasses: bumps below the minimum elevation are ignored', () => {
  const passes = findPasses(bump(T0 + 60 * MIN, 8), T0, 3, 30, 10)
  assert.equal(passes.length, 0)
})

test('findPasses: null samples are treated as below the horizon', () => {
  const passes = findPasses(() => null, T0, 3)
  assert.equal(passes.length, 0)
})

test('compassPoint: cardinal and intermediate winds', () => {
  assert.equal(compassPoint(0), 'N')
  assert.equal(compassPoint(90), 'E')
  assert.equal(compassPoint(225), 'SW')
  assert.equal(compassPoint(337.5), 'NNW')
  assert.equal(compassPoint(359.9), 'N')
  assert.equal(compassPoint(-90), 'W')
})

test('passDuration: seconds under 90 s, minutes above', () => {
  const mk = (sec: number) => ({
    startMs: T0, endMs: T0 + sec * 1000,
    maxElevDeg: 0, maxElevMs: T0, startAzDeg: 0, maxAzDeg: 0, endAzDeg: 0,
  })
  assert.equal(passDuration(mk(45)), '45 s')
  assert.equal(passDuration(mk(300)), '5 min')
})
