import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  absoluteUrl, imageMimeType, clampDescription, isLatinRenderable, ogCardPath,
  resolveOgImage, buildSocialCard,
  DEFAULT_OG_PATH, OG_DESCRIPTION_MAX, OG_HEADLINE_MAX, OG_IMAGE_SIZE,
  type SocialSite,
} from './socialMeta.ts'

// A stand-in for config/site.ts — same contract as jsonLd.test.ts, and for the
// same reason: these builders take the site as data, so they never reach for
// the `@/` alias and stay runnable under the bare node test runner.
const SITE: SocialSite = {
  url:     'https://antariksham.org',
  name:    'Antariksham',
  locale:  'en_US',
  twitter: '@antariksham',
}

// ── absoluteUrl ──────────────────────────────────────────────

test('absoluteUrl: makes a site path absolute', () => {
  assert.equal(absoluteUrl(SITE, '/article/a'), 'https://antariksham.org/article/a')
})

test('absoluteUrl: leaves an off-origin image untouched', () => {
  const supabase = 'https://x.supabase.co/storage/v1/object/public/img/a.jpg'
  assert.equal(absoluteUrl(SITE, supabase), supabase)
  assert.equal(absoluteUrl(SITE, 'http://example.com/a.png'), 'http://example.com/a.png')
})

test('absoluteUrl: root keeps a trailing slash so og:url matches the canonical', () => {
  assert.equal(absoluteUrl(SITE, '/'), 'https://antariksham.org/')
  assert.equal(absoluteUrl(SITE, ''),  'https://antariksham.org/')
})

test('absoluteUrl: tolerates a trailing slash on the configured site url', () => {
  assert.equal(
    absoluteUrl({ ...SITE, url: 'https://antariksham.org/' }, '/gallery'),
    'https://antariksham.org/gallery',
  )
})

