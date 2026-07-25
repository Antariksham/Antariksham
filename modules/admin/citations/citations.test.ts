/**
 * Unit tests for Reference & Citation Management (Phase 2, Feature 7).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/citations/citations.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyCitation, type Citation } from './citationTypes.ts'
import {
  formatAuthors, formatCitation, validateCitation, citationKey,
  inlineMarker, buildReferenceList, encodeCitation, decodeCitation, duplicateKeys,
} from './formatCitation.ts'

const make = (over: Partial<Citation>): Citation => ({ ...emptyCitation(over.type ?? 'journal'), ...over })

const journal = make({
  type: 'journal', title: 'Water on the Moon', authors: ['Smith, John M.', 'Doe, Alice'],
  year: '2026', container: 'Nature Astronomy', volume: '5', issue: '3', pages: '12-20', doi: '10.1038/s41550',
})

test('formatAuthors: APA uses "Last, I. I." joined with &', () => {
  assert.equal(formatAuthors(['Smith, John M.', 'Doe, Alice'], 'apa'), 'Smith, J. M., & Doe, A.')
})
test('formatAuthors: IEEE uses "I. I. Last" joined with and', () => {
  assert.equal(formatAuthors(['Smith, John M.', 'Doe, Alice'], 'ieee'), 'J. M. Smith and A. Doe')
})
test('formatAuthors: MLA inverts only the first author; 3+ → et al.', () => {
  assert.equal(formatAuthors(['Smith, John M.', 'Doe, Alice'], 'mla'), 'Smith, John M., and Alice Doe')
  assert.equal(formatAuthors(['Smith, John', 'Doe, A', 'Roe, B'], 'mla'), 'Smith, John, et al.')
})
test('formatAuthors: a single-token name is treated as an organisation', () => {
  assert.equal(formatAuthors(['NASA'], 'apa'), 'NASA')
})

test('formatCitation: APA journal — plain title, italic journal + volume', () => {
  const out = formatCitation(journal, 'apa')
  assert.equal(out,
    'Smith, J. M., & Doe, A. (2026). Water on the Moon. <em>Nature Astronomy</em>, <em>5</em>(3), 12-20. ' +
    '<a href="https://doi.org/10.1038/s41550">https://doi.org/10.1038/s41550</a>')
})
test('formatCitation: IEEE journal — quoted title, vol./no./pp.', () => {
  const out = formatCitation(journal, 'ieee')
  assert.match(out, /J\. M\. Smith and A\. Doe, &ldquo;Water on the Moon&rdquo;,/)
  assert.match(out, /<em>Nature Astronomy<\/em>, vol\. 5, no\. 3, pp\. 12-20, 2026\./)
})
test('formatCitation: MLA journal — quoted title, vol/no/year/pp', () => {
  const out = formatCitation(journal, 'mla')
  assert.match(out, /Smith, John M\., and Alice Doe\. &ldquo;Water on the Moon&rdquo;\./)
  assert.match(out, /<em>Nature Astronomy<\/em>, vol\. 5, no\. 3, 2026, pp\. 12-20\./)
})
test('formatCitation: Chicago journal — vol no (year): pages', () => {
  const out = formatCitation(journal, 'chicago')
  assert.match(out, /<em>Nature Astronomy<\/em> 5, no\. 3 \(2026\): 12-20\./)
})
test('formatCitation: APA book — italic title with edition + publisher', () => {
  const book = make({ type: 'book', title: 'Cosmos', authors: ['Sagan, Carl'], year: '1980', publisher: 'Random House', edition: '2nd', url: 'https://x.test/cosmos' })
  assert.equal(formatCitation(book, 'apa'),
    'Sagan, C. (1980). <em>Cosmos</em> (2nd ed.). Random House. <a href="https://x.test/cosmos">https://x.test/cosmos</a>')
})
test('formatCitation: custom style returns the verbatim (escaped) text', () => {
  const c = make({ custom: 'My hand-written <cite> reference' })
  assert.equal(formatCitation(c, 'custom'), 'My hand-written &lt;cite&gt; reference')
})
test('formatCitation: escapes user text (XSS-safe)', () => {
  const c = make({ title: '<img src=x onerror=alert(1)>', container: 'Journal' })
  const out = formatCitation(c, 'ieee')
  assert.equal(out.includes('<img'), false)
  assert.match(out, /&lt;img/)
})

test('validateCitation: flags missing title, source and year', () => {
  const issues = validateCitation(emptyCitation('journal'))
  assert.ok(issues.some(i => i.field === 'title' && i.level === 'error'))
  assert.ok(issues.some(i => i.field === 'authors' && i.level === 'error'))
  assert.ok(issues.some(i => i.field === 'year' && i.level === 'warning'))
})
test('validateCitation: flags a broken URL and a malformed DOI', () => {
  assert.ok(validateCitation(make({ title: 'T', container: 'C', year: '2026', url: 'not a url' })).some(i => i.field === 'url' && i.level === 'error'))
  assert.ok(validateCitation(make({ title: 'T', container: 'C', year: '2026', doi: 'nope' })).some(i => i.field === 'doi'))
})
test('validateCitation: a complete citation has no errors', () => {
  assert.equal(validateCitation(journal).filter(i => i.level === 'error').length, 0)
})

test('inlineMarker: builds a numbered, anchored superscript', () => {
  assert.equal(inlineMarker(3), '<sup class="cite-ref" id="cite-3"><a href="#ref-3">[3]</a></sup>')
})
test('buildReferenceList: numbered <ol> with data-cite + back-links', () => {
  const html = buildReferenceList([journal, make({ title: 'Second', container: 'X', year: '2025' })], 'apa')
  assert.match(html, /class="references citations"/)
  assert.match(html, /<li id="ref-1" data-cite="[^"]+">/)
  assert.match(html, /<li id="ref-2" data-cite="[^"]+">/)
  assert.match(html, /href="#cite-1" class="cite-back"/)
})
test('buildReferenceList: empty input yields empty string', () => {
  assert.equal(buildReferenceList([], 'apa'), '')
})
test('encode/decode: round-trips a citation (unicode-safe)', () => {
  const c = make({ title: 'चंद्रयान & "Chandrayaan"', authors: ['इसरो'] })
  const back = decodeCitation(encodeCitation(c))
  assert.deepEqual(back, c)
  assert.equal(decodeCitation('%%%not-json'), null)
})
test('duplicateKeys: detects repeated sources by key', () => {
  const dups = duplicateKeys([journal, { ...journal, id: 'x2' }, make({ title: 'Other', container: 'Y', year: '2020' })])
  assert.equal(dups.length, 1)
})
test('citationKey: stable across ids, differs by content', () => {
  assert.equal(citationKey(journal), citationKey({ ...journal, id: 'other' }))
  assert.notEqual(citationKey(journal), citationKey(make({ title: 'Different', container: 'Z', year: '1999' })))
})
