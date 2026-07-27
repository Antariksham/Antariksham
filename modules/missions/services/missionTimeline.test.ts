/**
 * Unit tests for the Advanced Timeline logic (Phase 1, Feature 5).
 *
 *   node --test --experimental-strip-types modules/missions/services/missionTimeline.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TIMELINE_STATUSES, TIMELINE_IMPORTANCE, TIMELINE_EVENT_TYPES,
  timelineStatusMeta, timelineImportanceMeta,
  normalizeTimelineEvent, normalizeTimeline,
  parseEventDate, sortTimelineByDate, duplicateDateIndexes, duplicateDateValues,
  validateTimeline,
} from './missionTimeline.ts'

test('taxonomies present', () => {
  assert.equal(TIMELINE_STATUSES.length, 5)
  assert.equal(TIMELINE_IMPORTANCE.length, 4)
  assert.equal(TIMELINE_EVENT_TYPES.length, 17) // + custom handled as a free value
  assert.equal(timelineStatusMeta('delayed').label, 'Delayed')
  assert.equal(timelineImportanceMeta('critical').label, 'Critical')
  assert.equal(timelineStatusMeta('nonsense').label, 'Upcoming') // fallback
})

test('normalizeTimelineEvent: status wins and syncs completed', () => {
  const e = normalizeTimelineEvent({ title: 'Launch', status: 'completed', completed: false })
  assert.equal(e.completed, true)   // status=completed forces completed
  assert.equal(e.status, 'completed')
})

test('normalizeTimelineEvent: derives status from completed when no status', () => {
  assert.equal(normalizeTimelineEvent({ completed: true }).status, 'completed')
  assert.equal(normalizeTimelineEvent({ completed: false }).status, 'upcoming')
})

test('normalizeTimelineEvent: defaults, trims, generates an id', () => {
  const e = normalizeTimelineEvent({ title: '  Flyby  ', date: ' 2024-11-15 ' })
  assert.equal(e.title, 'Flyby')
  assert.equal(e.date, '2024-11-15')
  assert.equal(e.importance, 'normal')       // default
  assert.ok(e.id && e.id.startsWith('evt-'))  // generated
})

test('normalizeTimelineEvent: preserves an existing id + rich fields', () => {
  const e = normalizeTimelineEvent({ id: 'keep-me', title: 'x', location: 'KSC', eventType: 'Launch', sourceUrl: 'https://a.b' })
  assert.equal(e.id, 'keep-me')
  assert.equal(e.location, 'KSC')
  assert.equal(e.eventType, 'Launch')
})

test('normalizeTimeline: tolerates non-arrays', () => {
  assert.deepEqual(normalizeTimeline(null), [])
  assert.equal(normalizeTimeline([{ title: 'a' }, { title: 'b' }]).length, 2)
})

test('parseEventDate: ISO, month-year, year-only, empty, garbage', () => {
  assert.ok(parseEventDate('2024-11-15')! > 0)
  assert.ok(parseEventDate('Nov 2024')! > 0)
  assert.ok(parseEventDate('2019')! > 0)   // year-only fallback
  assert.equal(parseEventDate(''), null)
  assert.equal(parseEventDate('someday'), null)
})

test('sortTimelineByDate: ascending, unparseable last, stable, non-mutating', () => {
  const input = normalizeTimeline([
    { title: 'C', date: 'someday' },
    { title: 'A', date: '2020-01-01' },
    { title: 'B', date: '2022-06-01' },
    { title: 'D', date: 'later' },
  ])
  const sorted = sortTimelineByDate(input)
  assert.deepEqual(sorted.map(e => e.title), ['A', 'B', 'C', 'D']) // C before D (stable)
  assert.equal(input[0].title, 'C') // original not mutated
})

test('duplicate date detection', () => {
  const events = normalizeTimeline([
    { title: 'a', date: 'Nov 2024' },
    { title: 'b', date: '2020' },
    { title: 'c', date: 'nov 2024' }, // case-insensitive match with a
    { title: 'd', date: '' },          // empty ignored
  ])
  assert.deepEqual(duplicateDateIndexes(events), [0, 2])
  assert.deepEqual(duplicateDateValues(events), ['Nov 2024'])
})

test('validateTimeline: duplicate dates warn (not block)', () => {
  const events = normalizeTimeline([
    { title: 'a', date: '2024-01-01' },
    { title: 'b', date: '2024-01-01' },
  ])
  const issues = validateTimeline(events)
  assert.equal(issues.some(i => i.field === 'timeline' && i.level === 'warning'), true)
  assert.equal(issues.some(i => i.level === 'error'), false)
})

test('validateTimeline: invalid URL blocks', () => {
  const events = normalizeTimeline([{ title: 'a', sourceUrl: 'not a url' }])
  const issues = validateTimeline(events)
  assert.equal(issues.some(i => i.field.endsWith('.sourceUrl') && i.level === 'error'), true)
})

test('validateTimeline: missing title with content warns', () => {
  const events = normalizeTimeline([{ title: '', date: '2024-01-01', description: 'something' }])
  const issues = validateTimeline(events)
  assert.equal(issues.some(i => i.field.endsWith('.title') && i.level === 'warning'), true)
})

test('validateTimeline: a clean timeline has no issues', () => {
  const events = normalizeTimeline([
    { title: 'Launch', date: '2024-11-15', status: 'completed', sourceUrl: 'https://nasa.gov' },
    { title: 'Landing', date: '2025-02-01', status: 'upcoming' },
  ])
  assert.deepEqual(validateTimeline(events), [])
})
