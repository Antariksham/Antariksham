import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBreadcrumbs, extractFaqs, buildFaqJsonLd, stripHtml,
  buildMissionJsonLd, buildLearnJsonLd, buildWebSiteJsonLd,
  type SiteInfo,
} from './jsonLd.ts'

// A stand-in for config/site.ts. Passing it in is the point: these builders take
// the site as data, so they never reach for the `@/` alias and stay runnable
// under the bare node test runner.
const SITE: SiteInfo = {
  url: 'https://antariksham.org',
  name: 'Antariksham',
  description: 'Space intelligence.',
  tagline: 'Independent Space Intelligence & Knowledge Platform',
  email: 'contact@antariksham.org',
  twitter: '@antariksham',
  seo: { logo: '/logo.svg' },
}

// ── Breadcrumbs ──────────────────────────────────────────────

test('buildBreadcrumbs: numbers positions from 1 and makes every item absolute', () => {
  const bc = buildBreadcrumbs([
    { name: 'Articles', path: '/articles' },
    { name: 'A Story',  path: '/articles/a-story' },
  ], SITE) as any

  assert.equal(bc['@type'], 'BreadcrumbList')
  assert.deepEqual(bc.itemListElement.map((i: any) => i.position), [1, 2])
  assert.equal(bc.itemListElement[0].item, 'https://antariksham.org/articles')
  assert.equal(bc.itemListElement[1].name, 'A Story')
})

// ── FAQ extraction ───────────────────────────────────────────

const FAQ_HTML = `
  <p>Intro paragraph.</p>
  <details class="faq"><summary>How hot does it get?</summary><p>Around 1,600&nbsp;&deg;C.</p></details>
  <details class="faq"><summary>Is it reusable?</summary><p>Yes &amp; routinely.</p></details>
`

test('extractFaqs: pulls question/answer pairs out of editor FAQ blocks', () => {
  const faqs = extractFaqs(FAQ_HTML)
  assert.equal(faqs.length, 2)
  assert.equal(faqs[0].question, 'How hot does it get?')
  assert.equal(faqs[1].question, 'Is it reusable?')
  // Entities the editor emits are decoded, so the answer reads as prose.
  assert.equal(faqs[1].answer, 'Yes & routinely.')
})

test('extractFaqs: the answer excludes the summary text', () => {
  const [faq] = extractFaqs('<details class="faq"><summary>Q text</summary><p>A text</p></details>')
  assert.equal(faq.answer, 'A text')
  assert.ok(!faq.answer.includes('Q text'))
})

test('extractFaqs: skips half-written blocks rather than emitting a broken FAQ', () => {
  // Structured data that does not match the visible page is penalised, so a
  // block missing its question or answer must be dropped, not guessed at.
  assert.equal(extractFaqs('<details class="faq"><p>No summary</p></details>').length, 0)
  assert.equal(extractFaqs('<details class="faq"><summary>Q</summary></details>').length, 0)
  assert.equal(extractFaqs('<details class="faq"><summary>  </summary><p>A</p></details>').length, 0)
})

test('extractFaqs: ignores <details> that is not an FAQ block', () => {
  assert.equal(extractFaqs('<details class="spoiler"><summary>Q</summary><p>A</p></details>').length, 0)
  // …but tolerates extra classes and attribute order around the faq class.
  assert.equal(extractFaqs('<details id="x" class="box faq open"><summary>Q</summary><p>A</p></details>').length, 1)
})

test('extractFaqs: empty and malformed input returns nothing instead of throwing', () => {
  assert.deepEqual(extractFaqs(''), [])
  assert.deepEqual(extractFaqs('<details class="faq">unclosed'), [])
})

test('buildFaqJsonLd: null when there is no FAQ, FAQPage when there is', () => {
  assert.equal(buildFaqJsonLd('<p>Just prose.</p>'), null)
  const ld = buildFaqJsonLd(FAQ_HTML) as any
  assert.equal(ld['@type'], 'FAQPage')
  assert.equal(ld.mainEntity.length, 2)
  assert.equal(ld.mainEntity[0]['@type'], 'Question')
  assert.equal(ld.mainEntity[0].acceptedAnswer['@type'], 'Answer')
})

