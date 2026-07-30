/**
 * Regression tests for the two bugs that reached the deployed admin panel.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/media/mediaMapping.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toMediaItem, kindForMime, type AssetRow } from './mediaMapping.ts'
import { emptyMeta, resolveTags, hasAlt } from './mediaMeta.ts'

function row(overrides: Partial<AssetRow> = {}): AssetRow {
  return {
    id:            'aaaaaaaa-1111-2222-3333-444444444444',
    provider:      'supabase',
    storage_key:   '2026-07-vikram--a3f19c2b.jpg',
    bucket:        'article-images',
    file_url:      'https://example.test/vikram.jpg',
    thumb_url:     null,
    title:         'Vikram lander',
    slug:          'vikram-lander',
    alt_text:      'The lander on the lunar surface',
    caption:       null,
    credit:        'ISRO',
    tags:          ['chandrayaan', 'isro'],
    collection_id: null,
    width:         3840,
    height:        2160,
    file_size:     812344,
    file_type:     'image/jpeg',
    created_at:    '2026-07-01T10:00:00.000Z',
    usage_count:   0,
    ...overrides,
  }
}

// ── Bug 1: every card rendered a file icon instead of the image ───────────────
// The grid draws an <img> only when kind === 'image'. The mapping did not set
// the field at all, so the whole library looked like a wall of generic icons.

test('mapping always sets kind — the grid needs it to render an <img>', () => {
  assert.equal(toMediaItem(row()).kind, 'image')
})

test('a null mime is treated as an image, not a file', () => {
  // Rows imported from Storage by the sync route often have no mime recorded.
  assert.equal(toMediaItem(row({ file_type: null })).kind, 'image')
})

test('kindForMime only says "file" when the mime positively is not an image', () => {
  assert.equal(kindForMime('image/webp'), 'image')
  assert.equal(kindForMime('image/gif'), 'image')
  assert.equal(kindForMime(null), 'image')
  assert.equal(kindForMime(undefined), 'image')
  assert.equal(kindForMime(''), 'image')
  assert.equal(kindForMime('application/pdf'), 'file')
  assert.equal(kindForMime('application/zip'), 'file')
})

test('thumbUrl is used when present and left undefined otherwise', () => {
  assert.equal(toMediaItem(row()).thumbUrl, undefined)
  assert.equal(
    toMediaItem(row({ thumb_url: 'https://example.test/thumbs/vikram.webp' })).thumbUrl,
    'https://example.test/thumbs/vikram.webp',
  )
})

test('name falls back from title to a readable storage key', () => {
  assert.equal(toMediaItem(row()).name, 'Vikram lander')
  assert.equal(
    toMediaItem(row({ title: null, storage_key: '1753612345678-vikram.webp' })).name,
    'vikram.webp',
  )
})

test('name falls back to the id when there is no title and no key', () => {
  const mapped = toMediaItem(row({ title: null, storage_key: null }))
  assert.equal(mapped.name, 'aaaaaaaa-1111-2222-3333-444444444444')
})

test('mapping carries the fields the grid and dialogs read', () => {
  const mapped = toMediaItem(row())
  assert.equal(mapped.bucket, 'article-images')      // bucket badge while searching
  assert.deepEqual(mapped.tags, ['chandrayaan', 'isro'])
  assert.equal(mapped.provider, 'supabase')
  assert.equal(mapped.sizeBytes, 812344)
  assert.equal(mapped.credit, 'ISRO')
})

test('null numerics and urls degrade without throwing', () => {
  const mapped = toMediaItem(row({ file_size: null, width: null, height: null, tags: null, file_url: null, usage_count: null }))
  assert.equal(mapped.sizeBytes, 0)
  assert.equal(mapped.url, '')
  assert.deepEqual(mapped.tags, [])
  assert.equal(mapped.usageCount, 0)
})

// ── Bug 3: "I added the tag mars, then search found nothing" ──────────────────
// A tag typed but not committed with Enter was dropped on submit. resolveTags
// merges whatever is still on screen, so it cannot be lost.

test('resolveTags keeps a half-typed tag that was never turned into a chip', () => {
  const meta = { ...emptyMeta('Perseverance'), tags: [], tagDraft: 'mars' }
  assert.deepEqual(resolveTags(meta), ['mars'])
})

test('resolveTags merges batch tags, committed chips and the draft', () => {
  const meta = { ...emptyMeta(), tags: ['rover'], tagDraft: 'nasa' }
  assert.deepEqual(resolveTags(meta, ['mars']), ['mars', 'rover', 'nasa'])
})

test('resolveTags dedupes across all three sources and normalises casing', () => {
  const meta = { ...emptyMeta(), tags: ['Mars'], tagDraft: 'MARS' }
  assert.deepEqual(resolveTags(meta, ['mars']), ['mars'])
})

test('resolveTags ignores a blank or whitespace-only draft', () => {
  assert.deepEqual(resolveTags({ ...emptyMeta(), tags: ['mars'], tagDraft: '   ' }), ['mars'])
  assert.deepEqual(resolveTags({ ...emptyMeta(), tags: [], tagDraft: '' }), [])
})

test('hasAlt accepts real text or an explicit decorative marking', () => {
  assert.equal(hasAlt({ ...emptyMeta(), altText: 'A lander' }), true)
  assert.equal(hasAlt({ ...emptyMeta(), altText: '   ' }), false)
  assert.equal(hasAlt({ ...emptyMeta(), altText: '' }), false)
  // Decorative means "deliberately empty alt", which is a valid description.
  assert.equal(hasAlt({ ...emptyMeta(), altText: '', decorative: true }), true)
})

test('emptyMeta starts with an empty draft so nothing leaks between files', () => {
  assert.equal(emptyMeta('Title').tagDraft, '')
  assert.deepEqual(emptyMeta('Title').tags, [])
  assert.equal(emptyMeta('Title').title, 'Title')
})
