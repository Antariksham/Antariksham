/**
 * Unit tests for the language ↔ path mapping that drives the universal
 * language switch.
 *
 * Zero-dependency: Node's built-in runner + assert, matching the rest of the
 * suite. Run with:
 *
 *     node --test --experimental-strip-types lib/i18n.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  stripLangPrefix, swapLangPath, pathLanguage, langPrefix, sectionHref,
} from './i18n.ts'

// ── stripLangPrefix ───────────────────────────────────────────────────────────

test('stripLangPrefix: splits a prefixed path into language + remainder', () => {
  assert.deepEqual(stripLangPrefix('/hi/articles'), { lang: 'hi', rest: '/articles' })
  assert.deepEqual(stripLangPrefix('/hi/article/water-on-the-moon'),
    { lang: 'hi', rest: '/article/water-on-the-moon' })
})

test('stripLangPrefix: an unprefixed path is the default language', () => {
  assert.deepEqual(stripLangPrefix('/articles'), { lang: 'en', rest: '/articles' })
  assert.deepEqual(stripLangPrefix('/'),         { lang: 'en', rest: '/' })
})

test('stripLangPrefix: the bare language root maps to the site root', () => {
  assert.deepEqual(stripLangPrefix('/hi'), { lang: 'hi', rest: '/' })
})

test('stripLangPrefix: matches whole segments, not string prefixes', () => {
  // The bug this guards: '/history' and '/hindi-rocketry' both START with 'hi'.
  // Naive startsWith('/hi') would serve them as Hindi and mangle the path.
  assert.deepEqual(stripLangPrefix('/history'),        { lang: 'en', rest: '/history' })
  assert.deepEqual(stripLangPrefix('/hindi-rocketry'), { lang: 'en', rest: '/hindi-rocketry' })
  assert.deepEqual(stripLangPrefix('/hi-res'),         { lang: 'en', rest: '/hi-res' })
})

test('stripLangPrefix: normalises trailing slashes and a missing leading slash', () => {
  assert.deepEqual(stripLangPrefix('/hi/articles/'), { lang: 'hi', rest: '/articles' })
  assert.deepEqual(stripLangPrefix('/hi/'),          { lang: 'hi', rest: '/' })
  assert.deepEqual(stripLangPrefix('articles'),      { lang: 'en', rest: '/articles' })
})

test('pathLanguage: reports the language a path renders in', () => {
  assert.equal(pathLanguage('/hi/learn/orbits'), 'hi')
  assert.equal(pathLanguage('/learn/orbits'),    'en')
  assert.equal(pathLanguage('/history'),         'en')
})

// ── swapLangPath ──────────────────────────────────────────────────────────────

test('swapLangPath: adds and removes the language prefix', () => {
  assert.equal(swapLangPath('/articles',    'hi'), '/hi/articles')
  assert.equal(swapLangPath('/hi/articles', 'en'), '/articles')
})

test('swapLangPath: handles the site root in both directions', () => {
  assert.equal(swapLangPath('/',   'hi'), '/hi')
  assert.equal(swapLangPath('/hi', 'en'), '/')
})

test('swapLangPath: is idempotent', () => {
  assert.equal(swapLangPath('/hi/articles', 'hi'), '/hi/articles')
  assert.equal(swapLangPath('/articles',    'en'), '/articles')
})

test('swapLangPath: round-trips back to the original path', () => {
  for (const path of ['/', '/articles', '/live/iss-tracker', '/article/a-slug', '/explore/topics/mars']) {
    assert.equal(swapLangPath(swapLangPath(path, 'hi'), 'en'), path)
  }
})

test('swapLangPath: preserves the query string and hash', () => {
  // Switching language on page 2 of a listing must keep the reader on page 2.
  assert.equal(swapLangPath('/articles?page=2',        'hi'), '/hi/articles?page=2')
  assert.equal(swapLangPath('/hi/articles?page=2',     'en'), '/articles?page=2')
  assert.equal(swapLangPath('/article/x#section-two',  'hi'), '/hi/article/x#section-two')
  assert.equal(swapLangPath('/search?q=mars&page=3',   'hi'), '/hi/search?q=mars&page=3')
})

test('swapLangPath: does not corrupt paths that merely start with a language code', () => {
  assert.equal(swapLangPath('/history', 'hi'), '/hi/history')
  assert.equal(swapLangPath('/hi/history', 'en'), '/history')
})

test('swapLangPath: agrees with langPrefix and sectionHref', () => {
  // The switch and the content links must agree, or a reader changing language
  // on an article lands somewhere the canonical/hreflang tags do not point.
  assert.equal(swapLangPath('/article/x', 'hi'), sectionHref('articles', 'x', 'hi'))
  assert.equal(swapLangPath('/hi/article/x', 'en'), sectionHref('articles', 'x', 'en'))
  assert.equal(swapLangPath('/', 'hi'), langPrefix('hi'))
})

test('swapLangPath: an unknown language code falls back to the default', () => {
  assert.equal(swapLangPath('/hi/articles', 'zz'), '/articles')
})