test('absoluteUrl: upgrades a protocol-relative image', () => {
  assert.equal(absoluteUrl(SITE, '//cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg')
})

// ── imageMimeType ────────────────────────────────────────────

test('imageMimeType: maps the extensions scrapers care about', () => {
  assert.equal(imageMimeType('/a.jpg'),  'image/jpeg')
  assert.equal(imageMimeType('/a.JPEG'), 'image/jpeg')
  assert.equal(imageMimeType('/a.png'),  'image/png')
  assert.equal(imageMimeType('/a.webp'), 'image/webp')
})

test('imageMimeType: ignores a query string (Supabase signs with ?token=)', () => {
  assert.equal(imageMimeType('https://x.supabase.co/a.jpg?token=abc.def'), 'image/jpeg')
})

test('imageMimeType: returns undefined rather than guessing', () => {
  assert.equal(imageMimeType('/og?title=Hello'), undefined)
  assert.equal(imageMimeType('/opengraph-image'), undefined)
})

// ── clampDescription ─────────────────────────────────────────

test('clampDescription: collapses whitespace and leaves short text alone', () => {
  assert.equal(clampDescription('  Two   lines\nof text '), 'Two lines of text')
})

test('clampDescription: cuts on a word boundary and never exceeds the budget', () => {
  const long = 'word '.repeat(120).trim()
  const out  = clampDescription(long)
  assert.ok(out.length <= OG_DESCRIPTION_MAX, `got ${out.length}`)
  assert.ok(out.endsWith('word…'), out.slice(-10))
})

test('clampDescription: falls back to a hard cut when there is no word break', () => {
  const out = clampDescription('x'.repeat(400), 50)
  assert.equal(out.length, 50)
  assert.ok(out.endsWith('…'))
})

test('clampDescription: does not leave dangling punctuation before the ellipsis', () => {
  const out = clampDescription(`${'word '.repeat(60)}sentence, and more words here`.trim(), 60)
  assert.ok(!/[,\s]…$/.test(out), out)
})

// ── isLatinRenderable ────────────────────────────────────────

test('isLatinRenderable: accepts Latin text with typographic punctuation', () => {
  assert.equal(isLatinRenderable("Artemis II: NASA's First Crewed Return — 2026"), true)
  assert.equal(isLatinRenderable('Ariane 6 · Cañaveral “quote” …'), true)
})

test('isLatinRenderable: rejects Devanagari, which the bundled font cannot draw', () => {
  assert.equal(isLatinRenderable('अंतरिक्ष'), false)
  assert.equal(isLatinRenderable('Chandrayaan चंद्रयान'), false)
})

// ── ogCardPath ───────────────────────────────────────────────

test('ogCardPath: encodes the headline into the generated-card route', () => {
  const path = ogCardPath({ title: 'Artemis II & the Moon', eyebrow: 'Analysis' })
  assert.ok(path.startsWith('/og?'), path)
  const q = new URLSearchParams(path.slice(path.indexOf('?') + 1))
  assert.equal(q.get('title'),   'Artemis II & the Moon')
  assert.equal(q.get('eyebrow'), 'Analysis')
})

test('ogCardPath: clamps an overlong headline', () => {
  const q = new URLSearchParams(ogCardPath({ title: 'a'.repeat(400) }).split('?')[1])
  assert.equal(q.get('title')!.length, OG_HEADLINE_MAX)
})

test('ogCardPath: falls back to the brand card for text the font cannot draw', () => {
  assert.equal(ogCardPath({ title: 'चंद्रयान-3' }), DEFAULT_OG_PATH)
  assert.equal(ogCardPath({ title: '   ' }),        DEFAULT_OG_PATH)
})

test('ogCardPath: drops an unrenderable eyebrow but keeps a Latin headline', () => {
  const q = new URLSearchParams(ogCardPath({ title: 'Chandrayaan 3', eyebrow: 'मिशन' }).split('?')[1])
  assert.equal(q.get('title'), 'Chandrayaan 3')
  assert.equal(q.get('eyebrow'), null)
})

// ── resolveOgImage ───────────────────────────────────────────

test('resolveOgImage: uses the content image, with dimensions and a mime type', () => {
  const img = resolveOgImage(SITE, {
    image: 'https://x.supabase.co/a.jpg', imageAlt: 'Artemis II stack', title: 'Artemis II',
  })
  assert.equal(img.url,    'https://x.supabase.co/a.jpg')
  assert.equal(img.width,  OG_IMAGE_SIZE.width)
  assert.equal(img.height, OG_IMAGE_SIZE.height)
  assert.equal(img.alt,    'Artemis II stack')
  assert.equal(img.type,   'image/jpeg')
})

test('resolveOgImage: falls back to the title when the image has no alt', () => {
  const img = resolveOgImage(SITE, { image: '/a.png', title: 'Artemis II' })
  assert.equal(img.alt, 'Artemis II')
})

// The regression this module exists for: `images: featured ? [featured] : []`
// shipped an *empty* override, so an article with no featured image had no card.
test('resolveOgImage: never returns nothing when the page has no image', () => {
  for (const image of [null, undefined, '', '   ']) {
    const img = resolveOgImage(SITE, { image, title: 'No hero' })
    assert.equal(img.url,  'https://antariksham.org/opengraph-image')
    assert.equal(img.type, 'image/png')
  }
})

test('resolveOgImage: honours a route-specific fallback card', () => {
  const img = resolveOgImage(SITE, { image: null, title: 'No hero' }, '/og?title=No+hero')
  assert.equal(img.url,  'https://antariksham.org/og?title=No+hero')
  assert.equal(img.type, 'image/png')
})

// ── buildSocialCard ──────────────────────────────────────────

test('buildSocialCard: emits the full card, not a partial one', () => {
  const { openGraph, twitter } = buildSocialCard(SITE, {
    path: '/explore', title: 'Explore', description: 'Interactive gateways to the cosmos.',
  })

  assert.equal(openGraph.url,      'https://antariksham.org/explore')
  assert.equal(openGraph.siteName, 'Antariksham')
  assert.equal(openGraph.locale,   'en_US')
  assert.equal(openGraph.type,     'website')
  assert.equal(openGraph.images.length, 1)
  // The bug that made every shared article show the site title on X.
  assert.equal(twitter.title,       'Explore')
  assert.equal(twitter.description, 'Interactive gateways to the cosmos.')
  assert.deepEqual(twitter.images,  [openGraph.images[0].url])
})

test('buildSocialCard: carries article fields only on og:type=article', () => {
  const article = buildSocialCard(SITE, {
    path: '/article/a', title: 'A', description: 'd', type: 'article',
    publishedTime: '2026-07-25T14:55:00Z', modifiedTime: '2026-07-26T09:00:00Z',
    authors: ['Mayank Prasad'], section: 'Missions', tags: ['artemis', 'moon'],
  })
  assert.equal(article.openGraph.publishedTime, '2026-07-25T14:55:00Z')
  assert.equal(article.openGraph.modifiedTime,  '2026-07-26T09:00:00Z')
  assert.deepEqual(article.openGraph.authors,   ['Mayank Prasad'])
  assert.equal(article.openGraph.section,       'Missions')

  const page = buildSocialCard(SITE, {
    path: '/explore', title: 'E', description: 'd', publishedTime: '2026-07-25T14:55:00Z',
  })
  assert.equal(page.openGraph.publishedTime, undefined)
})

test('buildSocialCard: caps og:tag so a long tag list cannot bloat the head', () => {
  const { openGraph } = buildSocialCard(SITE, {
    path: '/article/a', title: 'A', description: 'd', type: 'article',
    tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  })
  assert.equal(openGraph.tags!.length, 6)
})

test('buildSocialCard: omits empty article fields rather than emitting blanks', () => {
  const { openGraph } = buildSocialCard(SITE, {
    path: '/article/a', title: 'A', description: 'd', type: 'article',
    publishedTime: null, modifiedTime: null, authors: [], section: null, tags: [],
  })
  assert.ok(!('publishedTime' in openGraph))
  assert.ok(!('authors' in openGraph))
  assert.ok(!('section' in openGraph))
  assert.ok(!('tags' in openGraph))
})

test('buildSocialCard: a page locale overrides the site default', () => {
  const { openGraph } = buildSocialCard(SITE, {
    path: '/hi/articles', title: 'Articles', description: 'd', locale: 'hi_IN',
  })
  assert.equal(openGraph.locale, 'hi_IN')
})

test('buildSocialCard: clamps the description for both networks', () => {
  const { openGraph, twitter } = buildSocialCard(SITE, {
    path: '/article/a', title: 'A', description: 'word '.repeat(200),
  })
  assert.ok(openGraph.description.length <= OG_DESCRIPTION_MAX)
  assert.equal(twitter.description, openGraph.description)
})
