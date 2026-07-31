import { test } from 'node:test'
import assert from 'node:assert/strict'
import { imageSizeAttrs, probeImageSize } from './imageDimensions.ts'

test('imageSizeAttrs: emits width and height for a usable size', () => {
  assert.equal(imageSizeAttrs({ width: 1600, height: 900 }), ' width="1600" height="900"')
})

test('imageSizeAttrs: rounds fractional dimensions', () => {
  // naturalWidth is an integer in practice, but a caller passing a computed
  // size must not produce width="1599.6", which is invalid in the attribute.
  assert.equal(imageSizeAttrs({ width: 1599.6, height: 899.4 }), ' width="1600" height="899"')
})

test('imageSizeAttrs: a failed probe degrades to no attributes at all', () => {
  // The important half: emitting nothing reproduces today's markup, whereas
  // emitting width="0" would collapse the image rather than just fail to
  // reserve space for it.
  assert.equal(imageSizeAttrs(null), '')
  assert.equal(imageSizeAttrs(undefined), '')
  assert.equal(imageSizeAttrs({ width: 0, height: 500 }), '')
  assert.equal(imageSizeAttrs({ width: 500, height: 0 }), '')
  assert.equal(imageSizeAttrs({ width: -10, height: 10 }), '')
  assert.equal(imageSizeAttrs({ width: NaN, height: 10 }), '')
  assert.equal(imageSizeAttrs({ width: Infinity, height: 10 }), '')
})

test('imageSizeAttrs: output is a bare attribute fragment, safe to concatenate', () => {
  const attrs = imageSizeAttrs({ width: 10, height: 20 })
  assert.ok(attrs.startsWith(' '), 'needs the leading space to sit after src="…"')
  assert.ok(!/[<>"]/.test(attrs.replace(/(width|height)="\d+"/g, '')), 'no stray markup characters')
})

test('probeImageSize: resolves null outside a browser rather than throwing', async () => {
  // Runs server-side during SSR of the editor bundle, so it must be inert there.
  assert.equal(typeof window, 'undefined')
  assert.equal(await probeImageSize('https://example.com/a.jpg'), null)
})

test('probeImageSize: an empty src resolves null without attempting a load', async () => {
  assert.equal(await probeImageSize(''), null)
})
