/**
 * Unit tests for Advanced Search & Content Discovery (Phase 2, Feature 8).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/search/articleSearch.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyFilters, isFilterActive, matchesFilters, searchArticles, computeFacets, toCsv,
  type SearchableArticle, type SearchFilters,
} from './articleSearch.ts'

const A = (over: Partial<SearchableArticle>): SearchableArticle => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  title: 'Untitled', slug: 'untitled', status: 'published', articleType: 'explainer',
  featured: false, views: 0, readingTime: 5, publishedAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z', categories: [], tags: [], authorName: null, ...over,
})

const rows: SearchableArticle[] = [
  A({ id: '1', title: 'Artemis II Moon Flyby', slug: 'artemis-ii', status: 'published', articleType: 'mission-update', views: 1200, readingTime: 8, categories: ['NASA'], tags: ['moon', 'crewed'], authorName: 'Jane Doe', publishedAt: '2026-03-10T00:00:00Z' }),
  A({ id: '2', title: 'SpaceX Booster Reuse', slug: 'spacex-booster', status: 'draft', articleType: 'analysis', views: 50, readingTime: 3, categories: ['SpaceX'], tags: ['reuse'], authorName: 'John Roe', publishedAt: null, updatedAt: '2026-02-01T00:00:00Z' }),
  A({ id: '3', title: 'ISRO Chandrayaan Update', slug: 'isro-chandrayaan', status: 'archived', articleType: 'mission-update', views: 800, readingTime: 6, categories: ['ISRO', 'NASA'], tags: ['moon'], authorName: 'Jane Doe', publishedAt: '2026-01-15T00:00:00Z' }),
]

test('emptyFilters + isFilterActive: fresh filters are inactive', () => {
  assert.equal(isFilterActive(emptyFilters()), false)
  assert.equal(isFilterActive({ ...emptyFilters(), query: 'x' }), true)
  assert.equal(isFilterActive({ ...emptyFilters(), statuses: ['draft'] }), true)
})

test('query: every token must match (AND) across title/slug/author/category/tag', () => {
  const f: SearchFilters = { ...emptyFilters(), query: 'artemis moon' }
  assert.deepEqual(searchArticles(rows, f).map(r => r.id), ['1'])
  // matches author + category across fields
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), query: 'jane nasa' }).map(r => r.id).sort(), ['1', '3'])
  // no match
  assert.equal(searchArticles(rows, { ...emptyFilters(), query: 'artemis spacex' }).length, 0)
})

test('status + type filters', () => {
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), statuses: ['draft', 'archived'] }).map(r => r.id).sort(), ['2', '3'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), types: ['mission-update'] }).map(r => r.id).sort(), ['1', '3'])
})

test('category / tag / author filters use OR within a facet', () => {
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), categories: ['NASA'] }).map(r => r.id).sort(), ['1', '3'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), tags: ['reuse', 'crewed'] }).map(r => r.id).sort(), ['1', '2'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), authors: ['John Roe'] }).map(r => r.id), ['2'])
})

test('numeric ranges: views + reading time', () => {
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), viewsMin: 100 }).map(r => r.id).sort(), ['1', '3'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), viewsMin: 100, viewsMax: 1000 }).map(r => r.id), ['3'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), readingMax: 5 }).map(r => r.id), ['2'])
})

test('date range filters on published||updated', () => {
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), dateFrom: '2026-02-01' }).map(r => r.id).sort(), ['1', '2'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), dateTo: '2026-01-31' }).map(r => r.id), ['3'])
})

test('featuredOnly', () => {
  const withFeat = [...rows, A({ id: '4', featured: true, title: 'Featured' })]
  assert.deepEqual(searchArticles(withFeat, { ...emptyFilters(), featuredOnly: true }).map(r => r.id), ['4'])
})

test('sort: by views desc / asc, title, and does not mutate input', () => {
  const original = rows.map(r => r.id)
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), sort: 'views', sortDir: 'desc' }).map(r => r.id), ['1', '3', '2'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), sort: 'views', sortDir: 'asc' }).map(r => r.id), ['2', '3', '1'])
  assert.deepEqual(searchArticles(rows, { ...emptyFilters(), sort: 'title', sortDir: 'asc' }).map(r => r.title)[0], 'Artemis II Moon Flyby')
  assert.deepEqual(rows.map(r => r.id), original) // input untouched
})

test('matchesFilters: combined filters', () => {
  const f: SearchFilters = { ...emptyFilters(), statuses: ['published'], categories: ['NASA'], viewsMin: 1000 }
  assert.equal(matchesFilters(rows[0], f), true)   // Artemis, published, NASA, 1200 views
  assert.equal(matchesFilters(rows[2], f), false)  // archived
})

test('computeFacets: distinct values with counts, sorted by count', () => {
  const f = computeFacets(rows)
  assert.deepEqual(f.categories.find(c => c.value === 'NASA'), { value: 'NASA', count: 2 })
  assert.deepEqual(f.statuses.map(s => s.value).sort(), ['archived', 'draft', 'published'])
  assert.equal(f.authors.find(a => a.value === 'Jane Doe')?.count, 2)
  assert.equal(f.tags.find(t => t.value === 'moon')?.count, 2)
})

test('toCsv: header + escaped rows', () => {
  const csv = toCsv([A({ title: 'Hi, "quoted"', slug: 's', status: 'draft', views: 3 })])
  const [head, line] = csv.split('\n')
  assert.match(head, /^title,slug,status,type,author/)
  assert.match(line, /"Hi, ""quoted"""/) // comma + quotes escaped
})
