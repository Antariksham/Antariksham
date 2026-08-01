/**
 * Parity tests for the UI-string dictionaries.
 *
 * `hi.ts` is typed as `Record<keyof typeof en, string>`, so a MISSING key is
 * already a compile error. These tests cover what the type system cannot see:
 * a key that exists but was left blank, or pasted through untranslated.
 *
 * Run with:
 *     node --test --experimental-strip-types lib/dictionaries/dictionaries.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { en } from './en.ts'
import { hi } from './hi.ts'

// Any Devanagari code point (U+0900–U+097F).
const DEVANAGARI = /[ऀ-ॿ]/

/**
 * Keys whose Hindi value is legitimately Latin-script — a brand name that is
 * never transliterated, for instance. Empty today; add a key here (with a
 * reason) rather than weakening the check below.
 */
const LATIN_BY_DESIGN = new Set<string>([])

test('every English key has a Hindi counterpart, and vice versa', () => {
  const enKeys = Object.keys(en).sort()
  const hiKeys = Object.keys(hi).sort()
  assert.deepEqual(hiKeys, enKeys)
})

test('no dictionary value is empty or untrimmed', () => {
  for (const [lang, dict] of [['en', en], ['hi', hi]] as const) {
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(value.length > 0,          `${lang}.${key} is empty`)
      assert.equal(value, value.trim(),    `${lang}.${key} has stray whitespace`)
    }
  }
})

test('every Hindi value is actually in Devanagari', () => {
  // Catches the commonest i18n bug by far: a key copied from en.ts into hi.ts
  // and never translated. Such a value type-checks and renders fine — it is
  // just silently English on a Hindi page.
  for (const [key, value] of Object.entries(hi)) {
    if (LATIN_BY_DESIGN.has(key)) continue
    assert.ok(DEVANAGARI.test(value), `hi.${key} has no Devanagari: ${JSON.stringify(value)}`)
  }
})

test('no Hindi value is identical to its English source', () => {
  for (const [key, value] of Object.entries(hi)) {
    if (LATIN_BY_DESIGN.has(key)) continue
    assert.notEqual(value, en[key as keyof typeof en], `hi.${key} is untranslated`)
  }
})

test('keys are dot-namespaced, so the parity check names a real namespace', () => {
  for (const key of Object.keys(en)) {
    assert.match(key, /^[a-z]+\.[A-Za-z]+$/, `key "${key}" is not <namespace>.<name>`)
  }
})
