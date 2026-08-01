/**
 * Unit tests for the Internal Linking Assistant (Phase 2, Feature 6).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/links/internalLinks.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  significantTokens, relevance, suggestLinks, searchTargets,
  extractInternalHrefs, findBrokenLinks, computeOrphans, buildLinkHtml,
  type LinkTarget,
} from './internalLinks.ts'

const targets: LinkTarget[] = [
  { kind: 'article', title: 'Water Ice on the Moon', href: '/article/water-ice', slug: 'water-ice', categories: ['NASA'], tags: ['moon'] },
  { kind: 'mission', title: 'Artemis II', href: '/mission/artemis-ii', slug: 'artemis-ii' },
  { kind: 'learn',   title: 'What Is a Lunar Orbit', href: '/learn/lunar-orbit', slug: 'lunar-orbit' },
  { kind: 'author',  title: 'Jane Doe', href: '/authors/jane-doe', slug: 'jane-doe' },
]

test('significantTokens: drops short words and stopwords', () => {
  assert.deepEqual(significantTokens('Water Ice on the Moon'), ['water', 'ice', 'moon'])
  assert.deepEqual(significantTokens('The and for'), [])
})

test('relevance: rewards matched title tokens + full-title + facet overlap', () => {
  const text = 'nasa found water ice near the lunar south pole on the moon'.toLowerCase()
  const r = relevance(text, targets[0], { categories: ['NASA'], tags: ['moon'] })
  assert.ok(r >= 5) // water+ice+moon tokens (3) + category(2) + tag(1)
  assert.equal(relevance('completely unrelated text', targets[1]), 0)
})

test('suggestLinks: ranks relevant targets, excludes self + already-linked', () => {
  const text = 'The Artemis II mission will study water ice and lunar orbit dynamics.'
  const s = suggestLinks(text, targets, { selfHref: '/article/water-ice', linkedHrefs: ['/mission/artemis-ii'] })
  const hrefs = s.map(x => x.target.href)
  assert.equal(hrefs.includes('/article/water-ice'), false) // self excluded
  assert.equal(hrefs.includes('/mission/artemis-ii'), false) // already linked
  assert.equal(hrefs.includes('/learn/lunar-orbit'), true)    // "lunar orbit" matches
})

test('suggestLinks: honours the limit and returns descending scores', () => {
  const s = suggestLinks('water ice moon artemis lunar orbit jane doe', targets, { limit: 2 })
  assert.equal(s.length, 2)
  assert.ok(s[0].score >= s[1].score)
})

test('searchTargets: substring match + linked flag', () => {
  const res = searchTargets('artemis', targets, ['/mission/artemis-ii'])
  assert.equal(res.length, 1)
  assert.equal(res[0].linked, true)
  assert.equal(searchTargets('', targets).length, 4)
})

test('extractInternalHrefs: only root-relative, de-duplicated', () => {
  const html = '<p><a href="/article/a">x</a> <a href="https://x.test">y</a> <a href="/article/a">z</a> <a href="#top">t</a></p>'
  assert.deepEqual(extractInternalHrefs(html), ['/article/a'])
})

test('findBrokenLinks: internal links not among the known targets', () => {
  const html = '<a href="/article/water-ice">ok</a> <a href="/article/missing">bad</a> <a href="/mission/artemis-ii?x=1">ok2</a>'
  const broken = findBrokenLinks(html, targets.map(t => t.href))
  assert.deepEqual(broken, ['/article/missing'])
})

test('computeOrphans: pages nothing links to', () => {
  const nodes = [
    { href: '/article/a', outbound: ['/article/b'] },
    { href: '/article/b', outbound: [] },
    { href: '/article/c', outbound: ['/article/b'] }, // c is orphan (no inbound)
  ]
  assert.deepEqual(computeOrphans(nodes).sort(), ['/article/a', '/article/c'])
})

test('buildLinkHtml: escaped internal anchor', () => {
  assert.equal(buildLinkHtml('/article/a', 'Read <this>'), '<a href="/article/a">Read &lt;this&gt;</a>')
})
