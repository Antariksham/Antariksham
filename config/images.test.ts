/**
 * Which sources `SmartImage` is allowed to hand to the Next image optimiser.
 *
 * The whole point of this predicate is that a `false` costs nothing (a plain
 * `<img>`, today's behaviour) while a wrong `true` is a **400 on a live
 * image** — the exact failure that got `next/image` pulled from this codebase
 * once already. So the cases worth pinning are the ones where it must say no.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types config/images.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOptimizableImage } from './images.ts'

// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME are read once at
// module load, and the test runner has neither, so OPTIMIZABLE_HOSTS is empty
// here. That is deliberate: it keeps these tests about the rules that hold
// regardless of deployment config, rather than about one environment's hosts.

test('same-origin paths are optimizable', () => {
  assert.equal(isOptimizableImage('/hero.jpg'), true)
  assert.equal(isOptimizableImage('/images/nested/photo.png'), true)
})

test('SVG is never optimizable — the optimiser is configured to refuse it', () => {
  // dangerouslyAllowSVG: false in next.config.js means next/image answers 400
  // for an SVG from any origin, including this one.
  assert.equal(isOptimizableImage('/world-map.svg'), false)
  assert.equal(isOptimizableImage('/icons/mark.SVG'), false)
  assert.equal(isOptimizableImage('https://res.cloudinary.com/demo/a.svg'), false)
})

test('a query string or hash does not hide an SVG', () => {
  assert.equal(isOptimizableImage('/world-map.svg?v=2'), false)
  assert.equal(isOptimizableImage('/world-map.svg#layer'), false)
})

test('.svg inside a name is not an SVG', () => {
  assert.equal(isOptimizableImage('/photos/svg-explainer.png'), true)
  assert.equal(isOptimizableImage('/svg/diagram.webp'), true)
})

test('hosts outside the allow-list fall back to a plain <img>', () => {
  assert.equal(isOptimizableImage('https://apod.nasa.gov/apod/image/andromeda.jpg'), false)
  assert.equal(isOptimizableImage('https://images-assets.nasa.gov/photo.jpg'), false)
})

test('non-http schemes and protocol-relative URLs are refused', () => {
  assert.equal(isOptimizableImage('data:image/png;base64,iVBORw0KGgo='), false)
  assert.equal(isOptimizableImage('blob:https://example.test/abc-123'), false)
  // `//evil.test/x.jpg` is not this origin — it must not take the path branch.
  assert.equal(isOptimizableImage('//evil.test/x.jpg'), false)
})

test('empty and malformed sources are refused rather than thrown on', () => {
  assert.equal(isOptimizableImage(''), false)
  assert.equal(isOptimizableImage(null), false)
  assert.equal(isOptimizableImage(undefined), false)
  assert.equal(isOptimizableImage('not a url'), false)
})
