import { analyzeContent, type ContentStats } from './analyzeContent'

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface Check {
  id:      string
  label:   string
  status:  CheckStatus
  detail?: string
}

export interface ValidationInput {
  title:            string
  slug:             string
  excerpt:          string
  content:          string
  featuredImage:    string | null
  featuredImageAlt?: string
  categoryIds:      string[]
  authorId:         string | null
  focusKeyword?:    string
  seoTitle?:        string    // falls back to title
  metaDescription?: string    // falls back to excerpt
  canonicalUrl?:    string
  requireAuthor?:   boolean
}

export interface ValidationReport {
  required:   Check[]
  warnings:   Check[]
  seo:        Check[]
  canPublish: boolean
  failCount:  number
  warnCount:  number
  scores:     { seo: number; readability: number; content: number }
  stats:      ContentStats
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function keywordIn(text: string, kw: string) {
  return kw ? text.toLowerCase().includes(kw.toLowerCase()) : false
}

/** Run every publish check + derive the three live scores. */
export function validateArticle(input: ValidationInput): ValidationReport {
  const stats = analyzeContent(input.content)
  const seoTitle = (input.seoTitle || input.title || '').trim()
  const metaDesc = (input.metaDescription || input.excerpt || '').trim()
  const kw = (input.focusKeyword || '').trim()

  // ── Required (a 'fail' blocks Publish) ──────────────────────
  const required: Check[] = [
    chk('title',    'Title',          input.title.trim() ? 'pass' : 'fail'),
    chk('slug',     'Slug',           input.slug.trim() ? (SLUG_RE.test(input.slug.trim()) ? 'pass' : 'warn') : 'fail',
        input.slug.trim() && !SLUG_RE.test(input.slug.trim()) ? 'Should be lowercase words separated by hyphens' : undefined),
    chk('excerpt',  'Excerpt',        input.excerpt.trim() ? 'pass' : 'fail'),
    chk('content',  'Content',        stats.words > 0 ? 'pass' : 'fail'),
    chk('image',    'Featured image', input.featuredImage ? 'pass' : 'fail'),
    chk('category', 'Category',       input.categoryIds.length > 0 ? 'pass' : 'fail'),
  ]
  if (input.requireAuthor) {
    required.push(chk('author', 'Author', input.authorId ? 'pass' : 'fail'))
  }

  // ── Warnings (never block) ──────────────────────────────────
  const warnings: Check[] = [
    chk('h2',        'Has section headings (H2)', stats.h2Count > 0 ? 'pass' : 'warn',
        stats.h2Count === 0 ? 'Break the article up with H2 headings' : undefined),
    chk('length',    'Enough depth',              stats.words >= 300 ? 'pass' : 'warn',
        stats.words < 300 ? `Only ${stats.words} words — aim for 300+` : undefined),
    chk('titleLen',  'Title length',              input.title.length <= 70 ? 'pass' : 'warn',
        input.title.length > 70 ? `${input.title.length} chars — a bit long` : undefined),
    chk('excerptLen','Excerpt length',            input.excerpt.length <= 200 ? 'pass' : 'warn',
        input.excerpt.length > 200 ? `${input.excerpt.length} chars — consider trimming` : undefined),
    chk('images',    'Has imagery',               stats.images.length > 0 ? 'pass' : 'warn',
        stats.images.length === 0 ? 'No in-body images' : undefined),
    chk('paragraphs','More than one paragraph',   stats.paragraphs > 1 ? 'pass' : 'warn'),
    chk('extLinks',  'External links in check',   stats.externalLinks <= 15 ? 'pass' : 'warn',
        stats.externalLinks > 15 ? `${stats.externalLinks} external links` : undefined),
    chk('altText',   'All images have alt text',  stats.missingAlt === 0 ? 'pass' : 'warn',
        stats.missingAlt > 0 ? `${stats.missingAlt} image(s) missing alt text` : undefined),
    chk('references','Cites references',          stats.hasReferences ? 'pass' : 'warn',
        stats.hasReferences ? undefined : 'No references block'),
  ]

  // ── SEO ─────────────────────────────────────────────────────
  const descOk = metaDesc.length >= 120 && metaDesc.length <= 160
  const titleOk = seoTitle.length >= 30 && seoTitle.length <= 60
  const featAltOk = !input.featuredImage || (input.featuredImageAlt || '').trim().length > 0
  const seo: Check[] = [
    chk('seoTitle',  'SEO title length',   titleOk ? 'pass' : 'warn',
        `${seoTitle.length} chars${titleOk ? '' : ' — aim for 30–60'}`),
    chk('seoDesc',   'Meta description length', descOk ? 'pass' : 'warn',
        `${metaDesc.length} chars${descOk ? '' : ' — aim for 120–160'}`),
    chk('hierarchy', 'Heading hierarchy',  stats.hasHeadingHierarchyIssue ? 'warn' : 'pass',
        stats.hasHeadingHierarchyIssue ? 'A heading level is skipped' : undefined),
    chk('seoAlt',    'Image alt text',     stats.missingAlt === 0 && featAltOk ? 'pass' : 'warn'),
    chk('internal',  'Internal links',     stats.internalLinks > 0 ? 'pass' : 'warn',
        stats.internalLinks === 0 ? 'Link to related articles' : undefined),
    chk('ogImage',   'Open Graph image',   input.featuredImage ? 'pass' : 'warn'),
    chk('canonical', 'Canonical URL',      !input.canonicalUrl || /^https?:\/\//i.test(input.canonicalUrl) ? 'pass' : 'warn',
        input.canonicalUrl && !/^https?:\/\//i.test(input.canonicalUrl) ? 'Not a valid absolute URL' : undefined),
  ]
  if (kw) {
    seo.push(chk('kwTitle', 'Focus keyword in title',       keywordIn(seoTitle, kw) ? 'pass' : 'warn'))
    seo.push(chk('kwDesc',  'Focus keyword in description',  keywordIn(metaDesc, kw) ? 'pass' : 'warn'))
    seo.push(chk('kwBody',  'Focus keyword in body',         keywordIn(input.content, kw) ? 'pass' : 'warn'))
  }

  const failCount = required.filter(c => c.status === 'fail').length
  const warnCount = [...required, ...warnings, ...seo].filter(c => c.status === 'warn').length

  return {
    required, warnings, seo,
    canPublish: failCount === 0,
    failCount, warnCount,
    scores: {
      seo:         seoScore(seo),
      readability: readabilityScore(stats),
      content:     contentScore(stats),
    },
    stats,
  }
}

function chk(id: string, label: string, status: CheckStatus, detail?: string): Check {
  return { id, label, status, detail }
}

// ── Scores (0–100) ────────────────────────────────────────────

function seoScore(seo: Check[]): number {
  if (!seo.length) return 0
  const val = seo.reduce((s, c) => s + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.4 : 0), 0)
  return Math.round((val / seo.length) * 100)
}

/** Simplified readability (higher = easier). Penalises long sentences + words. */
function readabilityScore(stats: ContentStats): number {
  if (stats.words === 0) return 0
  const wordsPerSentence = stats.words / Math.max(1, stats.sentences)
  const charsPerWord = stats.characters / Math.max(1, stats.words)
  // Flesch-ish: ideal ~14 words/sentence, ~4.7 chars/word.
  let score = 100 - Math.max(0, wordsPerSentence - 14) * 2.2 - Math.max(0, charsPerWord - 4.7) * 8
  return Math.max(0, Math.min(100, Math.round(score)))
}

function contentScore(stats: ContentStats): number {
  let score = 0
  score += Math.min(40, (stats.words / 800) * 40)                 // depth (max at ~800 words)
  score += Math.min(20, stats.h2Count * 7)                        // structure
  score += Math.min(15, stats.images.length * 7)                  // imagery
  score += Math.min(10, stats.internalLinks * 5)                  // internal linking
  score += Math.min(10, stats.externalLinks * 3)                  // sourcing
  score += stats.hasReferences ? 5 : 0                            // references
  return Math.max(0, Math.min(100, Math.round(score)))
}
