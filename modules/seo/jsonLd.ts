/**
 * Shared JSON-LD builders.
 *
 * Structured data was uneven: articles and the Explore/Gallery pages emitted it,
 * missions and Learn emitted none at all, nothing emitted breadcrumbs outside
 * Explore, and the editor shipped an FAQ block whose content never became an
 * FAQPage. These are the two content types the site is most differentiated on
 * and the richest results Google offers, so it was free real estate left unused.
 *
 * Everything here is pure and isomorphic — no DOM, no Next imports — so it is
 * testable without a browser or a database, matching the house pattern.
 *
 * `undefined` fields are dropped by JSON.stringify at render time, so optional
 * properties can be set unconditionally.
 */

export type JsonLd = Record<string, unknown>

/**
 * The slice of `config/site.ts` these builders need, passed in rather than
 * imported. Two reasons: it keeps this module free of the `@/` alias so it runs
 * under the bare node test runner like every other pure module here, and it
 * keeps the domain living in exactly one place (CLAUDE.md rule 9) instead of
 * being re-derived. `siteConfig` satisfies this structurally — just pass it.
 */
export interface SiteInfo {
  readonly url:         string
  readonly name:        string
  readonly description: string
  readonly tagline:     string
  readonly email:       string
  readonly twitter:     string
  readonly seo:         { readonly logo: string }
}

const abs = (site: SiteInfo, path: string) => `${site.url.replace(/\/$/, '')}${path}`

// ── Breadcrumbs ──────────────────────────────────────────────────────────────

export interface Crumb { name: string; path: string }

/**
 * A BreadcrumbList. Google displays these more reliably than almost any other
 * structured data, and they were previously only on the Explore pages.
 *
 * The final crumb (the current page) still carries an `item`; Google accepts
 * that and it keeps the trail self-consistent.
 */
export function buildBreadcrumbs(trail: Crumb[], site: SiteInfo): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(site, c.path),
    })),
  }
}

// ── FAQ extraction ───────────────────────────────────────────────────────────

export interface FaqEntry { question: string; answer: string }

// The editor emits <details class="faq"><summary>Q</summary><p>A</p></details>
// (see modules/admin/editor/editorBlocks.ts). Matched with a regex rather than a
// parser for the same reason toc.ts does: the block editor emits clean, known
// markup, and this has to run identically on the server and the client.
// Built fresh per call rather than shared: a /g regex carries lastIndex between
// uses, so a module-level constant would make results depend on call history.
const faqBlockRe = () => /<details\b[^>]*class=["'][^"']*\bfaq\b[^"']*["'][^>]*>([\s\S]*?)<\/details>/gi
const SUMMARY    = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i

/** Strips tags and decodes the handful of entities the editor can emit. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pulls question/answer pairs out of article HTML. Entries missing either half
 * are skipped — a half-written FAQ is worse than none, because Google penalises
 * structured data that does not match the visible page.
 */
export function extractFaqs(html: string): FaqEntry[] {
  if (!html) return []
  const out: FaqEntry[] = []

  // exec loop rather than matchAll: this tsconfig targets below ES2015, where
  // iterating a RegExp iterator needs downlevelIteration.
  const re = faqBlockRe()
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const inner   = match[1] ?? ''
    const summary = inner.match(SUMMARY)
    if (!summary) continue

    const question = stripHtml(summary[1] ?? '')
    const answer   = stripHtml(inner.replace(SUMMARY, ''))
    if (!question || !answer) continue

    out.push({ question, answer })
  }
  return out
}

/** FAQPage JSON-LD, or null when the article has no usable FAQ block. */
export function buildFaqJsonLd(html: string): JsonLd | null {
  const faqs = extractFaqs(html)
  if (faqs.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

// ── Missions ─────────────────────────────────────────────────────────────────

export interface MissionSeoInput {
  name:          string
  slug:          string
  description:   string
  featuredImage: string | null
  launchDate:    string | null
  destination:   string | null
  agencyName:    string | null
  summary?:      string
  website?:      string
  wikipedia?:    string
}

/**
 * Missions emitted no structured data at all. Modelled as a CreativeWork rather
 * than an Event: a mission is an ongoing subject the page documents, not a thing
 * that happens at one time, and Event requires a start date many missions lack.
 * `about` carries the destination so the page states what it is about.
 */
export function buildMissionJsonLd(m: MissionSeoInput, site: SiteInfo): JsonLd {
  const url = abs(site, `/missions/${m.slug}`)
  const sameAs = [m.website, m.wikipedia].filter((u): u is string => Boolean(u))

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: m.name,
    headline: m.name,
    description: m.summary || m.description || undefined,
    image: m.featuredImage ? [m.featuredImage] : undefined,
    url,
    about: m.destination ? { '@type': 'Place', name: m.destination } : undefined,
    // The operating agency is the subject's sponsor, not the page's publisher.
    sponsor: m.agencyName ? { '@type': 'Organization', name: m.agencyName } : undefined,
    temporalCoverage: m.launchDate || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    publisher: publisher(site),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

// ── Learn ────────────────────────────────────────────────────────────────────

export interface LearnSeoInput {
  title:           string
  slug:            string
  excerpt:         string
  thumbnail:       string | null
  difficultyLevel: string
  createdAt:       string
  updatedAt:       string
}

const EDUCATIONAL_LEVEL: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

/**
 * Learn pages are teaching material, so LearningResource is the accurate type —
 * it is also a subtype of CreativeWork, so consumers that do not understand it
 * still get something sensible. `educationalLevel` maps the difficulty the CMS
 * already records.
 */
export function buildLearnJsonLd(a: LearnSeoInput, site: SiteInfo): JsonLd {
  const url = abs(site, `/learn/${a.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: a.title,
    headline: a.title,
    description: a.excerpt || undefined,
    image: a.thumbnail ? [a.thumbnail] : undefined,
    url,
    learningResourceType: 'Explainer',
    educationalLevel: EDUCATIONAL_LEVEL[a.difficultyLevel] || undefined,
    datePublished: a.createdAt || undefined,
    dateModified: a.updatedAt || a.createdAt || undefined,
    isAccessibleForFree: true,
    publisher: publisher(site),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

// ── Site-level ───────────────────────────────────────────────────────────────

function publisher(site: SiteInfo): JsonLd {
  return {
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: { '@type': 'ImageObject', url: abs(site, site.seo.logo) },
  }
}

/**
 * WebSite + SearchAction on the homepage — the sitelinks searchbox. Worth much
 * more now that the search behind it actually looks inside article bodies.
 */
export function buildWebSiteJsonLd(site: SiteInfo): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    alternateName: site.tagline,
    url: site.url,
    description: site.description,
    publisher: publisher(site),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs(site, '/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Organization on its own, for the homepage alongside WebSite. */
export function buildOrganizationJsonLd(site: SiteInfo): JsonLd {
  return {
    '@context': 'https://schema.org',
    ...publisher(site),
    description: site.description,
    email: site.email,
    sameAs: [`https://x.com/${site.twitter.replace(/^@/, '')}`],
  }
}
