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
  normalizeTags, buildStorageKey, thumbKeyFor, sha256Hex, shortHash, extForMime,
  MAX_TAGS,
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

// ── Phase 4: tags, hashing, keys ─────────────────────────────────────────────

test('normalizeTags collapses casing and spacing into one spelling', () => {
  assert.deepEqual(
    normalizeTags(['ISRO', 'isro', ' Isro ', 'Mars Rover', 'mars-rover']),
    ['isro', 'mars-rover'],
  )
})

test('normalizeTags strips punctuation and stray dashes', () => {
  assert.deepEqual(normalizeTags(['--nasa!!--', 'jwst/webb', '  ', '#']), ['nasa', 'jwstwebb'])
})

test('normalizeTags caps the tag count', () => {
  const many = Array.from({ length: MAX_TAGS + 10 }, (_, i) => `tag${i}`)
  assert.equal(normalizeTags(many).length, MAX_TAGS)
})

test('sha256Hex matches a known vector', async () => {
  // SHA-256 of the empty input.
  assert.equal(
    await sha256Hex(new Uint8Array()),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  )
})

test('sha256Hex is stable for identical bytes and differs for others', async () => {
  const a = new TextEncoder().encode('same bytes')
  const b = new TextEncoder().encode('same bytes')
  const c = new TextEncoder().encode('other bytes')
  assert.equal(await sha256Hex(a), await sha256Hex(b))
  assert.notEqual(await sha256Hex(a), await sha256Hex(c))
})

test('buildStorageKey is readable, dated and content-addressed', () => {
  const key = buildStorageKey({
    title: 'Chandrayaan-3 Vikram lander touchdown',
    hash:  'a3f19c2bdeadbeef',
    ext:   'webp',
    at:    new Date('2026-07-15T00:00:00Z'),
  })
  assert.equal(key, '2026-07-chandrayaan-3-vikram-lander-touchdown--a3f19c2b.webp')
})

test('buildStorageKey is idempotent for the same bytes and title', () => {
  const args = { title: 'Mars', hash: 'ffff0000ffff', ext: 'jpg', at: new Date('2026-01-02T00:00:00Z') }
  assert.equal(buildStorageKey(args), buildStorageKey(args))
})

test('buildStorageKey falls back when the title has no slug-worthy characters', () => {
  const key = buildStorageKey({ title: '!!!', hash: '0123456789', ext: 'png', at: new Date('2026-03-01T00:00:00Z') })
  assert.equal(key, '2026-03-image--01234567.png')
})

test('buildStorageKey pads the month and stays UTC', () => {
  const key = buildStorageKey({ title: 'x', hash: 'abcdefaa', ext: 'jpg', at: new Date('2026-01-31T23:30:00Z') })
  assert.ok(key.startsWith('2026-01-'), key)
})

test('thumbKeyFor puts previews under their own prefix', () => {
  assert.equal(
    thumbKeyFor('2026-07-vikram--a3f19c2b.jpg'),
    'thumbs/2026-07-vikram--a3f19c2b.webp',
  )
})

test('shortHash and extForMime', () => {
  assert.equal(shortHash('0123456789abcdef'), '01234567')
  assert.equal(extForMime('image/webp'), 'webp')
  assert.equal(extForMime('image/jpeg'), 'jpg')
  assert.equal(extForMime('application/octet-stream'), 'jpg')
})
