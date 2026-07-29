/**
 * Unit tests for the Media Library naming + cursor helpers.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/media/mediaNaming.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  slugify, titleFromFilename, displayName,
  encodeCursor, decodeCursor, parseTags,
} from './mediaNaming.ts'

test('slugify produces url-safe, collapsed slugs', () => {
  assert.equal(slugify('Chandrayaan-3 Vikram Lander!'), 'chandrayaan-3-vikram-lander')
  assert.equal(slugify('  spaced   out  '), 'spaced-out')
  assert.equal(slugify('Ariane_6 // launch'), 'ariane-6-launch')
})

test('slugify strips accents rather than dropping the whole word', () => {
  assert.equal(slugify('Ariane Sové'), 'ariane-sove')
})

test('slugify caps length without leaving a trailing dash', () => {
  const slug = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50), 51)
  assert.equal(slug.length, 50)
  assert.ok(!slug.endsWith('-'))
})

test('slugify survives input with nothing slug-worthy in it', () => {
  assert.equal(slugify('!!!'), '')
})

test('titleFromFilename drops the legacy timestamp prefix and extension', () => {
  assert.equal(titleFromFilename('1753612345678-perseverance-selfie.jpg'), 'Perseverance selfie')
})

test('titleFromFilename handles underscores, dots and folder prefixes', () => {
  assert.equal(titleFromFilename('2026/07/artemis_ii.crew.portrait.png'), 'Artemis ii crew portrait')
})

test('titleFromFilename leaves a wordless camera filename alone', () => {
  // Exactly the case Phase 4 exists to fix: there is nothing here to search on.
  assert.equal(titleFromFilename('IMG_4471.jpg'), 'IMG 4471')
})

test('titleFromFilename falls back to the raw name when nothing survives', () => {
  assert.equal(titleFromFilename('1753612345678-.jpg'), '1753612345678-.jpg')
})

test('displayName strips only the timestamp prefix, keeping the extension', () => {
  assert.equal(displayName('1753612345678-vikram.webp'), 'vikram.webp')
  assert.equal(displayName('2026/07/vikram.webp'), 'vikram.webp')
})

test('cursor round-trips', () => {
  const cursor = { createdAt: '2026-07-29T10:11:12.345Z', id: 'e5f6a7b8-1111-2222-3333-444455556666' }
  assert.deepEqual(decodeCursor(encodeCursor(cursor)), cursor)
})

test('decodeCursor rejects junk instead of throwing', () => {
  assert.equal(decodeCursor(null), null)
  assert.equal(decodeCursor(''), null)
  assert.equal(decodeCursor('not-base64-!!'), null)
  assert.equal(decodeCursor(Buffer.from('no-separator').toString('base64url')), null)
  assert.equal(decodeCursor(Buffer.from('|only-id').toString('base64url')), null)
})

test('parseTags normalises and drops empties', () => {
  assert.deepEqual(parseTags(' Mars , ROVER ,, '), ['mars', 'rover'])
  assert.equal(parseTags(''), null)
  assert.equal(parseTags(null), null)
  assert.equal(parseTags(' , '), null)
})
