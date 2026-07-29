/**
 * Unit tests for the Sky Tonight astronomy (moon phase, planet windows, sun
 * geometry) — validated against real, independently-known sky events.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/explore/services/skyTonight.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  moonPhase, nextMoonEvent, planetsTonight,
  sunEquatorial, sunAltitudeDeg, sunTimes, SYNODIC_MONTH_DAYS,
} from './skyTonight.ts'

// Ground truth: the total solar eclipse of 2024-04-08 (necessarily a new
// moon, ~18:20 UTC) and the full moon of 2024-01-25 (~17:54 UTC).
const NEW_MOON_2024  = Date.UTC(2024, 3, 8, 18, 20)
const FULL_MOON_2024 = Date.UTC(2024, 0, 25, 17, 54)

test('moonPhase: 2024-04-08 solar eclipse is a new moon', () => {
  const p = moonPhase(NEW_MOON_2024)
  const distFromNew = Math.min(p.elongationDeg, 360 - p.elongationDeg)
  assert.ok(distFromNew < 10, `elongation ${p.elongationDeg}° should be ~0`)
  assert.ok(p.illumination < 0.02, `illumination ${p.illumination}`)
  assert.equal(p.name, 'New Moon')
})

test('moonPhase: 2024-01-25 is a full moon', () => {
  const p = moonPhase(FULL_MOON_2024)
  assert.ok(Math.abs(p.elongationDeg - 180) < 10, `elongation ${p.elongationDeg}° should be ~180`)
  assert.ok(p.illumination > 0.98, `illumination ${p.illumination}`)
  assert.equal(p.name, 'Full Moon')
  assert.ok(Math.abs(p.ageDays - SYNODIC_MONTH_DAYS / 2) < 1.2)
})

test('moonPhase: waxing flag flips across the full moon', () => {
  assert.equal(moonPhase(FULL_MOON_2024 - 3 * 86_400_000).waxing, true)
  assert.equal(moonPhase(FULL_MOON_2024 + 3 * 86_400_000).waxing, false)
})

test('nextMoonEvent: finds the 2024-04-08 new moon from a week before', () => {
  const found = nextMoonEvent(Date.UTC(2024, 3, 1), 'new')
  assert.ok(Math.abs(found - NEW_MOON_2024) < 86_400_000,
    `found ${new Date(found).toISOString()}, expected ~2024-04-08`)
})

test('nextMoonEvent: finds the 2024-01-25 full moon from five days before', () => {
  const found = nextMoonEvent(Date.UTC(2024, 0, 20), 'full')
  assert.ok(Math.abs(found - FULL_MOON_2024) < 86_400_000,
    `found ${new Date(found).toISOString()}, expected ~2024-01-25`)
})

test('planetsTonight: sane elongations and windows', () => {
  const sky = planetsTonight(Date.UTC(2026, 6, 29))
  assert.equal(sky.length, 7)
  for (const p of sky) {
    assert.ok(p.elongationDeg >= 0 && p.elongationDeg <= 180, `${p.id} ${p.elongationDeg}`)
    assert.ok(['evening', 'morning', 'all-night', 'hidden'].includes(p.window))
  }
  // Inner planets can never stray far from the Sun.
  const merc = sky.find(p => p.id === 'mercury')!
  const venus = sky.find(p => p.id === 'venus')!
  assert.ok(merc.elongationDeg < 29, `Mercury elongation ${merc.elongationDeg}`)
  assert.ok(venus.elongationDeg < 48, `Venus elongation ${venus.elongationDeg}`)
  assert.notEqual(merc.window, 'all-night')
  assert.notEqual(venus.window, 'all-night')
})

test('sunEquatorial: declination tracks the seasons', () => {
  // Late June: near +23.4°; late December: near −23.4°; near the March
  // equinox: ~0°.
  assert.ok(sunEquatorial(Date.UTC(2024, 5, 21)).decDeg > 23)
  assert.ok(sunEquatorial(Date.UTC(2024, 11, 21)).decDeg < -23)
  assert.ok(Math.abs(sunEquatorial(Date.UTC(2024, 2, 20)).decDeg) < 1)
})

test('sunAltitudeDeg: high at local noon, deeply negative at local midnight (equator)', () => {
  assert.ok(sunAltitudeDeg(Date.UTC(2024, 2, 20, 12), 0, 0) > 80)
  assert.ok(sunAltitudeDeg(Date.UTC(2024, 2, 20, 0), 0, 0) < -60)
})

test('sunTimes: ~06:00/18:00 UTC at the equator, Greenwich meridian, on the equinox', () => {
  const t = sunTimes(Date.UTC(2024, 2, 20, 12), 0, 0)
  assert.equal(t.kind, 'normal')
  const sunriseH = (t.sunriseMs! - Date.UTC(2024, 2, 20)) / 3_600_000
  const sunsetH  = (t.sunsetMs!  - Date.UTC(2024, 2, 20)) / 3_600_000
  assert.ok(Math.abs(sunriseH - 6) < 0.3, `sunrise ${sunriseH}h`)
  assert.ok(Math.abs(sunsetH - 18) < 0.3, `sunset ${sunsetH}h`)
})

test('sunTimes: polar day and night above the Arctic Circle', () => {
  assert.equal(sunTimes(Date.UTC(2024, 5, 21, 12), 78, 15).kind, 'polar-day')
  assert.equal(sunTimes(Date.UTC(2024, 11, 21, 12), 78, 15).kind, 'polar-night')
})
