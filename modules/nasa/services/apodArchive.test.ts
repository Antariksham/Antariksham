/**
 * Unit tests for the APOD archive date-window logic and response mapping.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/nasa/services/apodArchive.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  APOD_EPOCH, PAGE_DAYS,
  isIsoDate, shiftIso, daysBetween, clampIso,
  latestWindow, olderWindow, windowEndingAt,
  apodPageUrl, cleanCredit, slimApodResponse, mergeApodPages,
} from './apodArchive.ts'

test('isIsoDate: accepts calendar dates, rejects junk and impossible dates', () => {
  assert.equal(isIsoDate('2026-07-29'), true)
  assert.equal(isIsoDate('1995-06-16'), true)
  assert.equal(isIsoDate('2026-7-9'), false)
  assert.equal(isIsoDate('2026-13-01'), false)
  assert.equal(isIsoDate('yesterday'), false)
  assert.equal(isIsoDate(20260729 as any), false)
})

test('shiftIso: crosses months, years and leap days in UTC', () => {
  assert.equal(shiftIso('2026-07-29', 1), '2026-07-30')
  assert.equal(shiftIso('2026-07-01', -1), '2026-06-30')
  assert.equal(shiftIso('2026-01-01', -1), '2025-12-31')
  assert.equal(shiftIso('2024-02-28', 1), '2024-02-29') // leap year
  assert.equal(shiftIso('2023-02-28', 1), '2023-03-01')
  assert.equal(shiftIso('2026-07-29', 0), '2026-07-29')
})

test('daysBetween: signed whole-day difference', () => {
  assert.equal(daysBetween('2026-07-01', '2026-07-29'), 28)
  assert.equal(daysBetween('2026-07-29', '2026-07-01'), -28)
  assert.equal(daysBetween('2026-07-29', '2026-07-29'), 0)
})

test('clampIso: bounded by the APOD epoch and the latest entry', () => {
  assert.equal(clampIso('1990-01-01', '2026-07-29'), APOD_EPOCH)
  assert.equal(clampIso('2030-01-01', '2026-07-29'), '2026-07-29')
  assert.equal(clampIso('2020-05-05', '2026-07-29'), '2020-05-05')
})

test('latestWindow: spans PAGE_DAYS and leaves the end open', () => {
  const w = latestWindow('2026-07-29')
  // An explicit future end_date makes the API 400 — the newest window must
  // never send one.
  assert.equal(w.end, null)
  assert.equal(w.start, '2026-07-06')
  assert.equal(daysBetween(w.start, '2026-07-29') + 1, PAGE_DAYS)
})

test('latestWindow: never starts before the first APOD', () => {
  assert.equal(latestWindow('1995-06-20').start, APOD_EPOCH)
})

test('olderWindow: contiguous, non-overlapping pages walking backwards', () => {
  const first = latestWindow('2026-07-29')          // 2026-07-06 → latest
  const second = olderWindow(first.start)!
  assert.equal(second.end, '2026-07-05')            // exactly one day older
  assert.equal(second.start, '2026-06-12')
  const third = olderWindow(second.start)!
  assert.equal(third.end, '2026-06-11')
})

test('olderWindow: clamps at the epoch, then returns null', () => {
  const w = olderWindow('1995-06-30')!
  assert.equal(w.start, APOD_EPOCH)
  assert.equal(w.end, '1995-06-29')
  assert.equal(olderWindow(APOD_EPOCH), null)
  assert.equal(olderWindow('1995-06-17')?.end, APOD_EPOCH)
  assert.equal(olderWindow('1990-01-01'), null)
})

test('windowEndingAt: jumps to a date, clamping and keeping today open-ended', () => {
  const mid = windowEndingAt('2020-05-20', '2026-07-29')
  assert.equal(mid.end, '2020-05-20')
  assert.equal(mid.start, '2020-04-27')

  // Jumping to (or past) the newest date leaves the end open so today shows.
  assert.equal(windowEndingAt('2026-07-29', '2026-07-29').end, null)
  assert.equal(windowEndingAt('2031-01-01', '2026-07-29').end, null)
  // Below the epoch clamps up.
  assert.equal(windowEndingAt('1900-01-01', '2026-07-29').start, APOD_EPOCH)
})

test('apodPageUrl: two-digit year permalink', () => {
  assert.equal(apodPageUrl('2026-07-20'), 'https://apod.nasa.gov/apod/ap260720.html')
  assert.equal(apodPageUrl('1995-06-16'), 'https://apod.nasa.gov/apod/ap950616.html')
})

test('cleanCredit: collapses newlines, falls back to NASA', () => {
  assert.equal(cleanCredit('Monica Mesa\n Text: \nCecilia Ch'), 'Monica Mesa Text: Cecilia Ch')
  assert.equal(cleanCredit('   '), 'NASA')
  assert.equal(cleanCredit(undefined), 'NASA')
  assert.equal(cleanCredit(42), 'NASA')
})

const FIXTURE = [
  {
    date: '2026-07-20', title: 'The Statue of Liberty Nebula', media_type: 'image',
    url: 'http://apod.nasa.gov/apod/image/2607/LibertyNeb_960.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/2607/LibertyNeb_full.jpg',
    explanation: 'A nebula shaped like a statue.', copyright: 'Logan\nCarpenter',
  },
  {
    date: '2026-07-26', title: 'TNG50: A Galaxy Cluster Forms', media_type: 'video',
    url: 'https://apod.nasa.gov/apod/image/2607/ClusterFormation.mp4',
    thumbnail_url: 'https://apod.nasa.gov/apod/image/2607/ClusterFormation_thumb.jpg',
    explanation: 'A simulation.',
  },
  { date: 'not-a-date', title: 'Broken', media_type: 'image', url: 'https://x/y.jpg' },
  { date: '2026-07-22', title: 'No usable still', media_type: 'video' },
]

test('slimApodResponse: maps, orders newest-first and skips unusable entries', () => {
  const items = slimApodResponse(FIXTURE)
  assert.deepEqual(items.map(i => i.date), ['2026-07-26', '2026-07-20'])

  const [video, image] = items
  assert.equal(video.thumb, 'https://apod.nasa.gov/apod/image/2607/ClusterFormation_thumb.jpg')
  assert.equal(video.mediaType, 'video')
  assert.equal(video.credit, 'NASA', 'missing copyright falls back')
  assert.equal(video.hdurl, null)

  assert.ok(image.thumb.startsWith('https://'), 'http upgraded')
  assert.equal(image.credit, 'Logan Carpenter')
  assert.equal(image.sourceUrl, 'https://apod.nasa.gov/apod/ap260720.html')
  assert.equal(image.id, image.date)
})

test('slimApodResponse: accepts a single object and survives junk payloads', () => {
  assert.equal(slimApodResponse(FIXTURE[0]).length, 1)
  assert.deepEqual(slimApodResponse(null), [])
  assert.deepEqual(slimApodResponse('nope'), [])
  assert.deepEqual(slimApodResponse([]), [])
})

test('mergeApodPages: de-dupes by date and keeps newest-first order', () => {
  const page1 = slimApodResponse(FIXTURE)
  const page2 = slimApodResponse([
    { date: '2026-07-19', title: 'Older', media_type: 'image', url: 'https://a/b.jpg' },
    { date: '2026-07-20', title: 'Duplicate day', media_type: 'image', url: 'https://a/c.jpg' },
  ])
  const merged = mergeApodPages(page1, page2)
  assert.deepEqual(merged.map(i => i.date), ['2026-07-26', '2026-07-20', '2026-07-19'])
  // Later page wins for a repeated date — one entry per day, always.
  assert.equal(merged[1].title, 'Duplicate day')
})
