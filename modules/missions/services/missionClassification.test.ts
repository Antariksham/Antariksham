/**
 * Unit tests for the Rich Mission Classification taxonomy + mapping
 * (Phase 1, Feature 2). Zero-dependency Node test runner:
 *
 *   node --test --experimental-strip-types modules/missions/services/missionClassification.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MISSION_STATUSES, MISSION_TYPE_TAGS, DESTINATION_SUGGESTIONS,
  statusMeta, legacyStatusFor, extendedStatusFromLegacy,
  typeLabel, legacyTypeFor, extendedTypeFromLegacy,
  emptyClassification, effectiveClassification, normalizeClassification,
  classificationToBaseColumns, classificationAgencyIds, humanize,
} from './missionClassification.ts'

test('taxonomies: expected sizes', () => {
  assert.equal(MISSION_STATUSES.length, 15)
  assert.equal(MISSION_TYPE_TAGS.length, 21)
  assert.equal(DESTINATION_SUGGESTIONS.length, 18)
})

test('every extended status maps to a valid legacy projection', () => {
  const legacy = new Set(['active', 'upcoming', 'completed', 'failed', 'in-development', 'cancelled'])
  for (const s of MISSION_STATUSES) assert.ok(legacy.has(s.legacy), `${s.value} → ${s.legacy}`)
})

test('statusMeta: extended, legacy and unknown values all resolve', () => {
  assert.equal(statusMeta('cruise').label, 'Cruise')
  assert.equal(statusMeta('in-development').label, 'In Development') // legacy-only
  assert.equal(statusMeta('some-future-state').label, 'Some Future State') // humanized fallback
  assert.ok(statusMeta('cruise').color)
})

test('legacyStatusFor: extended → legacy; passthrough; unknown → upcoming', () => {
  assert.equal(legacyStatusFor('cruise'), 'active')
  assert.equal(legacyStatusFor('planning'), 'in-development')
  assert.equal(legacyStatusFor('completed'), 'completed')
  assert.equal(legacyStatusFor('in-development'), 'in-development') // legacy passthrough
  assert.equal(legacyStatusFor('nonsense'), 'upcoming')
})

test('extendedStatusFromLegacy round-trips in-development ↔ planning', () => {
  assert.equal(extendedStatusFromLegacy('in-development'), 'planning')
  assert.equal(legacyStatusFor('planning'), 'in-development')
  assert.equal(extendedStatusFromLegacy('active'), 'active')
})

test('type helpers', () => {
  assert.equal(typeLabel('space-telescope'), 'Space Telescope')
  assert.equal(typeLabel('unknown-tag'), 'Unknown Tag')
  assert.equal(legacyTypeFor('space-telescope'), 'telescope')
  assert.equal(legacyTypeFor('helicopter'), 'robotic')
  assert.equal(legacyTypeFor(''), 'robotic')
  assert.equal(extendedTypeFromLegacy('telescope'), 'space-telescope')
  assert.equal(extendedTypeFromLegacy('crewed'), 'crewed')
})

test('effectiveClassification: falls back to base columns when no details', () => {
  const c = effectiveClassification(null, { status: 'active', missionType: 'telescope', destination: 'Mars' })
  assert.equal(c.status, 'active')
  assert.deepEqual(c.types, ['space-telescope'])
  assert.deepEqual(c.destinations, ['Mars'])
  assert.deepEqual(c.agencies.partners, [])
})

test('effectiveClassification: legacy in-development falls back to planning', () => {
  const c = effectiveClassification(undefined, { status: 'in-development', missionType: 'robotic', destination: '' })
  assert.equal(c.status, 'planning')
  assert.deepEqual(c.destinations, []) // empty base destination → no destinations
})

test('effectiveClassification: prefers stored details over base columns', () => {
  const c = effectiveClassification(
    { status: 'orbiting', types: ['orbiter', 'planetary-science'], destinations: ['Jupiter', 'Europa'], agencies: { partners: ['a1'], commercial: ['c1'], institutions: [] } },
    { status: 'active', missionType: 'robotic', destination: 'Mars' },
  )
  assert.equal(c.status, 'orbiting')
  assert.deepEqual(c.types, ['orbiter', 'planetary-science'])
  assert.deepEqual(c.destinations, ['Jupiter', 'Europa'])
  assert.deepEqual(c.agencies.partners, ['a1'])
  assert.deepEqual(c.agencies.commercial, ['c1'])
})

test('normalizeClassification: trims, de-dupes and preserves order', () => {
  const n = normalizeClassification({
    status: '  cruise  ',
    types: ['orbiter', 'orbiter', '  rover ', ''],
    destinations: ['Mars', 'Mars', ' Europa '],
    agencies: { partners: ['a', 'a'], commercial: [], institutions: ['x'] },
  } as any)
  assert.equal(n.status, 'cruise')
  assert.deepEqual(n.types, ['orbiter', 'rover'])
  assert.deepEqual(n.destinations, ['Mars', 'Europa'])
  assert.deepEqual(n.agencies.partners, ['a'])
  assert.deepEqual(n.agencies.institutions, ['x'])
})

test('classificationToBaseColumns: primary projections for the base columns', () => {
  const base = classificationToBaseColumns({
    status: 'cruise',
    types: ['space-telescope', 'astronomy'],
    destinations: ['Sun', 'Deep Space'],
    agencies: { partners: [], commercial: [], institutions: [] },
  })
  assert.equal(base.status, 'active')        // cruise → active
  assert.equal(base.missionType, 'telescope') // primary type space-telescope → telescope
  assert.equal(base.destination, 'Sun')       // primary destination
})

test('classificationToBaseColumns: empty selections yield safe defaults', () => {
  const base = classificationToBaseColumns(emptyClassification())
  assert.equal(base.status, 'upcoming')
  assert.equal(base.missionType, 'robotic')
  assert.equal(base.destination, '')
})

test('classificationAgencyIds: unions all roles and de-dupes', () => {
  const ids = classificationAgencyIds({
    status: 'active', types: [], destinations: [],
    agencies: { partners: ['a', 'b'], commercial: ['b', 'c'], institutions: ['d'] },
  })
  assert.deepEqual(ids.sort(), ['a', 'b', 'c', 'd'])
})

test('humanize', () => {
  assert.equal(humanize('deep-space'), 'Deep Space')
  assert.equal(humanize('surface_operations'), 'Surface Operations')
  assert.equal(humanize(''), '')
})
