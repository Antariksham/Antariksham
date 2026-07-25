/**
 * Unit tests for the advanced-article-component pure helpers.
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/articles/blocks/blocks.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeHtml, highlightCode, normalizeLang, countdownParts, isSafeHttpUrl, youtubeId,
} from './blockUtils.ts'

test('escapeHtml: neutralises HTML-significant characters', () => {
  assert.equal(escapeHtml('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;')
})

test('normalizeLang: maps aliases to families', () => {
  assert.equal(normalizeLang('typescript'), 'js')
  assert.equal(normalizeLang('tsx'), 'js')
  assert.equal(normalizeLang('python'), 'py')
  assert.equal(normalizeLang('bash'), 'sh')
  assert.equal(normalizeLang('scss'), 'css')
  assert.equal(normalizeLang('rust'), 'js')
  assert.equal(normalizeLang(undefined), 'default')
  assert.equal(normalizeLang('brainfuck'), 'default')
})

test('highlightCode: is XSS-safe — angle brackets in code are escaped', () => {
  const out = highlightCode('const x = a < b && c > d', 'js')
  assert.equal(out.includes('<b'), false) // no raw tags leak through
  assert.match(out, /&lt;/)
  assert.match(out, /&gt;/)
})

test('highlightCode: wraps keywords, strings and numbers', () => {
  const out = highlightCode('const n = 42 // note', 'js')
  assert.match(out, /<span class="tok-kw">const<\/span>/)
  assert.match(out, /<span class="tok-num">42<\/span>/)
  assert.match(out, /<span class="tok-com">\/\/ note<\/span>/)
  const s = highlightCode('x = "hi"', 'js')
  assert.match(s, /<span class="tok-str">&quot;hi&quot;<\/span>/)
})

test('highlightCode: keywords inside strings/comments are not re-highlighted', () => {
  const out = highlightCode('"const"', 'js')
  assert.equal(out.includes('tok-kw'), false)
  assert.match(out, /<span class="tok-str">/)
})

test('highlightCode: python uses # comments', () => {
  const out = highlightCode('x = 1 # comment', 'py')
  assert.match(out, /<span class="tok-com"># comment<\/span>/)
})

test('highlightCode: empty input yields empty string', () => {
  assert.equal(highlightCode('', 'js'), '')
})

test('countdownParts: splits a delta and clamps once elapsed', () => {
  const p = countdownParts((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000)
  assert.deepEqual(p, { days: 2, hours: 3, mins: 4, secs: 5, done: false })
  assert.deepEqual(countdownParts(0), { days: 0, hours: 0, mins: 0, secs: 0, done: true })
  assert.deepEqual(countdownParts(-1000), { days: 0, hours: 0, mins: 0, secs: 0, done: true })
})

test('isSafeHttpUrl: only absolute http(s), rejects javascript/data', () => {
  assert.equal(isSafeHttpUrl('https://nasa.gov/a.pdf'), true)
  assert.equal(isSafeHttpUrl('http://x.test'), true)
  assert.equal(isSafeHttpUrl('/relative'), false)
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false)
  assert.equal(isSafeHttpUrl('data:text/html,x'), false)
  assert.equal(isSafeHttpUrl(''), false)
})

test('youtubeId: extracts the 11-char id from common URL shapes', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(youtubeId('https://example.com/x'), null)
})
