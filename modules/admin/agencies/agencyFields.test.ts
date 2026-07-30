/**
 * Unit tests for the space-agency field helpers.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/agencies/agencyFields.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeAgencyName, agencySlug, suggestShortName, normalizeAgencyUrl,
  isValidAgencyName, MAX_SHORT_NAME_LENGTH,
} from './agencyFields.ts'

test('normalizeAgencyName trims and collapses whitespace, keeping case', () => {
  assert.equal(normalizeAgencyName('  Indian   Space Research Organisation '), 'Indian Space Research Organisation')
  assert.equal(normalizeAgencyName('ISRO'), 'ISRO')
})

test('agencySlug folds accents instead of deleting the letter', () => {
  // The apostrophe is a separator, so "d" stays its own segment — the point is
  // that É folds to E. lib/utils.slugify would delete it: 'centre-national-d-tudes…'.
  assert.equal(agencySlug("Centre National d'Études Spatiales"), 'centre-national-d-etudes-spatiales')
  assert.equal(agencySlug('European Space Agency'), 'european-space-agency')
})

test('suggestShortName builds the acronym from significant words', () => {
  assert.equal(suggestShortName('National Aeronautics and Space Administration'), 'NASA')
  assert.equal(suggestShortName('Indian Space Research Organisation'), 'ISRO')
  assert.equal(suggestShortName("Centre National d'Études Spatiales"), 'CNES')
})

test('suggestShortName returns a single-word name as itself', () => {
  assert.equal(suggestShortName('SpaceX'), 'SpaceX')
  assert.equal(suggestShortName('Roscosmos'), 'Roscosmos')
})

test('suggestShortName is empty for nothing usable, and never over the cap', () => {
  assert.equal(suggestShortName('   '), '')
  assert.equal(suggestShortName('!!!'), '')
  const long = suggestShortName('Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliet Kilo Lima Mike')
  assert.equal(long.length <= MAX_SHORT_NAME_LENGTH, true)
})

test('normalizeAgencyUrl adds the missing protocol and passes through a real one', () => {
  assert.equal(normalizeAgencyUrl('esa.int'), 'https://esa.int')
  assert.equal(normalizeAgencyUrl('https://www.nasa.gov'), 'https://www.nasa.gov')
  assert.equal(normalizeAgencyUrl('http://isro.gov.in'), 'http://isro.gov.in')
})

test('normalizeAgencyUrl treats blank as absent rather than as a bare https://', () => {
  assert.equal(normalizeAgencyUrl(''), null)
  assert.equal(normalizeAgencyUrl('   '), null)
})

test('isValidAgencyName rejects names with no slug to key on', () => {
  assert.equal(isValidAgencyName('JAXA'), true)
  assert.equal(isValidAgencyName('  '), false)
  assert.equal(isValidAgencyName('---'), false)
})
