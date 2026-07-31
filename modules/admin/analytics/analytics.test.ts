/**
 * Unit tests for the Analytics Dashboard core (Phase 2, Feature 5).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/analytics/analytics.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyReferrer, deviceFromUA, aggregateMetrics, bucketKey, timeSeries,
  breakdown, buildInsights, type AnalyticsEvent, type ArticleStat,
} from './analytics.ts'

const ev = (o: Partial<AnalyticsEvent>): AnalyticsEvent => ({
  articleId: 'a1', type: 'view', visitor: 'v1', session: 's1', device: 'desktop',
  refType: 'direct', referrer: '', country: 'US', scrollPct: 0, dwellMs: 0,
  createdAt: '2026-06-01T00:00:00Z', ...o,
})

test('classifyReferrer: search / social / self / referral / direct', () => {
  assert.equal(classifyReferrer('www.google.com'), 'organic')
  assert.equal(classifyReferrer('t.co'), 'social')
  assert.equal(classifyReferrer('x.com'), 'social')
  assert.equal(classifyReferrer('antariksham.org', 'antariksham.org'), 'direct')
  assert.equal(classifyReferrer('some-blog.example'), 'referral')
  assert.equal(classifyReferrer(''), 'direct')
})

test('deviceFromUA: mobile / tablet / desktop', () => {
  assert.equal(deviceFromUA('Mozilla/5.0 (iPhone; CPU iPhone OS) Mobile'), 'mobile')
  assert.equal(deviceFromUA('Mozilla/5.0 (iPad; CPU OS)'), 'tablet')
  assert.equal(deviceFromUA('Mozilla/5.0 (Linux; Android 13) ... Mobile Safari'), 'mobile')
  assert.equal(deviceFromUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop')
})

test('aggregateMetrics: views, unique/returning, reading, completion, bounce', () => {
  const events: AnalyticsEvent[] = [
    ev({ visitor: 'v1', session: 's1', type: 'view' }),
    ev({ visitor: 'v1', session: 's2', type: 'view' }), // v1 returning (2 sessions)
    ev({ visitor: 'v2', session: 's3', type: 'view' }),
    ev({ visitor: 'v1', session: 's1', type: 'read', scrollPct: 95, dwellMs: 120000 }), // completed
    ev({ visitor: 'v2', session: 's3', type: 'read', scrollPct: 10, dwellMs: 3000 }),   // bounce
    ev({ type: 'share' }), ev({ type: 'share' }), ev({ type: 'bookmark' }),
  ]
  const m = aggregateMetrics(events)
  assert.equal(m.views, 3)
  assert.equal(m.uniqueVisitors, 2)
  assert.equal(m.returningVisitors, 1)
  assert.equal(m.shares, 2)
  assert.equal(m.bookmarks, 1)
  assert.equal(m.completionRate, 50)       // 1 of 2 reads ≥90%
  assert.equal(m.avgScrollDepth, 53)       // (95+10)/2 ≈ 52.5 → 53
  assert.equal(m.avgReadingTimeSec, 62)    // (120+3)/2 ≈ 61.5 → 62
  assert.ok(m.bounceRate > 0 && m.bounceRate <= 100) // s3 bounced
})

test('bucketKey: day / month / year / week', () => {
  assert.equal(bucketKey('2026-06-15T12:00:00Z', 'day'), '2026-06-15')
  assert.equal(bucketKey('2026-06-15T12:00:00Z', 'month'), '2026-06')
  assert.equal(bucketKey('2026-06-15T12:00:00Z', 'year'), '2026')
  // 2026-06-15 is a Monday → week key is itself
  assert.equal(bucketKey('2026-06-17T12:00:00Z', 'week'), '2026-06-15')
})

test('timeSeries: counts per bucket, chronological', () => {
  const events = [
    ev({ createdAt: '2026-06-01T10:00:00Z' }),
    ev({ createdAt: '2026-06-01T14:00:00Z' }),
    ev({ createdAt: '2026-06-03T09:00:00Z' }),
    ev({ createdAt: '2026-06-02T09:00:00Z', type: 'read' }), // not a view
  ]
  assert.deepEqual(timeSeries(events, 'day'), [
    { key: '2026-06-01', value: 2 }, { key: '2026-06-03', value: 1 },
  ])
})

test('breakdown: grouped + sorted desc', () => {
  const events = [ev({ device: 'mobile' }), ev({ device: 'mobile' }), ev({ device: 'desktop' })]
  assert.deepEqual(breakdown(events, 'device'), [{ label: 'mobile', value: 2 }, { label: 'desktop', value: 1 }])
})

test('buildInsights: best, fastest-growing, top categories/tags/authors', () => {
  const stats: ArticleStat[] = [
    { id: 'a', title: 'A', author: 'Jane', categories: ['NASA'], tags: ['moon'], viewsRecent: 100, viewsPrev: 50, viewsTotal: 500 },
    { id: 'b', title: 'B', author: 'Jane', categories: ['NASA', 'SpaceX'], tags: ['reuse'], viewsRecent: 300, viewsPrev: 20, viewsTotal: 400 },
    { id: 'c', title: 'C', author: 'John', categories: ['ISRO'], tags: ['moon'], viewsRecent: 5, viewsPrev: 5, viewsTotal: 100 },
  ]
  const ins = buildInsights(stats)
  assert.equal(ins.bestPerforming?.id, 'a')                 // 500 total
  assert.equal(ins.fastestGrowing?.article.id, 'b')         // 20 → 300
  assert.equal(ins.topCategories[0].label, 'NASA')          // 500+400
  assert.equal(ins.topAuthors[0].label, 'Jane')             // 900
  assert.equal(ins.topTags[0].label, 'moon')                // 500+100=600 > reuse 400
})
