/**
 * Unit tests for the mission identity helpers (Phase 1, Feature 1).
 *
 * Zero-dependency Node test runner. Run with:
 *
 *     node --test --experimental-strip-types modules/missions/services/missionIdentity.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyIdentity,
  normalizeIdentity,
  identityFromDetails,
  trimIdentity,
  isIdentityEmpty,
  buildMissionDetails,
  IDENTITY_FIELDS,
} from './missionIdentity.ts'

test('emptyIdentity: every field is an empty string', () => {
  const id = emptyIdentity()
  for (const f of IDENTITY_FIELDS) assert.equal(id[f], '')
})

test('normalizeIdentity: tolerates null/undefined/garbage', () => {
  assert.deepEqual(normalizeIdentity(undefined), emptyIdentity())
  assert.deepEqual(normalizeIdentity(null), emptyIdentity())
  assert.deepEqual(normalizeIdentity('nope'), emptyIdentity())
  assert.deepEqual(normalizeIdentity(42), emptyIdentity())
})

test('normalizeIdentity: keeps string fields, drops non-strings + unknown keys', () => {
  const id = normalizeIdentity({ acronym: 'JWST', summary: 42, bogus: 'x', website: 'https://a.b' })
  assert.equal(id.acronym, 'JWST')
  assert.equal(id.website, 'https://a.b')
  assert.equal(id.summary, '')                  // non-string dropped
  assert.equal((id as Record<string, unknown>).bogus, undefined) // unknown key not carried
})

test('identityFromDetails: reads the identity namespace out of a details blob', () => {
  const id = identityFromDetails({ identity: { shortName: 'ISS' }, other: { x: 1 } })
  assert.equal(id.shortName, 'ISS')
  assert.deepEqual(identityFromDetails(null), emptyIdentity())
  assert.deepEqual(identityFromDetails({}), emptyIdentity())
})

test('trimIdentity + isIdentityEmpty', () => {
  assert.equal(isIdentityEmpty(emptyIdentity()), true)
  const spaced = emptyIdentity(); spaced.subtitle = '   '
  assert.equal(isIdentityEmpty(spaced), true)             // whitespace = empty
  const filled = emptyIdentity(); filled.subtitle = '  Deep space  '
  assert.equal(trimIdentity(filled).subtitle, 'Deep space')
  assert.equal(isIdentityEmpty(filled), false)
})

test('buildMissionDetails: returns null when there is nothing to store', () => {
  assert.equal(buildMissionDetails(emptyIdentity()), null)
})

test('buildMissionDetails: stores a trimmed identity section', () => {
  const id = emptyIdentity(); id.acronym = '  JWST  '
  const details = buildMissionDetails(id)
  assert.ok(details)
  assert.equal(details!.identity!.acronym, 'JWST')
})

test('buildMissionDetails: preserves other (future) namespaces in existing details', () => {
  const id = emptyIdentity(); id.shortName = 'ISS'
  const details = buildMissionDetails(id, { launch: { site: 'Baikonur' } } as any)
  assert.equal((details as any).launch.site, 'Baikonur') // untouched
  assert.equal(details!.identity!.shortName, 'ISS')
})

test('buildMissionDetails: clears an emptied identity but keeps siblings', () => {
  const details = buildMissionDetails(emptyIdentity(), { identity: { acronym: 'OLD' }, launch: { site: 'KSC' } } as any)
  assert.equal(details!.identity, undefined) // emptied identity removed
  assert.equal((details as any).launch.site, 'KSC')
})
