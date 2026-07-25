/**
 * Unit tests for the Professional Reader Experience pure helpers.
 * Zero-dependency (Node's built-in test runner). Run with:
 *   node --test --experimental-strip-types modules/articles/reader/reader.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildShareTargets } from './shareLinks.ts'
import {
  normalizePrefs, prefsToVars, minutesLeft, DEFAULT_PREFS,
  FONT_SCALE, LINE_VALUE, WIDTH_PX,
} from './readerPrefs.ts'

test('buildShareTargets: returns all six channels in order', () => {
  const t = buildShareTargets({ url: 'https://x.test/a', title: 'Hi' })
  assert.deepEqual(t.map(x => x.key), ['x', 'facebook', 'linkedin', 'whatsapp', 'telegram', 'email'])
})

test('buildShareTargets: url and title are percent-encoded', () => {
  const t = buildShareTargets({ url: 'https://x.test/a b?c=d&e=f', title: 'A & B' })
  const byKey = Object.fromEntries(t.map(x => [x.key, x.href]))
  // encoded URL present in X/Facebook/LinkedIn
  assert.match(byKey.x, /url=https%3A%2F%2Fx\.test%2Fa%20b%3Fc%3Dd%26e%3Df/)
  assert.match(byKey.facebook, /u=https%3A%2F%2Fx\.test/)
  assert.match(byKey.linkedin, /url=https%3A%2F%2Fx\.test/)
  // title encoded (the ampersand must not leak raw)
  assert.match(byKey.x, /text=A%20%26%20B/)
  assert.equal(byKey.x.includes('A & B'), false)
})

test('buildShareTargets: whatsapp/telegram/email carry title + url', () => {
  const t = buildShareTargets({ url: 'https://x.test/a', title: 'Title' })
  const byKey = Object.fromEntries(t.map(x => [x.key, x.href]))
  assert.match(byKey.whatsapp, /^https:\/\/wa\.me\/\?text=Title%20https/)
  assert.match(byKey.telegram, /^https:\/\/t\.me\/share\/url\?url=/)
  assert.match(byKey.email, /^mailto:\?subject=Title&body=Title%20https/)
})

test('normalizePrefs: empty / garbage input falls back to defaults', () => {
  assert.deepEqual(normalizePrefs(undefined), DEFAULT_PREFS)
  assert.deepEqual(normalizePrefs(null), DEFAULT_PREFS)
  assert.deepEqual(normalizePrefs('nope'), DEFAULT_PREFS)
  assert.deepEqual(normalizePrefs({ font: 'huge', line: 9, width: '' }), DEFAULT_PREFS)
})

test('normalizePrefs: valid values pass through; partials fill from defaults', () => {
  assert.deepEqual(normalizePrefs({ font: 'lg', line: 'relaxed', width: 'wide' }),
    { font: 'lg', line: 'relaxed', width: 'wide' })
  assert.deepEqual(normalizePrefs({ font: 'xl' }),
    { font: 'xl', line: DEFAULT_PREFS.line, width: DEFAULT_PREFS.width })
})

test('prefsToVars: maps prefs to the three CSS custom properties', () => {
  const vars = prefsToVars({ font: 'lg', line: 'tight', width: 'narrow' })
  assert.equal(vars['--reader-font-scale'], String(FONT_SCALE.lg))
  assert.equal(vars['--reader-line'], String(LINE_VALUE.tight))
  assert.equal(vars['--reader-measure'], `${WIDTH_PX.narrow}px`)
})

test('prefsToVars: default prefs preserve the current rendering (scale 1, line 1.9, 740px)', () => {
  const vars = prefsToVars(DEFAULT_PREFS)
  assert.equal(vars['--reader-font-scale'], '1')
  assert.equal(vars['--reader-line'], '1.9')
  assert.equal(vars['--reader-measure'], '740px')
})

test('minutesLeft: scales the reading time by remaining progress and clamps', () => {
  assert.equal(minutesLeft(10, 0), 10)
  assert.equal(minutesLeft(10, 1), 0)
  assert.equal(minutesLeft(10, 0.5), 5)
  assert.equal(minutesLeft(10, 1.5), 0) // over-100% clamps to 0
  assert.equal(minutesLeft(10, -1), 10) // negative clamps to 0 progress
})
