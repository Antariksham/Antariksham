/**
 * Unit tests for Improved Launch Information (Phase 1, Feature 6).
 *
 *   node --test --experimental-strip-types modules/missions/services/missionLaunch.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyLaunch, normalizeLaunch, launchFromDetails, isLaunchEmpty,
  launchTargetTimestamp, validateLaunch, launchSuccessMeta,
  LAUNCH_TEXT_FIELDS, LAUNCH_SUCCESS_OPTIONS,
} from './missionLaunch.ts'

const hasError = (issues: ReturnType<typeof validateLaunch>, field: string) =>
  issues.some(i => i.field === field && i.level === 'error')
const hasWarn = (issues: ReturnType<typeof validateLaunch>, field: string) =>
  issues.some(i => i.field === field && i.level === 'warning')

test('emptyLaunch defaults', () => {
  const l = emptyLaunch()
  for (const f of LAUNCH_TEXT_FIELDS) assert.equal(l[f], '')
  assert.equal(l.success, 'unknown')
  assert.equal(l.countdown, false)
  assert.equal(isLaunchEmpty(l), true)
})

test('normalizeLaunch: trims, validates success, coerces countdown, drops junk', () => {
  const l = normalizeLaunch({ site: '  Baikonur ', success: 'success', countdown: 1, rocket: 42, bogus: 'x' })
  assert.equal(l.site, 'Baikonur')
  assert.equal(l.success, 'success')
  assert.equal(l.countdown, true)
  assert.equal(l.rocket, '')                        // non-string dropped
  assert.equal((l as Record<string, unknown>).bogus, undefined)
})

test('normalizeLaunch: invalid success falls back to unknown; tolerates garbage', () => {
  assert.equal(normalizeLaunch({ success: 'exploded' }).success, 'unknown')
  assert.deepEqual(normalizeLaunch(null), emptyLaunch())
})

test('launchFromDetails reads the launch namespace', () => {
  assert.equal(launchFromDetails({ launch: { rocket: 'Falcon 9' } }).rocket, 'Falcon 9')
  assert.deepEqual(launchFromDetails({}), emptyLaunch())
})

test('launchSuccessMeta', () => {
  assert.equal(launchSuccessMeta('failure').label, 'Failure')
  assert.equal(launchSuccessMeta('nonsense').label, LAUNCH_SUCCESS_OPTIONS[0].label) // fallback → unknown
  assert.equal(LAUNCH_SUCCESS_OPTIONS.length, 4)
})

test('launchTargetTimestamp: prefers window start, else date + time', () => {
  const l = emptyLaunch(); l.windowStart = '2030-01-01T12:00'
  assert.equal(launchTargetTimestamp('2029-12-31', l), Date.parse('2030-01-01T12:00'))

  const l2 = emptyLaunch(); l2.time = '14:30'
  assert.equal(launchTargetTimestamp('2030-06-01', l2), Date.parse('2030-06-01T14:30:00'))

  const l3 = emptyLaunch()
  assert.equal(launchTargetTimestamp('2030-06-01', l3), Date.parse('2030-06-01T00:00:00'))
  assert.equal(launchTargetTimestamp('', emptyLaunch()), null)
})

test('validateLaunch: window end before start blocks', () => {
  const l = emptyLaunch(); l.windowStart = '2030-01-01T12:00'; l.windowEnd = '2030-01-01T10:00'
  assert.equal(hasError(validateLaunch(l, ''), 'windowEnd'), true)
})

test('validateLaunch: window start on/after start is fine', () => {
  const l = emptyLaunch(); l.windowStart = '2030-01-01T10:00'; l.windowEnd = '2030-01-01T12:00'
  assert.deepEqual(validateLaunch(l, ''), [])
})

test('validateLaunch: launch date outside window warns', () => {
  const l = emptyLaunch(); l.windowStart = '2030-01-10T10:00'; l.windowEnd = '2030-01-20T12:00'
  assert.equal(hasWarn(validateLaunch(l, '2030-01-05'), 'windowStart'), true) // before window
  assert.equal(hasWarn(validateLaunch(l, '2030-01-25'), 'windowEnd'), true)   // after window
  assert.deepEqual(validateLaunch(l, '2030-01-15'), [])                       // inside window
})

test('validateLaunch: invalid livestream URL blocks', () => {
  const l = emptyLaunch(); l.livestreamUrl = 'not a url'
  assert.equal(hasError(validateLaunch(l, ''), 'livestreamUrl'), true)
})

test('validateLaunch: a realistic launch is clean', () => {
  const l = emptyLaunch()
  l.site = 'Kennedy Space Center'; l.pad = 'LC-39A'; l.rocket = 'Falcon 9'
  l.provider = 'SpaceX'; l.success = 'success'; l.livestreamUrl = 'https://youtube.com/watch?v=x'
  l.windowStart = '2030-01-01T10:00'; l.windowEnd = '2030-01-01T14:00'
  assert.deepEqual(validateLaunch(l, '2030-01-01'), [])
})
