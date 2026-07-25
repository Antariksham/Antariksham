/**
 * Unit tests for the chart geometry helpers (Phase 2, Feature 5).
 * Zero-dependency (Node's built-in runner). Run with:
 *   node --test --experimental-strip-types modules/admin/analytics/chartUtils.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { niceMax, linePoints, toPath, toAreaPath } from './chartUtils.ts'

test('niceMax: rounds up to 1/2/5 × 10ⁿ', () => {
  assert.equal(niceMax(0), 1)
  assert.equal(niceMax(-5), 1)
  assert.equal(niceMax(1), 1)
  assert.equal(niceMax(7), 10)
  assert.equal(niceMax(12), 20)
  assert.equal(niceMax(45), 50)
  assert.equal(niceMax(230), 500)
  assert.equal(niceMax(1000), 1000)
})

test('linePoints: empty series → no points', () => {
  assert.deepEqual(linePoints([], 100, 40, 10), [])
})

test('linePoints: single value centres on the left edge', () => {
  const pts = linePoints([5], 100, 40, 10)
  assert.equal(pts.length, 1)
  assert.equal(pts[0].x, 4)                 // pad
  assert.ok(pts[0].y > 4 && pts[0].y < 36)  // within the padded box
})

test('linePoints: spans the padded width and inverts the y-axis', () => {
  const pts = linePoints([0, 10], 100, 40, 10)
  assert.equal(pts[0].x, 4)
  assert.equal(pts[1].x, 96)                 // width - pad
  assert.equal(pts[0].y, 36)                 // value 0 → baseline (height - pad)
  assert.equal(pts[1].y, 4)                  // value = max → top (pad)
})

test('linePoints: clamps negatives and tolerates a zero max', () => {
  const pts = linePoints([-3, 5], 100, 40, 0) // max 0 → treated as 1
  assert.equal(pts[0].y, 36)                  // negative clamped to baseline
})

test('toPath: builds an M…L… polyline', () => {
  assert.equal(toPath([{ x: 0, y: 0 }, { x: 10, y: 5 }]), 'M0.0,0.0 L10.0,5.0')
  assert.equal(toPath([]), '')
})

test('toAreaPath: closes the polyline down to the baseline', () => {
  const path = toAreaPath([{ x: 4, y: 10 }, { x: 96, y: 4 }], 40)
  assert.ok(path.startsWith('M4.0,10.0 L96.0,4.0'))
  assert.ok(path.endsWith('Z'))
  assert.ok(path.includes('L96.0,36.0'))     // down to baseline at last x
  assert.ok(path.includes('L4.0,36.0'))      // across to first x
})

test('toAreaPath: empty points → empty string', () => {
  assert.equal(toAreaPath([], 40), '')
})
