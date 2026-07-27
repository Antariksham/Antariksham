/**
 * Unit tests for Scientific Objectives (Phase 1, Feature 4).
 *
 *   node --test --experimental-strip-types modules/missions/services/missionObjectives.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyObjectives, normalizeObjectives, objectivesFromDetails,
  isObjectivesEmpty, validateObjectives, OBJECTIVE_LIST_FIELDS,
} from './missionObjectives.ts'

test('emptyObjectives: all lists empty, significance blank', () => {
  const o = emptyObjectives()
  for (const f of OBJECTIVE_LIST_FIELDS) assert.deepEqual(o[f], [])
  assert.equal(o.significance, '')
  assert.equal(isObjectivesEmpty(o), true)
})

test('normalizeObjectives: trims items, drops blanks/non-strings, keeps order', () => {
  const o = normalizeObjectives({
    secondary: ['  Map the poles ', '', 'Study ice', 42],
    technologyDemos: ['Autonomous landing'],
    significance: '  First of its kind.  ',
    bogus: 'x',
  })
  assert.deepEqual(o.secondary, ['Map the poles', 'Study ice'])
  assert.deepEqual(o.technologyDemos, ['Autonomous landing'])
  assert.deepEqual(o.scientificQuestions, [])
  assert.equal(o.significance, 'First of its kind.')
  assert.equal((o as Record<string, unknown>).bogus, undefined)
})

test('normalizeObjectives: tolerates null/garbage', () => {
  assert.deepEqual(normalizeObjectives(null), emptyObjectives())
  assert.deepEqual(normalizeObjectives('nope'), emptyObjectives())
})

test('objectivesFromDetails: reads the objectives namespace', () => {
  const o = objectivesFromDetails({ objectives: { significance: 'Big.' }, other: 1 })
  assert.equal(o.significance, 'Big.')
  assert.deepEqual(objectivesFromDetails({}), emptyObjectives())
})

test('isObjectivesEmpty: true only when everything blank', () => {
  const o = emptyObjectives()
  assert.equal(isObjectivesEmpty(o), true)
  o.scientificQuestions = ['Is there water?']
  assert.equal(isObjectivesEmpty(o), false)
})

test('validateObjectives: empty is clean', () => {
  assert.deepEqual(validateObjectives(emptyObjectives()), [])
})

test('validateObjectives: over-long list item blocks', () => {
  const o = emptyObjectives()
  o.secondary = ['x'.repeat(281)]
  const issues = validateObjectives(o)
  assert.equal(issues.some(i => i.field === 'secondary' && i.level === 'error'), true)
})

test('validateObjectives: over-long significance blocks', () => {
  const o = emptyObjectives()
  o.significance = 's'.repeat(1201)
  const issues = validateObjectives(o)
  assert.equal(issues.some(i => i.field === 'significance' && i.level === 'error'), true)
})

test('validateObjectives: a realistic set is clean', () => {
  const o = emptyObjectives()
  o.secondary = ['Characterise the regolith', 'Image the far side']
  o.technologyDemos = ['Precision landing']
  o.scientificQuestions = ['Where did the water come from?']
  o.expectedDiscoveries = ['Buried ice deposits']
  o.significance = 'First crewed south-pole landing.'
  assert.deepEqual(validateObjectives(o), [])
})
