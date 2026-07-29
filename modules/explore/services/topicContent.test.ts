/**
 * Unit tests for topic-hub ranking, de-duping and filter building.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/explore/services/topicContent.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreByTerms, rankByTerms, dedupeById, buildOrFilter } from './topicContent.ts'
import { TOPICS, TOPIC_BY_SLUG, getTopic } from './topics.ts'
import { BODY_BY_ID } from './solarSystemBodies.ts'

test('scoreByTerms: title hits outweigh body hits; destination counts', () => {
  const terms = ['mars']
  assert.equal(scoreByTerms({ title: 'Mars Sample Return' }, terms), 3)
  assert.equal(scoreByTerms({ excerpt: 'a probe bound for mars' }, terms), 1)
  assert.equal(scoreByTerms({ destination: 'Mars orbit' }, terms), 2)
  assert.equal(scoreByTerms({ title: 'Mars', excerpt: 'mars' }, terms), 4)
  assert.equal(scoreByTerms({ title: 'Venus Express' }, terms), 0)
})

test('scoreByTerms: case-insensitive and multi-term additive', () => {
  assert.equal(scoreByTerms({ title: 'APOLLO and Artemis' }, ['apollo', 'artemis']), 6)
})

test('scoreByTerms: no terms or empty terms score zero', () => {
  assert.equal(scoreByTerms({ title: 'Anything' }, []), 0)
  assert.equal(scoreByTerms({ title: 'Anything' }, ['']), 0)
})

test('rankByTerms: orders by score, drops non-matches, honours the limit', () => {
  const items = [
    { id: 'a', title: 'Life on Venus?', excerpt: 'mars gets a mention' }, // 1
    { id: 'b', title: 'Mars Sample Return', excerpt: 'mars mars' },       // 3+1
    { id: 'c', title: 'Unrelated' },                                      // 0 → dropped
    { id: 'd', title: 'Mars weather' },                                   // 3
  ]
  const out = rankByTerms(items, ['mars'], 10)
  assert.deepEqual(out.map(i => i.id), ['b', 'd', 'a'])
  assert.equal(rankByTerms(items, ['mars'], 2).length, 2)
})

test('rankByTerms: equal scores break by newest date, then input order', () => {
  const items = [
    { id: 'old', title: 'Mars', date: '2020-01-01' },
    { id: 'new', title: 'Mars', date: '2024-06-01' },
    { id: 'none', title: 'Mars', date: null },
  ]
  assert.deepEqual(rankByTerms(items, ['mars'], 10).map(i => i.id), ['new', 'old', 'none'])
})

test('dedupeById: keeps the first occurrence only', () => {
  const out = dedupeById([{ id: '1', n: 'a' }, { id: '2', n: 'b' }, { id: '1', n: 'c' }])
  assert.deepEqual(out.map(o => o.n), ['a', 'b'])
})

test('buildOrFilter: one clause per term × column, PostgREST syntax stripped', () => {
  assert.equal(
    buildOrFilter(['mars'], ['title', 'excerpt']),
    'title.ilike.%mars%,excerpt.ilike.%mars%',
  )
  // Commas/parens/stars would corrupt the .or() grammar.
  assert.equal(buildOrFilter(['a,b(c)*'], ['title']), 'title.ilike.%abc%')
  assert.equal(buildOrFilter(['', '  '], ['title']), '')
})

test('registry: slugs are unique, url-safe, and fully resolvable', () => {
  const slugs = TOPICS.map(t => t.slug)
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slug')
  for (const t of TOPICS) {
    assert.match(t.slug, /^[a-z0-9-]+$/, `bad slug: ${t.slug}`)
    assert.ok(t.terms.length > 0, `${t.slug} has no terms`)
    assert.ok(t.name && t.tagline && t.description && t.galleryQuery, `${t.slug} missing copy`)
    assert.equal(getTopic(t.slug), t)
    assert.equal(TOPIC_BY_SLUG[t.slug], t)
  }
  assert.equal(getTopic('does-not-exist'), null)
})

test('registry: every internal link is a root-relative path', () => {
  for (const t of TOPICS) {
    for (const l of t.links ?? []) {
      assert.ok(l.href.startsWith('/'), `${t.slug}: ${l.href} is not root-relative`)
      assert.ok(l.label.length > 0)
    }
  }
})

test('registry: every bodyId resolves in the Solar System registry', () => {
  // A stale bodyId would render a dead "view in the explorer" deep link.
  for (const t of TOPICS) {
    if (t.bodyId) assert.ok(BODY_BY_ID[t.bodyId], `${t.slug}: unknown bodyId "${t.bodyId}"`)
  }
})
