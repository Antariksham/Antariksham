/**
 * Unit tests for the category field helpers.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types modules/admin/categories/categoryFields.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeCategoryName, categorySlug, isValidCategoryName,
  isReservedCategoryName, normalizeHexColor, MAX_CATEGORY_NAME_LENGTH,
} from './categoryFields.ts'

test('normalizeCategoryName trims and collapses whitespace, keeping case', () => {
  assert.equal(normalizeCategoryName('  Deep   Space '), 'Deep Space')
  assert.equal(normalizeCategoryName('JAXA'), 'JAXA')
})

test('normalizeCategoryName caps the length without a trailing space', () => {
  const name = normalizeCategoryName('a'.repeat(35) + ' ' + 'b'.repeat(20))
  assert.equal(name.length <= MAX_CATEGORY_NAME_LENGTH, true)
  assert.equal(name, name.trim())
})

test('categorySlug is url-safe and folds accents', () => {
  assert.equal(categorySlug('Deep Space'), 'deep-space')
  assert.equal(categorySlug('Astronomía'), 'astronomia')
})

test('isValidCategoryName rejects names with no slug to key on', () => {
  assert.equal(isValidCategoryName('Science'), true)
  assert.equal(isValidCategoryName('  '), false)
  assert.equal(isValidCategoryName('###'), false)
})

test('isReservedCategoryName blocks the listing’s "all" sentinel', () => {
  // ArticlesPage uses the literal 'all' for "no filter", so a category named
  // this way could never be selected.
  assert.equal(isReservedCategoryName('All'), true)
  assert.equal(isReservedCategoryName('all'), true)
  assert.equal(isReservedCategoryName(' ALL '), true)
  assert.equal(isReservedCategoryName('All Missions'), false)
})

test('normalizeHexColor accepts both hex forms and expands the short one', () => {
  assert.equal(normalizeHexColor('#4F8EF7'), '#4f8ef7')
  assert.equal(normalizeHexColor('4f8ef7'), '#4f8ef7')
  assert.equal(normalizeHexColor('#abc'), '#aabbcc')
  assert.equal(normalizeHexColor('  #2ECC71  '), '#2ecc71')
})

test('normalizeHexColor rejects anything that is not a hex colour', () => {
  // The value ends up in a CSS `color`, so a half-valid string must not pass.
  assert.equal(normalizeHexColor(''), null)
  assert.equal(normalizeHexColor('red'), null)
  assert.equal(normalizeHexColor('#12345'), null)
  assert.equal(normalizeHexColor('rgb(1,2,3)'), null)
  assert.equal(normalizeHexColor('red; background: url(x)'), null)
})
