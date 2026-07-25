/**
 * Citation formatters + validation (Phase 2, Feature 7) — pure & testable.
 * ─────────────────────────────────────────────────────────────────
 * Turns a structured `Citation` into a formatted reference string (HTML with
 * <em> for titles/containers and a trailing link) in APA / MLA / Chicago / IEEE
 * (or verbatim custom text), and reports validation issues. All user text is
 * escaped, so the output is safe to inject and survives the editor sanitizer.
 */
import type { Citation, CitationStyle } from './citationTypes'

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Join non-empty parts with a separator. */
function j(parts: (string | undefined | null | false)[], sep = ' '): string {
  return parts.filter(p => p && String(p).trim()).join(sep)
}

// ── Author name handling ───────────────────────────────────────
interface Name { last: string; firsts: string[]; org: boolean }

function parseName(a: string): Name {
  const s = (a || '').trim()
  if (!s) return { last: '', firsts: [], org: true }
  if (s.includes(',')) {
    const [last, rest] = s.split(',')
    return { last: last.trim(), firsts: (rest || '').trim().split(/\s+/).filter(Boolean), org: false }
  }
  const parts = s.split(/\s+/)
  if (parts.length === 1) return { last: s, firsts: [], org: true } // single token → organisation
  const last = parts.pop() as string
  return { last, firsts: parts, org: false }
}

function initials(firsts: string[]): string {
  return firsts.map(f => `${f[0].toUpperCase()}.`).join(' ')
}

/** "Last, F. M." (APA) / "F. M. Last" (IEEE) / "Last, First" / "First Last". */
function oneAuthor(a: string, form: 'last-init' | 'init-last' | 'last-first' | 'first-last'): string {
  const n = parseName(a)
  if (n.org || n.firsts.length === 0) return n.last
  switch (form) {
    case 'last-init':  return j([`${n.last},`, initials(n.firsts)])
    case 'init-last':  return j([initials(n.firsts), n.last])
    case 'last-first': return `${n.last}, ${n.firsts.join(' ')}`
    case 'first-last': return `${n.firsts.join(' ')} ${n.last}`
  }
}

/** Format an author list for a given style. */
export function formatAuthors(authors: string[], style: CitationStyle): string {
  const list = authors.map(a => a.trim()).filter(Boolean)
  if (list.length === 0) return ''

  if (style === 'apa' || style === 'ieee') {
    const form = style === 'apa' ? 'last-init' : 'init-last'
    if (style === 'ieee' && list.length > 6) return `${oneAuthor(list[0], 'init-last')} et al.`
    const names = list.map(a => oneAuthor(a, form))
    const conj = style === 'apa' ? '&' : 'and'
    if (names.length === 1) return names[0]
    if (names.length === 2) return style === 'apa' ? `${names[0]}, ${conj} ${names[1]}` : `${names[0]} ${conj} ${names[1]}`
    return `${names.slice(0, -1).join(', ')}, ${conj} ${names[names.length - 1]}`
  }

  // MLA / Chicago: first author inverted, the rest natural order.
  if (style === 'mla' && list.length > 2) return `${oneAuthor(list[0], 'last-first')}, et al.`
  const names = list.map((a, i) => oneAuthor(a, i === 0 ? 'last-first' : 'first-last'))
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]}, and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

