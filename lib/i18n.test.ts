/**
 * Crossing between languages.
 *
 * `counterpartPath` is what the nav's language switch points at, so it runs on
 * every route on the site — including all the ones that have no translation.
 * The failure modes worth pinning are the quiet ones: sending a reader to a
 * route that does not exist, double-prefixing a path that is already Hindi, or
 * over-matching a section name against a URL that merely starts with the same
 * letters (`/articles` vs `/article/:slug` is the pair that actually bites,
 * and `/missions` vs `/mission/:slug` is the same trap again).
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types lib/i18n.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  langFromPathname,
  stripLangPrefix,
  counterpartPath,
  sectionHref,
  sectionListHref,
} from './i18n.ts'

test('langFromPathname: reads the prefix, and only as a whole segment', () => {
  assert.equal(langFromPathname('/'), 'en')
  assert.equal(langFromPathname('/articles'), 'en')
  assert.equal(langFromPathname('/hi'), 'hi')
  assert.equal(langFromPathname('/hi/learn/orbits'), 'hi')
  // The one that would over-match: a path that merely starts with the letters.
  assert.equal(langFromPathname('/history-of-flight'), 'en')
  assert.equal(langFromPathname('/hidden'), 'en')
})

test('stripLangPrefix: removes the prefix and never returns an empty path', () => {
  assert.equal(stripLangPrefix('/hi'), '/')
  assert.equal(stripLangPrefix('/hi/articles'), '/articles')
  assert.equal(stripLangPrefix('/hi/article/water-on-the-moon'), '/article/water-on-the-moon')
  assert.equal(stripLangPrefix('/learn'), '/learn')
  assert.equal(stripLangPrefix('/'), '/')
})

test('counterpartPath: translated sections map straight across', () => {
  for (const [en, hi] of [
    ['/',                    '/hi'],
    ['/articles',            '/hi/articles'],
    ['/article/moon-water',  '/hi/article/moon-water'],
    ['/learn',               '/hi/learn'],
    ['/learn/how-orbits-work', '/hi/learn/how-orbits-work'],
    ['/missions',            '/hi/missions'],
    ['/mission/artemis-ii',  '/hi/mission/artemis-ii'],
  ]) {
    assert.equal(counterpartPath(en, 'hi'), hi, `${en} → hi`)
    assert.equal(counterpartPath(hi, 'en'), en, `${hi} → en`)
  }
})

test('counterpartPath: untranslated routes fall back to the language home', () => {
  // These have no /hi counterpart, so the switch must not invent one.
  for (const path of [
    '/live', '/live/iss-tracker', '/explore', '/explore/topics/black-holes',
    '/gallery/apod', '/about', '/privacy', '/lunar-sim', '/search',
    '/authors/someone',
  ]) {
    assert.equal(counterpartPath(path, 'hi'), '/hi', `${path} → hi`)
    assert.equal(counterpartPath(path, 'en'), '/',   `${path} → en`)
  }
})

test('counterpartPath: switching to the language you are already in is a no-op', () => {
  assert.equal(counterpartPath('/hi/learn', 'hi'), '/hi/learn')
  assert.equal(counterpartPath('/learn', 'en'), '/learn')
  // Never double-prefixes.
  assert.equal(counterpartPath('/hi/articles', 'hi'), '/hi/articles')
})

test('counterpartPath: agrees with the href builders it has to match', () => {
  // The switch and the page links must land on the same URL, or crossing
  // languages would bounce a reader somewhere the toggle disagrees with.
  assert.equal(counterpartPath('/article/x', 'hi'), sectionHref('articles', 'x', 'hi'))
  assert.equal(counterpartPath('/learn/x', 'hi'),   sectionHref('learn', 'x', 'hi'))
  assert.equal(counterpartPath('/mission/x', 'hi'), sectionHref('missions', 'x', 'hi'))
  assert.equal(counterpartPath('/articles', 'hi'),  sectionListHref('articles', 'hi'))
  assert.equal(counterpartPath('/learn', 'hi'),     sectionListHref('learn', 'hi'))
  assert.equal(counterpartPath('/missions', 'hi'),  sectionListHref('missions', 'hi'))
})
