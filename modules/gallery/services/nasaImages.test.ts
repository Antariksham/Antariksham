/**
 * Unit tests for the NASA Image Library response mapping.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/gallery/services/nasaImages.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slimSearchResponse, truncate, sanitizeQuery, nasaDetailsUrl } from './nasaImages.ts'

const FIXTURE = {
  collection: {
    metadata: { total_hits: 316 },
    items: [
      {
        data: [{
          nasa_id: 'PIA14417', title: 'Weighing in on the Dumbbell Nebula',
          media_type: 'image', center: 'JPL', date_created: '2011-08-10T20:30:00Z',
          description: 'A very long description. '.repeat(60),
          secondary_creator: 'NASA/JPL-Caltech/UCLA',
        }],
        links: [{ href: 'http://images-assets.nasa.gov/image/PIA14417/PIA14417~medium.jpg', rel: 'preview' }],
      },
      {
        data: [{
          nasa_id: 'NHQ001', title: 'Launch Day', media_type: 'image',
          center: 'HQ', date_created: '2022-11-16T00:00:00Z',
          photographer: 'Bill Ingalls',
        }],
        links: [{ href: 'https://images-assets.nasa.gov/image/NHQ001/NHQ 001~thumb.jpg' }],
      },
      // A video sneaks into image searches sometimes — must be skipped.
      {
        data: [{ nasa_id: 'vid-1', title: 'A video', media_type: 'video' }],
        links: [{ href: 'https://example.com/v.jpg' }],
      },
      // Malformed item — no links.
      { data: [{ nasa_id: 'x', media_type: 'image' }] },
    ],
  },
}

test('slimSearchResponse: maps, filters and hardens items', () => {
  const r = slimSearchResponse(FIXTURE, 2)
  assert.equal(r.page, 2)
  assert.equal(r.totalHits, 316)
  assert.equal(r.images.length, 2)

  const [a, b] = r.images
  assert.equal(a.id, 'PIA14417')
  assert.ok(a.thumb.startsWith('https://'), 'http upgraded to https')
  assert.equal(a.date, '2011-08-10')
  assert.equal(a.credit, 'NASA/JPL-Caltech/UCLA')
  assert.ok(a.description.length <= 601 && a.description.endsWith('…'), 'description truncated')

  assert.equal(b.credit, 'Bill Ingalls', 'photographer wins over center')
  assert.ok(!b.thumb.includes(' ') && b.thumb.includes('%20'), 'spaces encoded')
})

test('slimSearchResponse: safe on empty / malformed payloads', () => {
  assert.deepEqual(slimSearchResponse({}, 1), { images: [], totalHits: 0, page: 1 })
  assert.deepEqual(slimSearchResponse(null, 1).images, [])
  assert.deepEqual(slimSearchResponse({ collection: { items: 'nope' } }, 1).images, [])
})

test('truncate: word-boundary with ellipsis, short strings untouched', () => {
  assert.equal(truncate('short', 100), 'short')
  const t = truncate('alpha beta gamma delta', 12)
  assert.equal(t, 'alpha beta…')
})

test('sanitizeQuery: trims, collapses, caps, rejects non-strings', () => {
  assert.equal(sanitizeQuery('  hello   world  '), 'hello world')
  assert.equal(sanitizeQuery(12 as any), '')
  assert.equal(sanitizeQuery('x'.repeat(200)).length, 80)
})

test('nasaDetailsUrl: encodes the id', () => {
  assert.equal(nasaDetailsUrl('a b'), 'https://images.nasa.gov/details/a%20b')
})