test('stripHtml: removes markup and collapses whitespace', () => {
  assert.equal(stripHtml('<p>a  <b>b</b>\n c</p>'), 'a b c')
})

// ── Missions ─────────────────────────────────────────────────

const MISSION = {
  name: 'Perseverance', slug: 'perseverance', description: 'A rover.',
  featuredImage: 'https://img/p.jpg', launchDate: '2020-07-30',
  destination: 'Mars', agencyName: 'NASA',
}

test('buildMissionJsonLd: core fields, destination as a Place, agency as sponsor', () => {
  const ld = buildMissionJsonLd(MISSION, SITE) as any
  assert.equal(ld['@type'], 'CreativeWork')
  assert.equal(ld.name, 'Perseverance')
  assert.equal(ld.about['@type'], 'Place')
  assert.equal(ld.about.name, 'Mars')
  assert.equal(ld.sponsor.name, 'NASA')
  assert.match(ld.url, /\/missions\/perseverance$/)
})

test('buildMissionJsonLd: summary wins over description, and sameAs collects real links only', () => {
  const ld = buildMissionJsonLd({
    ...MISSION, summary: 'Short summary.', website: 'https://nasa.gov/p', wikipedia: undefined,
  }, SITE) as any
  assert.equal(ld.description, 'Short summary.')
  assert.deepEqual(ld.sameAs, ['https://nasa.gov/p'])
})

test('buildMissionJsonLd: legacy mission with empty fields omits them rather than emitting nulls', () => {
  const ld = buildMissionJsonLd({
    name: 'Old', slug: 'old', description: '', featuredImage: null,
    launchDate: null, destination: null, agencyName: null,
  }, SITE) as any
  assert.equal(ld.about, undefined)
  assert.equal(ld.sponsor, undefined)
  assert.equal(ld.image, undefined)
  assert.equal(ld.sameAs, undefined)
  // …and the omissions really do vanish from the serialised output.
  assert.ok(!JSON.stringify(ld).includes('null'))
})

// ── Learn ────────────────────────────────────────────────────

test('buildLearnJsonLd: LearningResource with the difficulty mapped to a level', () => {
  const ld = buildLearnJsonLd({
    title: 'What Is a Heat Shield?', slug: 'heat-shield', excerpt: 'Guide.',
    thumbnail: null, difficultyLevel: 'advanced',
    createdAt: '2026-01-01', updatedAt: '2026-02-02',
  }, SITE) as any
  assert.equal(ld['@type'], 'LearningResource')
  assert.equal(ld.educationalLevel, 'Advanced')
  assert.equal(ld.dateModified, '2026-02-02')
  assert.equal(ld.isAccessibleForFree, true)
})

test('buildLearnJsonLd: an unknown difficulty omits the level instead of inventing one', () => {
  const ld = buildLearnJsonLd({
    title: 'T', slug: 's', excerpt: '', thumbnail: null,
    difficultyLevel: 'wizard', createdAt: '2026-01-01', updatedAt: '',
  }, SITE) as any
  assert.equal(ld.educationalLevel, undefined)
  // dateModified falls back to the creation date rather than going empty.
  assert.equal(ld.dateModified, '2026-01-01')
})

// ── Site level ───────────────────────────────────────────────

test('buildWebSiteJsonLd: SearchAction points at /search with the query placeholder', () => {
  const ld = buildWebSiteJsonLd(SITE) as any
  assert.equal(ld['@type'], 'WebSite')
  assert.equal(ld.potentialAction['@type'], 'SearchAction')
  assert.equal(ld.potentialAction.target.urlTemplate, 'https://antariksham.org/search?q={search_term_string}')
  // Google requires this exact query-input string for the sitelinks searchbox.
  assert.equal(ld.potentialAction['query-input'], 'required name=search_term_string')
})
