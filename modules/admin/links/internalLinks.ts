/**
 * Internal Linking Assistant — pure core (Phase 2, Feature 6).
 * ─────────────────────────────────────────────────────────────────
 * DOM-free logic behind the editor's linking helper: rank related internal
 * pages to link to, find the internal links already in a draft (to avoid
 * duplicates and detect broken ones), and compute orphan pages from a link
 * graph. Kept pure so it is reusable and unit-testable.
 *
 * SEO intent: more internal links → stronger topical authority + crawlability,
 * and fewer orphan pages.
 */

export type LinkKind = 'article' | 'mission' | 'learn' | 'author'

export interface LinkTarget {
  kind:        LinkKind
  title:       string
  href:        string        // root-relative, e.g. /article/water-on-the-moon
  slug:        string
  categories?: string[]
  tags?:       string[]
}

export interface Suggestion { target: LinkTarget; score: number }

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'over', 'your',
  'about', 'what', 'when', 'will', 'have', 'has', 'are', 'was', 'were', 'their',
  'its', 'a', 'an', 'of', 'to', 'in', 'on', 'as', 'is', 'at', 'by', 'or', 'be',
  'new', 'how', 'why', 'you', 'our', 'all', 'can', 'not',
])

/** Significant lower-cased tokens of a title (drops short words + stopwords). */
export function significantTokens(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

const KIND_RANK: Record<LinkKind, number> = { article: 0, mission: 1, learn: 2, author: 3 }

/**
 * Relevance of a target to the article text. Rewards each distinct title token
 * that appears in the text, with a bonus for the full title and for a shared
 * category/tag (when the caller knows the current article's facets).
 */
export function relevance(
  textLower: string,
  target: LinkTarget,
  ctx?: { categories?: string[]; tags?: string[] },
): number {
  let score = 0
  const tokens = significantTokens(target.title)
  for (const tok of tokens) if (textLower.includes(tok)) score += 1
  if (target.title && textLower.includes(target.title.toLowerCase())) score += 3
  if (ctx) {
    const cats = new Set((ctx.categories || []).map(c => c.toLowerCase()))
    const tags = new Set((ctx.tags || []).map(t => t.toLowerCase()))
    if ((target.categories || []).some(c => cats.has(c.toLowerCase()))) score += 2
    if ((target.tags || []).some(t => tags.has(t.toLowerCase()))) score += 1
  }
  return score
}

export interface SuggestOptions {
  selfHref?:    string
  linkedHrefs?: string[]
  categories?:  string[]
  tags?:        string[]
  limit?:       number
}

/** Rank the internal pages most worth linking to from the given article text. */
export function suggestLinks(text: string, targets: LinkTarget[], opts: SuggestOptions = {}): Suggestion[] {
  const t = (text || '').toLowerCase()
  const linked = new Set(opts.linkedHrefs || [])
  const out: Suggestion[] = []
  for (const target of targets) {
    if (target.href === opts.selfHref) continue
    if (linked.has(target.href)) continue
    const score = relevance(t, target, { categories: opts.categories, tags: opts.tags })
    if (score > 0) out.push({ target, score })
  }
  out.sort((a, b) =>
    b.score - a.score ||
    KIND_RANK[a.target.kind] - KIND_RANK[b.target.kind] ||
    a.target.title.localeCompare(b.target.title))
  return out.slice(0, opts.limit ?? 12)
}

/** Substring search across targets (for the assistant's manual search box). */
export function searchTargets(query: string, targets: LinkTarget[], linkedHrefs: string[] = []): Array<LinkTarget & { linked: boolean }> {
  const q = query.trim().toLowerCase()
  const linked = new Set(linkedHrefs)
  return targets
    .filter(t => !q || t.title.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
    .slice(0, 40)
    .map(t => ({ ...t, linked: linked.has(t.href) }))
}

// ── Links already in a draft ───────────────────────────────────

/** Internal (root-relative) hrefs present in the HTML, de-duplicated. */
export function extractInternalHrefs(html: string): string[] {
  const out = new Set<string>()
  const re = /href\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim()
    if (href.startsWith('/') && !href.startsWith('//')) out.add(href)
  }
  return Array.from(out)
}

/** Path part of an href (drops query + hash) for comparison against targets. */
function pathOf(href: string): string {
  return href.split('#')[0].split('?')[0]
}

/** Internal links in the HTML that don't resolve to a known target path. */
export function findBrokenLinks(html: string, validHrefs: Iterable<string>): string[] {
  const valid = new Set(Array.from(validHrefs, pathOf))
  const broken = new Set<string>()
  for (const href of extractInternalHrefs(html)) {
    const p = pathOf(href)
    if (p === '/' || p === '') continue
    if (!valid.has(p)) broken.add(href)
  }
  return Array.from(broken)
}

// ── Orphan detection ───────────────────────────────────────────
export interface LinkNode { href: string; outbound: string[] }

/** Hrefs that no other node links to (orphans — bad for SEO/crawlability). */
export function computeOrphans(nodes: LinkNode[]): string[] {
  const inbound = new Set<string>()
  for (const n of nodes) for (const o of n.outbound) inbound.add(pathOf(o))
  return nodes.filter(n => !inbound.has(pathOf(n.href))).map(n => n.href)
}

// ── Anchor building ────────────────────────────────────────────
function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Build a safe internal anchor for insertion at the caret. */
export function buildLinkHtml(href: string, text: string): string {
  return `<a href="${esc(href)}">${esc(text)}</a>`
}
