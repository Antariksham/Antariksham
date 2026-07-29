/**
 * Unit tests for destination → body matching.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/explore/services/bodyMissions.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchBodyForDestination, groupMissionsByBody, type ExploreMissionRef } from './bodyMissions.ts'
import { SOLAR_BODIES } from './solarSystemBodies.ts'

const ref = (over: Partial<ExploreMissionRef>): ExploreMissionRef => ({
  name: 'M', slug: 'm', status: 'active', destination: null, launchDate: null, ...over,
})

test('matches plain and adjective destinations', () => {
  assert.equal(matchBodyForDestination('Mars', SOLAR_BODIES), 'mars')
  assert.equal(matchBodyForDestination('Martian surface', SOLAR_BODIES), 'mars')
  assert.equal(matchBodyForDestination('Lunar south pole', SOLAR_BODIES), 'moon')
  assert.equal(matchBodyForDestination('Low Earth Orbit', SOLAR_BODIES), 'earth')
})

test('longest alias wins when several bodies match', () => {
  // Contains `moon` (Moon) but also `jupiter` + `europa` (Jupiter) — the
  // longer, more specific alias must win.
  assert.equal(matchBodyForDestination("Jupiter's moon Europa", SOLAR_BODIES), 'jupiter')
  assert.equal(matchBodyForDestination('Europa', SOLAR_BODIES), 'jupiter')
  assert.equal(matchBodyForDestination('Titan', SOLAR_BODIES), 'saturn')
})

test('whole-word matching: aliases never fire inside other words', () => {
  // "Galileo" contains the letters `leo` — must not match Earth.
  assert.equal(matchBodyForDestination('Galileo memorial site', SOLAR_BODIES), null)
})

test('unknown or empty destinations match nothing', () => {
  assert.equal(matchBodyForDestination('Interstellar space', SOLAR_BODIES), null)
  assert.equal(matchBodyForDestination(null, SOLAR_BODIES), null)
  assert.equal(matchBodyForDestination('', SOLAR_BODIES), null)
})

test('groupMissionsByBody: groups and sorts newest-first, dateless last', () => {
  const grouped = groupMissionsByBody([
    ref({ slug: 'a', destination: 'Mars', launchDate: '2020-07-30' }),
    ref({ slug: 'b', destination: 'Martian orbit', launchDate: '2024-10-14' }),
    ref({ slug: 'c', destination: 'Mars', launchDate: null }),
    ref({ slug: 'd', destination: 'Moon' }),
    ref({ slug: 'e', destination: 'Deep space' }),
  ], SOLAR_BODIES)

  assert.deepEqual(grouped.mars.map(m => m.slug), ['b', 'a', 'c'])
  assert.deepEqual(grouped.moon.map(m => m.slug), ['d'])
  assert.equal('e' in grouped, false)
  assert.equal(Object.keys(grouped).length, 2)
})

test('groupMissionsByBody: empty input → empty record', () => {
  assert.deepEqual(groupMissionsByBody([], SOLAR_BODIES), {})
})
