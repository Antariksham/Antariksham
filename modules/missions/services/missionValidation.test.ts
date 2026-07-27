/**
 * Unit tests for mission validation (Phase 1, Feature 1).
 *
 * Zero-dependency: Node's built-in test runner + assert (this repo uses no
 * jest/vitest). Run with:
 *
 *     node --test --experimental-strip-types modules/missions/services/missionValidation.test.ts
 *
 * (Node 22+ strips the TypeScript types at load time.)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyIdentity } from './missionIdentity.ts'
import {
  isValidUrl,
  coerceUrl,
  validateMissionCore,
  validateIdentity,
  validateMission,
  hasBlockingErrors,
  errorsOnly,
  warningsOnly,
  issueForField,
  MISSION_LIMITS,
} from './missionValidation.ts'

test('isValidUrl: empty is allowed (fields are optional)', () => {
  assert.equal(isValidUrl(''), true)
  assert.equal(isValidUrl('   '), true)
})

test('isValidUrl: requires an absolute http(s) URL', () => {
  assert.equal(isValidUrl('https://nasa.gov'), true)
  assert.equal(isValidUrl('http://example.com/path?q=1'), true)
  assert.equal(isValidUrl('nasa.gov'), false)          // no scheme
  assert.equal(isValidUrl('just some words'), false)
  assert.equal(isValidUrl('javascript:alert(1)'), false) // non-http scheme rejected
  assert.equal(isValidUrl('ftp://files.example.com'), false)
})

test('coerceUrl: prefixes https:// for bare domains, leaves schemes + empty', () => {
  assert.equal(coerceUrl('nasa.gov'), 'https://nasa.gov')
  assert.equal(coerceUrl('https://esa.int'), 'https://esa.int')
  assert.equal(coerceUrl('http://isro.gov.in'), 'http://isro.gov.in')
  assert.equal(coerceUrl(''), '')
  assert.equal(coerceUrl('  jaxa.jp  '), 'https://jaxa.jp')
})

test('validateMissionCore: name, slug and description are required (errors)', () => {
  const issues = validateMissionCore({ name: '', slug: '', description: '' })
  assert.equal(hasBlockingErrors(issues), true)
  assert.ok(issueForField(issues, 'name'))
  assert.ok(issueForField(issues, 'slug'))
  assert.ok(issueForField(issues, 'description'))
  assert.equal(issueForField(issues, 'name')!.level, 'error')
})

test('validateMissionCore: a valid core produces no blocking errors', () => {
  const issues = validateMissionCore({
    name: 'Artemis III', slug: 'artemis-iii', description: 'Crewed lunar landing.',
  })
  assert.equal(hasBlockingErrors(issues), false)
})

test('validateMissionCore: over-limit name blocks; bad slug format only warns', () => {
  const longName = 'A'.repeat(MISSION_LIMITS.name + 1)
  const nameIssues = validateMissionCore({ name: longName, slug: 'ok-slug', description: 'x' })
  assert.equal(issueForField(nameIssues, 'name')!.level, 'error')

  const slugIssues = validateMissionCore({ name: 'Fine', slug: 'Not A Slug!', description: 'x' })
  // Non-conforming slug is advisory (legacy slugs must stay editable), not blocking.
  assert.equal(issueForField(slugIssues, 'slug')!.level, 'warning')
  assert.equal(hasBlockingErrors(slugIssues), false)
})

test('validateIdentity: invalid URLs block, valid/empty URLs do not', () => {
  const bad = emptyIdentity()
  bad.website = 'notaurl'
  bad.wikipedia = 'https://en.wikipedia.org/wiki/Artemis_program'
  const issues = validateIdentity(bad)
  assert.equal(issueForField(issues, 'website')!.level, 'error')
  assert.equal(issueForField(issues, 'wikipedia'), undefined) // valid → no issue
})

test('validateIdentity: over-limit text fields block', () => {
  const id = emptyIdentity()
  id.acronym = 'X'.repeat(MISSION_LIMITS.acronym + 1)
  const issues = validateIdentity(id)
  assert.equal(issueForField(issues, 'acronym')!.level, 'error')
})

test('validateIdentity: missing summary/objective are warnings, never errors', () => {
  const issues = validateIdentity(emptyIdentity())
  const summary = issueForField(issues, 'summary')
  const objective = issueForField(issues, 'objective')
  assert.equal(summary!.level, 'warning')
  assert.equal(objective!.level, 'warning')
  assert.equal(hasBlockingErrors(issues), false)
})

test('validateMission: a rich, valid mission has zero errors and zero warnings', () => {
  const identity = emptyIdentity()
  identity.summary = 'First crewed landing near the lunar south pole.'
  identity.objective = 'Land astronauts on the Moon and return them safely.'
  identity.website = 'https://nasa.gov/artemis'
  const issues = validateMission({
    name: 'Artemis III', slug: 'artemis-iii',
    description: 'NASA crewed lunar landing mission.', identity,
  })
  assert.deepEqual(errorsOnly(issues), [])
  assert.deepEqual(warningsOnly(issues), [])
})

test('backward compatible: a legacy mission (core only, empty identity) saves', () => {
  // A pre-upgrade mission has name/slug/description but no identity fields. It
  // must not be blocked from saving (only advisory warnings allowed).
  const issues = validateMission({
    name: 'Voyager 1', slug: 'voyager-1',
    description: 'Interstellar probe launched in 1977.', identity: emptyIdentity(),
  })
  assert.equal(hasBlockingErrors(issues), false)
  assert.ok(warningsOnly(issues).length > 0) // summary/objective recommended
})
