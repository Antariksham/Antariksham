/**
 * Unit tests for Enhanced Media Management (Phase 1, Feature 7).
 *
 *   node --test --experimental-strip-types modules/missions/services/missionMedia.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyMedia, emptyMediaItem, normalizeMediaItem, normalizeMedia, mediaFromDetails,
  effectiveMedia, isMediaEmpty, isMediaItemEmpty, allMediaItems, validateMedia,
  MEDIA_SINGLE_SLOTS, MEDIA_LIST_SLOTS, MEDIA_ITEM_FIELDS,
} from './missionMedia.ts'

test('shape constants', () => {
  assert.equal(MEDIA_ITEM_FIELDS.length, 9)
  assert.deepEqual(MEDIA_SINGLE_SLOTS, ['hero', 'patch', 'logo', 'agencyLogo', 'banner'])
  assert.deepEqual(MEDIA_LIST_SLOTS, ['gallery', 'infographics', 'animations', 'videos', 'documents'])
})

test('emptyMedia: all slots empty', () => {
  const m = emptyMedia()
  for (const s of MEDIA_SINGLE_SLOTS) assert.equal(isMediaItemEmpty(m[s]), true)
  for (const s of MEDIA_LIST_SLOTS) assert.deepEqual(m[s], [])
  assert.equal(isMediaEmpty(m), true)
})

test('normalizeMediaItem: trims, keeps known fields, drops junk', () => {
  const it = normalizeMediaItem({ url: '  https://x/y.jpg ', alt: 'A rover', credit: ' NASA ', bogus: 'z', caption: 42 })
  assert.equal(it.url, 'https://x/y.jpg')
  assert.equal(it.alt, 'A rover')
  assert.equal(it.credit, 'NASA')
  assert.equal(it.caption, '')                       // non-string dropped
  assert.equal((it as Record<string, unknown>).bogus, undefined)
})

test('isMediaItemEmpty: empty iff no URL', () => {
  assert.equal(isMediaItemEmpty(emptyMediaItem()), true)
  const withCaptionOnly = emptyMediaItem(); withCaptionOnly.caption = 'x'
  assert.equal(isMediaItemEmpty(withCaptionOnly), true)  // no url → still empty
  const withUrl = emptyMediaItem(); withUrl.url = 'https://a/b.png'
  assert.equal(isMediaItemEmpty(withUrl), false)
})

test('normalizeMedia: drops URL-less list items, normalises singles', () => {
  const m = normalizeMedia({
    hero: { url: 'https://a/hero.jpg', alt: 'Hero' },
    gallery: [{ url: 'https://a/1.jpg' }, { caption: 'no url' }, { url: 'https://a/2.jpg' }],
    videos: 'nope',
  })
  assert.equal(m.hero.url, 'https://a/hero.jpg')
  assert.equal(m.gallery.length, 2)                  // the URL-less item dropped
  assert.deepEqual(m.videos, [])                     // non-array → []
})

test('mediaFromDetails reads the media namespace', () => {
  assert.equal(mediaFromDetails({ media: { patch: { url: 'https://a/patch.png' } } }).patch.url, 'https://a/patch.png')
  assert.equal(isMediaEmpty(mediaFromDetails({})), true)
})

test('effectiveMedia: hero URL seeds from featured_image when absent', () => {
  const m = effectiveMedia({}, 'https://legacy/featured.jpg')
  assert.equal(m.hero.url, 'https://legacy/featured.jpg')
  // but a stored hero wins over the base column
  const m2 = effectiveMedia({ media: { hero: { url: 'https://new/hero.jpg' } } }, 'https://legacy/featured.jpg')
  assert.equal(m2.hero.url, 'https://new/hero.jpg')
  // no hero + no featured → empty
  assert.equal(effectiveMedia({}, null).hero.url, '')
})

test('allMediaItems: collects non-empty items across slots', () => {
  const m = emptyMedia()
  m.hero.url = 'https://a/h.jpg'
  m.gallery = [normalizeMediaItem({ url: 'https://a/1.jpg' }), normalizeMediaItem({ url: 'https://a/2.jpg' })]
  assert.equal(allMediaItems(m).length, 3)
})

test('validateMedia: invalid asset/source URL blocks', () => {
  const m = emptyMedia(); m.hero.url = 'not a url'
  assert.equal(validateMedia(m).some(i => i.level === 'error'), true)

  const m2 = emptyMedia(); m2.patch.url = 'https://a/p.png'; m2.patch.sourceUrl = 'bad'
  assert.equal(validateMedia(m2).some(i => i.level === 'error'), true)
})

test('validateMedia: valid media is clean', () => {
  const m = emptyMedia()
  m.hero.url = 'https://a/hero.jpg'; m.hero.sourceUrl = 'https://nasa.gov'
  m.gallery = [normalizeMediaItem({ url: 'https://a/1.jpg', credit: 'ESA' })]
  assert.deepEqual(validateMedia(m), [])
})
