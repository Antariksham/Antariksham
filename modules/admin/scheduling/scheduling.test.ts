/**
 * Unit tests for the Publishing Scheduler (Phase 2, Feature 4).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/scheduling/scheduling.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  toLocalInput, fromLocalInput, humanizeMs, scheduleView, validateSchedule,
  dueForPublish, dueForExpiry, type SchedRow,
} from './scheduling.ts'

const NOW = Date.parse('2026-06-01T12:00:00Z')
const iso = (s: string) => new Date(s).toISOString()

test('local input round-trips to the minute', () => {
  const src = '2026-06-01T09:30:00.000Z'
  const back = fromLocalInput(toLocalInput(src))
  assert.equal(back?.slice(0, 16), src.slice(0, 16)) // same minute after round-trip
  assert.equal(toLocalInput(null), '')
  assert.equal(fromLocalInput(''), null)
})

test('humanizeMs: two most-significant units', () => {
  assert.equal(humanizeMs((2 * 86400 + 3 * 3600 + 4 * 60) * 1000), '2d 3h')
  assert.equal(humanizeMs(5 * 60 * 1000), '5m')
  assert.equal(humanizeMs(45 * 1000), '45s')
  assert.equal(humanizeMs(0), 'now')
})

test('scheduleView: draft / scheduled / live / expiring / expired / archived', () => {
  assert.equal(scheduleView({ status: 'draft', publishedAt: null, scheduledAt: null, expireAt: null }, NOW).state, 'draft')

  const sched = scheduleView({ status: 'scheduled', publishedAt: null, scheduledAt: iso('2026-06-02T12:00:00Z'), expireAt: null }, NOW)
  assert.equal(sched.state, 'scheduled')
  assert.equal(sched.countdownMs, 86400000)
  assert.match(sched.label, /Publishes in 1d/)

  const live = scheduleView({ status: 'published', publishedAt: iso('2026-05-01T00:00:00Z'), scheduledAt: null, expireAt: null }, NOW)
  assert.equal(live.state, 'live')

  const expiring = scheduleView({ status: 'published', publishedAt: iso('2026-05-01T00:00:00Z'), scheduledAt: null, expireAt: iso('2026-06-01T18:00:00Z') }, NOW)
  assert.equal(expiring.state, 'live')
  assert.match(expiring.label, /Expires in 6h/)

  const expired = scheduleView({ status: 'published', publishedAt: iso('2026-05-01T00:00:00Z'), scheduledAt: null, expireAt: iso('2026-05-31T00:00:00Z') }, NOW)
  assert.equal(expired.state, 'expired')

  assert.equal(scheduleView({ status: 'archived', publishedAt: null, scheduledAt: null, expireAt: null }, NOW).state, 'archived')
})

test('validateSchedule: past schedule + expiry-before-publish', () => {
  assert.equal(validateSchedule({ status: 'scheduled', scheduledAt: null, expireAt: null }, NOW).length, 1)
  assert.equal(validateSchedule({ status: 'scheduled', scheduledAt: iso('2026-05-01T00:00:00Z'), expireAt: null }, NOW)[0].message, 'Scheduled time is in the past.')
  assert.equal(validateSchedule({ status: 'scheduled', scheduledAt: iso('2026-07-01T00:00:00Z'), expireAt: null }, NOW).length, 0)
  // expiry before the scheduled publish
  assert.ok(validateSchedule({ status: 'scheduled', scheduledAt: iso('2026-07-01T00:00:00Z'), expireAt: iso('2026-06-15T00:00:00Z') }, NOW).some(i => /Expiry/.test(i.message)))
  // expiry in the past for a live article
  assert.ok(validateSchedule({ status: 'published', scheduledAt: null, expireAt: iso('2026-05-01T00:00:00Z') }, NOW).length > 0)
})

test('dueForPublish / dueForExpiry: cron selection', () => {
  const rows: SchedRow[] = [
    { id: 'a', status: 'scheduled', scheduledAt: iso('2026-06-01T11:00:00Z'), expireAt: null }, // due
    { id: 'b', status: 'scheduled', scheduledAt: iso('2026-06-02T00:00:00Z'), expireAt: null }, // future
    { id: 'c', status: 'published', scheduledAt: null, expireAt: iso('2026-06-01T00:00:00Z') }, // expired
    { id: 'd', status: 'published', scheduledAt: null, expireAt: iso('2026-07-01T00:00:00Z') }, // future
    { id: 'e', status: 'draft', scheduledAt: null, expireAt: null },
  ]
  assert.deepEqual(dueForPublish(rows, NOW), ['a'])
  assert.deepEqual(dueForExpiry(rows, NOW), ['c'])
})