// ── Link + DOI ─────────────────────────────────────────────────
function linkFor(c: Citation): { href: string; text: string } | null {
  if (c.doi && c.doi.trim()) {
    const doi = c.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    return { href: `https://doi.org/${doi}`, text: `https://doi.org/${doi}` }
  }
  if (c.url && /^https?:\/\//i.test(c.url.trim())) return { href: c.url.trim(), text: c.url.trim() }
  return null
}

function linkHtml(c: Citation): string {
  const l = linkFor(c)
  if (!l) return ''
  return `<a href="${esc(l.href)}">${esc(l.text)}</a>`
}

// ── Per-style formatting ───────────────────────────────────────
/** Format one citation as a reference entry (HTML). No leading number — the
 *  surrounding <ol> supplies it (so inline [n] markers stay in sync). */
export function formatCitation(c: Citation, style: CitationStyle): string {
  if (style === 'custom') return esc(c.custom || c.title || '')

  const authors = formatAuthors(c.authors, style)
  const title = esc(c.title)
  const container = esc(c.container)
  const year = esc(c.year)
  const link = linkHtml(c)
  const emContainer = container ? `<em>${container}</em>` : ''
  const emTitle = title ? `<em>${title}</em>` : ''
  const quotedTitle = title ? `&ldquo;${title}&rdquo;` : ''
  // A "container" (journal / proceedings / site) ⇒ the title is a contained
  // work (article); no container ⇒ the title is a standalone work (book/report).
  const isArticle = !!container
  const ed = c.edition ? `(${esc(c.edition)} ed.)` : ''

  if (style === 'apa') {
    // APA does NOT quote article titles; italicises books/reports & the journal.
    if (isArticle) {
      const volIss = j([c.volume && `<em>${esc(c.volume)}</em>`, c.issue && `(${esc(c.issue)})`], '')
      const tail = j([emContainer, volIss, esc(c.pages)], ', ')
      return j([authors, year && `(${year}).`, title && `${title}.`, tail && `${tail}.`, link])
    }
    return j([authors, year && `(${year}).`, j([emTitle, ed]) && `${j([emTitle, ed])}.`, esc(c.publisher) && `${esc(c.publisher)}.`, link])
  }

  if (style === 'ieee') {
    const tail = j([emContainer, c.volume && `vol. ${esc(c.volume)}`, c.issue && `no. ${esc(c.issue)}`, c.pages && `pp. ${esc(c.pages)}`, year], ', ')
    const titlePart = isArticle ? quotedTitle : emTitle
    return j([authors && `${authors},`, titlePart && `${titlePart},`, tail && `${tail}.`, link])
  }

  if (style === 'mla') {
    if (isArticle) {
      const tail = j([emContainer, c.volume && `vol. ${esc(c.volume)}`, c.issue && `no. ${esc(c.issue)}`, year, c.pages && `pp. ${esc(c.pages)}`], ', ')
      return j([authors && `${authors}.`, quotedTitle && `${quotedTitle}.`, tail && `${tail}.`, link])
    }
    return j([authors && `${authors}.`, j([emTitle, ed]) && `${j([emTitle, ed])}.`, j([esc(c.publisher), year], ', ') && `${j([esc(c.publisher), year], ', ')}.`, link])
  }

  // chicago
  if (isArticle) {
    const head = j([emContainer, c.volume && esc(c.volume)])
    const noYr = j([c.issue && `no. ${esc(c.issue)}`, year && `(${year})`])
    const body = j([head, noYr], ', ')
    return j([authors && `${authors}.`, quotedTitle && `${quotedTitle}.`, body && (c.pages ? `${body}: ${esc(c.pages)}.` : `${body}.`), link])
  }
  return j([authors && `${authors}.`, j([emTitle, ed]) && `${j([emTitle, ed])}.`, j([esc(c.publisher), year], ', ') && `${j([esc(c.publisher), year], ', ')}.`, link])
}

// ── Validation ─────────────────────────────────────────────────
export type IssueLevel = 'error' | 'warning'
export interface CitationIssue { level: IssueLevel; field?: string; message: string }

/** Structural checks: missing title/source/year, broken URL, malformed DOI. */
export function validateCitation(c: Citation): CitationIssue[] {
  const issues: CitationIssue[] = []
  // A citation is "custom" when the author supplied verbatim text; skip the
  // structured-field checks in that case.
  if (!c.custom.trim()) {
    if (!c.title.trim()) issues.push({ level: 'error', field: 'title', message: 'Missing title' })
    if (c.authors.filter(a => a.trim()).length === 0 && !c.container.trim() && !c.publisher.trim())
      issues.push({ level: 'error', field: 'authors', message: 'Missing source (author, publication or publisher)' })
    if (!c.year.trim()) issues.push({ level: 'warning', field: 'year', message: 'Missing year' })
  }
  if (c.url.trim() && !/^https?:\/\/[^\s.]+\.[^\s]+/i.test(c.url.trim()))
    issues.push({ level: 'error', field: 'url', message: 'URL looks broken (must be a full http(s) address)' })
  if (c.doi.trim() && !/^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,}\/\S+$/i.test(c.doi.trim()))
    issues.push({ level: 'warning', field: 'doi', message: 'DOI does not match the 10.xxxx/… pattern' })
  return issues
}

// ── Stable reuse key (for de-duplicating library entries) ──────
export function citationKey(c: Citation): string {
  const a = (c.authors[0] || c.container || c.publisher || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  const t = (c.title || c.custom || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24)
  return j([a, c.year, t], '-') || c.id
}

// ── Reference-section + inline-marker builders ─────────────────
// (Kept in this module so the pure logic has no cross-module value imports —
// only the type-only import of citationTypes, which is erased at runtime.)

/** Inline citation marker linking to reference N (and back-linkable). */
export function inlineMarker(n: number): string {
  return `<sup class="cite-ref" id="cite-${n}"><a href="#ref-${n}">[${n}]</a></sup>`
}

/** URL-encoded JSON (safe as an attribute value; handles any unicode). */
export function encodeCitation(c: Citation): string {
  try { return encodeURIComponent(JSON.stringify(c)) } catch { return '' }
}

export function decodeCitation(data: string): Citation | null {
  try {
    const obj = JSON.parse(decodeURIComponent(data))
    return obj && typeof obj === 'object' && typeof obj.type === 'string' ? (obj as Citation) : null
  } catch {
    return null
  }
}

/** Build the whole references block (empty string when there are no citations).
 *  Each <li> embeds its structured citation so the Citation Manager can
 *  re-hydrate, renumber and re-format on demand. */
export function buildReferenceList(cits: Citation[], style: CitationStyle): string {
  if (cits.length === 0) return ''
  const items = cits.map((c, i) => {
    const n = i + 1
    const body = formatCitation(c, style) || '&mdash;'
    const back = `<a href="#cite-${n}" class="cite-back" aria-label="Back to citation ${n}">&#8617;</a>`
    return `<li id="ref-${n}" data-cite="${encodeCitation(c)}">${body} ${back}</li>`
  }).join('')
  return `<div class="references citations" data-style="${style}"><p class="references-title">References</p><ol>${items}</ol></div>`
}

/** Keys that appear more than once (drives the "duplicate reference" warning). */
export function duplicateKeys(cits: Citation[]): string[] {
  const seen = new Map<string, number>()
  cits.forEach(c => { const k = citationKey(c); seen.set(k, (seen.get(k) ?? 0) + 1) })
  return Array.from(seen.entries()).filter(([, n]) => n > 1).map(([k]) => k)
}
