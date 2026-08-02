/**
 * The chrome string table.
 *
 * The type system already forces every entry to carry every language, so the
 * interesting failures are the ones types cannot see: a translation left as a
 * copy of the English, a `{n}` placeholder that survives into the output
 * because the caller and the string disagree about the variable's name, and
 * plural handling that reads wrong at exactly one.
 *
 * Zero-dependency (node:test). Run with:
 *
 *     node --test --experimental-strip-types lib/ui.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { t, strings, tCount, type UIKey } from './ui.ts'
import { LANGUAGE_LIST } from './i18n.ts'

// Every key in the table, without exporting the table itself.
const KEYS: UIKey[] = [
  'chrome.search', 'chrome.openMenu', 'chrome.closeMenu', 'chrome.back',
  'chrome.main', 'chrome.sections', 'chrome.highlights', 'chrome.allArticles',
  'chrome.noHighlights', 'chrome.minRead',
  'common.loading', 'common.loadingMore',
  'footer.platform', 'footer.intelligence', 'footer.organization', 'footer.tagline',
  'footer.positioning', 'footer.description',
  'strip.issPosition', 'strip.liveTracking', 'strip.nextLaunch', 'strip.viewSchedule',
  'strip.apod', 'strip.todaysImage', 'strip.updatedDaily', 'strip.voyager',
  'strip.interstellar', 'strip.interstellarKms', 'strip.kmh', 'strip.billionKm',
  'strip.deepSpace', 'strip.probes', 'strip.telemetry',
  'about.eyebrow', 'about.headline', 'about.body', 'about.cta',
  'about.statMissions', 'about.statSystems', 'about.statTrust', 'about.statTrustSub',
  'home.featuredStory', 'home.readFullStory', 'home.readLatest', 'home.viewLive',
  'home.latestArticles', 'home.latestEyebrow', 'home.viewAll', 'home.missionsTitle',
  'home.missionsEyebrow', 'home.allMissions', 'home.learnTitle', 'home.learnEyebrow',
  'home.exploreTopics', 'home.noArticles', 'home.noMissions', 'home.noTopics',
  'articles.eyebrow', 'articles.title', 'articles.lede', 'articles.empty',
  'articles.emptyHint', 'articles.emptyCat', 'articles.endOne', 'articles.endMany',
  'articles.back', 'articles.related', 'articles.views', 'articles.share', 'articles.shareGroup',
  'missions.eyebrow', 'missions.title', 'missions.lede', 'missions.empty',
  'missions.emptyStatus', 'missions.endOne', 'missions.endMany', 'missions.back',
  'missions.related', 'missions.crumb', 'missions.filterAll', 'missions.filterActive',
  'missions.filterUpcoming', 'missions.filterDev', 'missions.filterCompleted',
  'learn.eyebrow', 'learn.title', 'learn.lede', 'learn.empty', 'learn.countOne',
  'learn.countMany', 'learn.readArticle', 'learn.featured', 'learn.back', 'learn.allArticles',
  'learn.filterAll', 'learn.beginner', 'learn.intermediate', 'learn.advanced',
]

test('every key resolves to a non-empty string in every language', () => {
  for (const key of KEYS) {
    for (const { code } of LANGUAGE_LIST) {
      const value = t(key, code)
      assert.ok(value && value.trim().length > 0, `"${key}" is empty in ${code}`)
    }
  }
})

test('no Hindi string was left as a copy of the English', () => {
  // The quiet failure mode: a key added to the table and filled in on both
  // sides with the same text.
  //
  // The exemptions are names, and they are listed rather than pattern-matched
  // on purpose — keeping a string in English has to be a decision someone
  // wrote down, not something a regex quietly permits. Respelling these in
  // Devanagari (नासा एपीओडी, वॉयेजर 1) would be transliteration, not
  // translation: the same letters in another alphabet, harder to recognise and
  // not what a reader searches for. See the policy note in lib/ui.ts.
  const PROPER_NOUNS = new Set<UIKey>([
    'strip.apod',     // NASA APOD — an agency name and a product acronym
    'strip.voyager',  // Voyager 1 — a spacecraft name
  ])

  for (const key of KEYS) {
    if (PROPER_NOUNS.has(key)) continue
    assert.notEqual(t(key, 'hi'), t(key, 'en'), `"${key}" is still English in hi`)
  }
})

test('the proper-noun exemptions really are still in Latin script', () => {
  // The other half of the rule: an exemption is a promise that the string stays
  // a name. If someone "helpfully" transliterates one later, the allow-list
  // above would silently stop protecting anything.
  for (const key of ['strip.apod', 'strip.voyager'] as UIKey[]) {
    assert.doesNotMatch(t(key, 'hi'), /[ऀ-ॿ]/, `"${key}" should stay in Latin script`)
  }
})

test('no Devanagari leaked into an English string', () => {
  for (const key of KEYS) {
    assert.doesNotMatch(t(key, 'en'), /[ऀ-ॿ]/, `"${key}" has Devanagari in en`)
  }
})

test('placeholders are substituted, and none survive into the output', () => {
  assert.equal(t('chrome.minRead', 'en', { n: 7 }), '7 min read')
  assert.equal(t('chrome.minRead', 'hi', { n: 7 }), '7 मिनट पढ़ें')

  // The bug this catches: a caller passing the wrong variable name, leaving a
  // literal "{n}" on the page.
  for (const key of KEYS) {
    for (const { code } of LANGUAGE_LIST) {
      const rendered = t(key, code, { n: 3 })
      assert.doesNotMatch(rendered, /\{[a-z]+\}/i, `"${key}" left a placeholder in ${code}`)
    }
  }
})

test('tCount: English switches on one, Hindi keeps a single form', () => {
  assert.equal(tCount(1, 'articles.endOne', 'articles.endMany', 'en'), 'You’ve reached the end · 1 article')
  assert.equal(tCount(5, 'articles.endOne', 'articles.endMany', 'en'), 'You’ve reached the end · 5 articles')
  assert.equal(tCount(1, 'learn.countOne', 'learn.countMany', 'en'), '1 article')
  assert.equal(tCount(2, 'learn.countOne', 'learn.countMany', 'en'), '2 articles')
  // Hindi does not inflect the noun for number here, so both read naturally.
  assert.equal(tCount(1, 'learn.countOne', 'learn.countMany', 'hi'), '1 लेख')
  assert.equal(tCount(9, 'learn.countOne', 'learn.countMany', 'hi'), '9 लेख')
})

test('strings(): binds the language once', () => {
  const ui = strings('hi')
  assert.equal(ui('learn.title'), t('learn.title', 'hi'))
  assert.equal(ui('chrome.minRead', { n: 4 }), '4 मिनट पढ़ें')
})
