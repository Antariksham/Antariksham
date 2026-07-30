/**
 * Unit tests for the tag-merge planner.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/tags/tagMerge.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planTagMerge, chunk } from './tagMerge.ts'

test('planTagMerge moves rows the target does not already have', () => {
  const plan = planTagMerge(['a1', 'a2', 'a3'], ['a9'])
  assert.deepEqual(plan.moveable, ['a1', 'a2', 'a3'])
  assert.deepEqual(plan.dropped, [])
})

test('planTagMerge drops rows that would collide with the target', () => {
  // a2 already carries the target tag — repointing it would duplicate the pair.
  const plan = planTagMerge(['a1', 'a2', 'a3'], ['a2', 'a3'])
  assert.deepEqual(plan.moveable, ['a1'])
  assert.deepEqual(plan.dropped, ['a2', 'a3'])
})

test('planTagMerge handles a source with nothing on it', () => {
  const plan = planTagMerge([], ['a1'])
  assert.deepEqual(plan, { moveable: [], dropped: [] })
})

test('planTagMerge drops everything when the target already covers the source', () => {
  const plan = planTagMerge(['a1', 'a2'], ['a1', 'a2', 'a3'])
  assert.deepEqual(plan.moveable, [])
  assert.deepEqual(plan.dropped, ['a1', 'a2'])
})

test('planTagMerge counts a repeated source article once', () => {
  const plan = planTagMerge(['a1', 'a1', 'a2'], [])
  assert.deepEqual(plan.moveable, ['a1', 'a2'])
})

test('planTagMerge preserves the order it was handed', () => {
  const plan = planTagMerge(['c', 'a', 'b'], [])
  assert.deepEqual(plan.moveable, ['c', 'a', 'b'])
})

test('chunk splits into fixed-size batches with a short tail', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]])
})

test('chunk returns nothing for an empty list and rejects a zero size', () => {
  assert.deepEqual(chunk([], 10), [])
  assert.throws(() => chunk([1], 0), /at least 1/)
})
