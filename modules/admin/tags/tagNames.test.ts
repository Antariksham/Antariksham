/**
 * Unit tests for the article tag-name helpers.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/tags/tagNames.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeTagName, tagSlug, isValidTagName, dedupeTagNames,
  MAX_TAG_NAME_LENGTH, MAX_TAG_SLUG_LENGTH,
} from './tagNames.ts'

test('normalizeTagName trims and collapses whitespace but keeps case', () => {
  assert.equal(normalizeTagName('  Falcon   9 '), 'Falcon 9')
  assert.equal(normalizeTagName('JWST'), 'JWST')
  assert.equal(normalizeTagName('mars\n\tsample return'), 'mars sample return')
})

test('normalizeTagName caps the length without leaving a trailing space', () => {
  const name = normalizeTagName('a'.repeat(40) + ' ' + 'b'.repeat(40))
  assert.equal(name.length <= MAX_TAG_NAME_LENGTH, true)
  assert.equal(name, name.trim())
})

test('tagSlug is the identity key — spelling variants collapse onto one slug', () => {
  const variants = ['Falcon 9', 'falcon 9', ' FALCON-9 ', 'falcon_9', 'Falcon  9!']
  for (const v of variants) assert.equal(tagSlug(v), 'falcon-9')
})

test('tagSlug strips accents rather than dropping the whole letter', () => {
  // lib/utils.slugify would turn this into 'sove-6' by way of deleting the é.
  assert.equal(tagSlug('Sové 6'), 'sove-6')
  assert.equal(tagSlug('Ariane Ünal'), 'ariane-unal')
})

test('tagSlug never ends on a dash, even when the cap lands on one', () => {
  const slug = tagSlug('x'.repeat(MAX_TAG_SLUG_LENGTH - 1) + ' more words')
  assert.equal(slug.length <= MAX_TAG_SLUG_LENGTH, true)
  assert.equal(slug.endsWith('-'), false)
})

test('isValidTagName rejects names with nothing to key on', () => {
  assert.equal(isValidTagName('Artemis'), true)
  assert.equal(isValidTagName('  '), false)
  assert.equal(isValidTagName('!!!'), false)
  assert.equal(isValidTagName('---'), false)
})

test('dedupeTagNames keeps the first spelling of each slug', () => {
  assert.deepEqual(
    dedupeTagNames(['Falcon 9', 'Artemis', 'falcon 9', ' artemis ', 'JWST']),
    ['Falcon 9', 'Artemis', 'JWST'],
  )
})

test('dedupeTagNames drops unusable names instead of emitting empties', () => {
  assert.deepEqual(dedupeTagNames(['Europa', '   ', '!!', 'Titan']), ['Europa', 'Titan'])
})
