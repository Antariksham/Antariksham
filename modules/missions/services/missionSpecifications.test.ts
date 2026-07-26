/**
 * Unit tests for Professional Mission Specifications (Phase 1, Feature 3).
 * Zero-dependency Node test runner:
 *
 *   node --test --experimental-strip-types modules/missions/services/missionSpecifications.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptySpecifications, normalizeSpecifications, specificationsFromDetails,
  isSpecificationsEmpty, parseLeadingNumber, looksLikeMeasurement,
  validateSpecifications, SPEC_TEXT_FIELDS,
} from './missionSpecifications.ts'

const hasError = (issues: ReturnType<typeof validateSpecifications>, field: string) =>
  issues.some(i => i.field === field && i.level === 'error')
const hasWarn = (issues: ReturnType<typeof validateSpecifications>, field: string) =>
  issues.some(i => i.field === field && i.level === 'warning')

test('emptySpecifications: all text fields blank, instruments empty', () => {
  const s = emptySpecifications()
  for (const f of SPEC_TEXT_FIELDS) assert.equal(s[f], '')
  assert.deepEqual(s.instruments, [])
  assert.equal(isSpecificationsEmpty(s), true)
})

test('normalizeSpecifications: trims strings, cleans instruments, drops junk', () => {
  const s = normalizeSpecifications({
    spacecraftName: '  Orion  ', launchMass: '2,600 kg',
    instruments: ['MastCam', 'MastCam', ' SuperCam ', '', 42],
    bogus: 'x', powerOutput: 100,
  })
  assert.equal(s.spacecraftName, 'Orion')
  assert.equal(s.launchMass, '2,600 kg')
  assert.deepEqual(s.instruments, ['MastCam', 'SuperCam']) // trim + de-dupe, non-strings dropped
  assert.equal(s.powerOutput, '')                          // non-string dropped
  assert.equal((s as Record<string, unknown>).bogus, undefined)
})

test('normalizeSpecifications: tolerates null/garbage', () => {
  assert.deepEqual(normalizeSpecifications(null), emptySpecifications())
  assert.deepEqual(normalizeSpecifications('nope'), emptySpecifications())
})

test('specificationsFromDetails: reads the specifications namespace', () => {
  const s = specificationsFromDetails({ specifications: { program: 'Artemis' }, other: 1 })
  assert.equal(s.program, 'Artemis')
  assert.deepEqual(specificationsFromDetails({}), emptySpecifications())
})

test('parseLeadingNumber: strips separators + units', () => {
  assert.equal(parseLeadingNumber('2,600 kg'), 2600)
  assert.equal(parseLeadingNumber('5.5 t'), 5.5)
  assert.equal(parseLeadingNumber('  900W'), 900)
  assert.equal(parseLeadingNumber('heavy'), null)
  assert.equal(parseLeadingNumber(''), null)
})

test('looksLikeMeasurement: empty ok, needs a number otherwise', () => {
  assert.equal(looksLikeMeasurement(''), true)
  assert.equal(looksLikeMeasurement('2600 kg'), true)
  assert.equal(looksLikeMeasurement('a lot'), false)
})

test('validateSpecifications: empty specs produce no issues', () => {
  assert.deepEqual(validateSpecifications(emptySpecifications()), [])
})

test('validateSpecifications: non-numeric mass is a blocking error', () => {
  const s = emptySpecifications(); s.launchMass = 'very heavy'
  assert.equal(hasError(validateSpecifications(s), 'launchMass'), true)
})

test('validateSpecifications: dry/payload mass > launch mass warns (not blocks)', () => {
  // Comparison is naive (numeric only, no unit conversion) — keep units consistent.
  const s = emptySpecifications()
  s.launchMass = '2,000 kg'; s.dryMass = '2,500 kg'; s.payloadMass = '2,100 kg'
  const issues = validateSpecifications(s)
  assert.equal(hasWarn(issues, 'dryMass'), true)
  assert.equal(hasWarn(issues, 'payloadMass'), true)
  assert.equal(issues.every(i => i.level !== 'error'), true) // valid measurements → no errors
})

test('validateSpecifications: over-limit text blocks', () => {
  const s = emptySpecifications(); s.program = 'P'.repeat(201)
  assert.equal(hasError(validateSpecifications(s), 'program'), true)
})

test('validateSpecifications: realistic spec is clean', () => {
  const s = emptySpecifications()
  s.spacecraftName = 'Perseverance'; s.launchVehicle = 'Atlas V 541'
  s.launchMass = '1,025 kg'; s.dryMass = '1,025 kg'; s.powerOutput = '110 W'
  s.instruments = ['Mastcam-Z', 'SuperCam', 'MOXIE']
  s.program = 'Mars Exploration Program'
  assert.deepEqual(validateSpecifications(s), [])
})
