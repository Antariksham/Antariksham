import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  groupSearchRows,
  suggestionsFromFuzzy,
  isMissingFunction,
  type SearchRow,
  type FuzzyRow,
} from './searchRows.ts'

const row = (over: Partial<SearchRow> = {}): SearchRow => ({
  kind: 'article', id: 'a1', slug: 'slug', title: 'Title', excerpt: 'Excerpt',
  rank: 1, extra: {}, ...over,
})

test('groupSearchRows: splits kinds into their own buckets and totals them', () => {
  const out = groupSearchRows([
    row({ kind: 'article', id: 'a1' }),
    row({ kind: 'mission', id: 'm1' }),
    row({ kind: 'learn',   id: 'k1' }),
    row({ kind: 'article', id: 'a2' }),
  ], 'q')

  assert.equal(out.articles.length, 2)
  assert.equal(out.missions.length, 1)
  assert.equal(out.learn.length, 1)
  assert.equal(out.total, 4)
  assert.equal(out.query, 'q')
})

test('groupSearchRows: keeps rank order inside each group', () => {
  const out = groupSearchRows([
    row({ id: 'best',   rank: 9 }),
    row({ id: 'middle', rank: 5 }),
    row({ id: 'worst',  rank: 1 }),
  ], 'q')
  assert.deepEqual(out.articles.map(a => a.id), ['best', 'middle', 'worst'])
})

test('groupSearchRows: unknown kinds are dropped, not thrown on', () => {
  // Guards the deploy order: SQL may gain a content type before the client knows it.
  const out = groupSearchRows([row({ kind: 'podcast' }), row({ kind: 'article' })], 'q')
  assert.equal(out.total, 1)
})

test('groupSearchRows: maps the jsonb extras onto each type', () => {
  const out = groupSearchRows([
    row({ kind: 'article', extra: { articleType: 'analysis', readingTime: 12, category: 'Missions', publishedAt: '2026-01-01' } }),
    row({ kind: 'mission', extra: { status: 'active', missionType: 'Rover', destination: 'Mars', agency: 'NASA' } }),
    row({ kind: 'learn',   extra: { difficultyLevel: 'advanced', icon: '🚀' } }),
  ], 'q')

  assert.equal(out.articles[0].articleType, 'analysis')
  assert.equal(out.articles[0].readingTime, 12)
  assert.equal(out.articles[0].category,    'Missions')
  assert.equal(out.missions[0].destination, 'Mars')
  assert.equal(out.missions[0].agency,      'NASA')
  assert.equal(out.learn[0].difficultyLevel, 'advanced')
  assert.equal(out.learn[0].icon, '🚀')
})

test('groupSearchRows: missing or wrongly-typed extras fall back rather than leak undefined', () => {
  const out = groupSearchRows([
    row({ kind: 'article', extra: null }),
    row({ kind: 'learn',   extra: { difficultyLevel: 42, icon: null } as never }),
  ], 'q')

  assert.equal(out.articles[0].articleType, 'news')
  assert.equal(out.articles[0].readingTime, 5)
  assert.equal(out.articles[0].category,    null)
  assert.equal(out.learn[0].difficultyLevel, 'beginner')
  assert.equal(out.learn[0].icon, '🔭')
})

test('groupSearchRows: a null title or excerpt becomes an empty string', () => {
  const out = groupSearchRows([row({ title: null, excerpt: null })], 'q')
  assert.equal(out.articles[0].title, '')
  assert.equal(out.articles[0].excerpt, '')
})

const fz = (title: string, sim: number, kind = 'article'): FuzzyRow =>
  ({ kind, id: title, slug: title, title, sim })

test('suggestionsFromFuzzy: orders by similarity, and de-duping keeps the best-scoring casing', () => {
  const out = suggestionsFromFuzzy([
    fz('Heat Shield', 0.4),
    fz('Starship', 0.9),
    fz('heat shield', 0.8, 'learn'),
  ])
  // Both spellings of the same title collapse to one entry, and the surviving
  // one is the higher-scoring row (0.8) rather than whichever came first.
  assert.deepEqual(out, ['Starship', 'heat shield'])
})

test('suggestionsFromFuzzy: honours the limit and skips blank titles', () => {
  assert.equal(suggestionsFromFuzzy([fz('a', 0.9), fz('b', 0.8), fz('c', 0.7)], 2).length, 2)
  assert.deepEqual(suggestionsFromFuzzy([fz('   ', 0.9), fz('ok', 0.5)]), ['ok'])
})

test('isMissingFunction: recognises "migration not applied yet", not real failures', () => {
  assert.equal(isMissingFunction({ code: 'PGRST202' }), true)
  assert.equal(isMissingFunction({ code: '42883' }), true)
  assert.equal(isMissingFunction({ message: 'Could not find the function public.search_content' }), true)
  // A permissions or network failure must NOT be mistaken for a missing function,
  // or a real outage would be silently downgraded to the legacy path.
  assert.equal(isMissingFunction({ code: '42501', message: 'permission denied' }), false)
  assert.equal(isMissingFunction(null), false)
})
