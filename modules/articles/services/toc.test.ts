/**
 * Unit tests for the automatic Table-of-Contents extraction logic.
 *
 * Zero-dependency: uses Node's built-in test runner + assert (no jest/vitest,
 * which this repo does not use). Run with:
 *
 *     node --test --experimental-strip-types modules/articles/services/toc.test.ts
 *
 * (Node 22+ strips the TypeScript types at load time.)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, buildToc, tocIds, tocCount, type TocItem } from './toc.ts'

test('slugify: lowercases, hyphenates and trims', () => {
  assert.equal(slugify('Hello World'), 'hello-world')
  assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces')
  assert.equal(slugify('Punctuation! & symbols?'), 'punctuation-symbols')
  assert.equal(slugify('--edge--'), 'edge')
})

test('slugify: strips inline tags and entities from heading text', () => {
  assert.equal(slugify('The <strong>Apollo</strong> Program'), 'the-apollo-program')
  assert.equal(slugify('Fuel &amp; Oxidiser'), 'fuel-oxidiser')
})

test('slugify: keeps non-Latin (Devanagari) characters', () => {
  const s = slugify('चंद्रयान मिशन')
  assert.equal(s.includes('-'), true)
  assert.notEqual(s, '') // must not collapse to empty for Hindi headings
})

test('buildToc: injects ids on h2/h3/h4 and returns them', () => {
  const html = '<h2>Overview</h2><p>x</p><h3>Details</h3><h4>Fine print</h4>'
  const { html: out, items } = buildToc(html)
  assert.match(out, /<h2 id="overview">Overview<\/h2>/)
  assert.match(out, /<h3 id="details">Details<\/h3>/)
  assert.match(out, /<h4 id="fine-print">Fine print<\/h4>/)
  assert.deepEqual(tocIds(items), ['overview', 'details', 'fine-print'])
})

test('buildToc: nests h3 under h2 and h4 under h3', () => {
  const html = '<h2>A</h2><h3>A1</h3><h4>A1a</h4><h3>A2</h3><h2>B</h2>'
  const { items } = buildToc(html)
  assert.equal(items.length, 2) // two h2 roots
  const [a, b] = items
  assert.equal(a.text, 'A')
  assert.equal(a.children.length, 2) // A1, A2
  assert.equal(a.children[0].text, 'A1')
  assert.equal(a.children[0].children.length, 1) // A1a
  assert.equal(a.children[0].children[0].text, 'A1a')
  assert.equal(b.text, 'B')
  assert.equal(b.children.length, 0)
})

test('buildToc: h4 under h2 with no intervening h3 still nests', () => {
  const { items } = buildToc('<h2>Top</h2><h4>Deep</h4>')
  assert.equal(items.length, 1)
  assert.equal(items[0].children.length, 1)
  assert.equal(items[0].children[0].text, 'Deep')
})

test('buildToc: content starting at h3 treats it as a root', () => {
  const { items } = buildToc('<h3>Standalone</h3><h4>Child</h4>')
  assert.equal(items.length, 1)
  assert.equal(items[0].level, 3)
  assert.equal(items[0].children[0].level, 4)
})

test('buildToc: de-duplicates repeated headings with numeric suffixes', () => {
  const { html: out, items } = buildToc('<h2>Notes</h2><h2>Notes</h2><h2>Notes</h2>')
  assert.match(out, /<h2 id="notes">Notes<\/h2>/)
  assert.match(out, /<h2 id="notes-2">Notes<\/h2>/)
  assert.match(out, /<h2 id="notes-3">Notes<\/h2>/)
  assert.deepEqual(tocIds(items), ['notes', 'notes-2', 'notes-3'])
})

test('buildToc: preserves an authored id and avoids colliding with it', () => {
  const { html: out, items } = buildToc('<h2 id="intro">Intro</h2><h2>Intro</h2>')
  assert.match(out, /<h2 id="intro">Intro<\/h2>/)
  // second "Intro" cannot reuse "intro" → gets a suffix
  assert.deepEqual(tocIds(items), ['intro', 'intro-2'])
})

test('buildToc: strips inline markup from the visible label', () => {
  const { items } = buildToc('<h2>The <em>Red</em> Planet</h2>')
  assert.equal(items[0].text, 'The Red Planet')
  assert.equal(items[0].id, 'the-red-planet')
})

test('buildToc: ignores empty / whitespace-only headings', () => {
  const { html: out, items } = buildToc('<h2></h2><h2>   </h2><h2>Real</h2>')
  assert.equal(tocCount(items), 1)
  assert.equal(items[0].text, 'Real')
  // empty headings are left untouched (no id injected)
  assert.match(out, /<h2><\/h2>/)
})

test('buildToc: leaves h1/h5/h6 and body content alone', () => {
  const html = '<h1>Title</h1><h5>Small</h5><p>Body</p>'
  const { html: out, items } = buildToc(html)
  assert.equal(out, html)
  assert.equal(items.length, 0)
})

test('buildToc: is deterministic (SSR/CSR produce identical ids)', () => {
  const html = '<h2>Same</h2><h3>Nested</h3><h2>Same</h2>'
  assert.deepEqual(buildToc(html), buildToc(html))
})

test('tocCount: counts every heading across depths', () => {
  const items: TocItem[] = buildToc('<h2>A</h2><h3>B</h3><h4>C</h4><h2>D</h2>').items
  assert.equal(tocCount(items), 4)
})

test('buildToc: empty input yields empty result', () => {
  assert.deepEqual(buildToc(''), { html: '', items: [] })
})
