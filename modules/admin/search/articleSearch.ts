/**
 * Advanced Search & Content Discovery — pure core (Phase 2, Feature 8).
 * ─────────────────────────────────────────────────────────────────
 * DOM-free search / filter / sort over a list of article rows, plus facet
 * counts for the filter UI. Kept pure so the same logic can run client-side
 * today and be pushed to the database query later, and so it is trivially
 * unit-testable.
 */
import type { ArticleStatus, ArticleType } from '@/types/article'

export interface SearchableArticle {
  id:          string
  title:       string
  slug:        string
  status:      ArticleStatus
  articleType: ArticleType
  featured:    boolean
  views:       number
  readingTime: number
  publishedAt: string | null
  updatedAt:   string
  categories:  string[]
  tags:        string[]
  authorName:  string | null
}

export type SortKey = 'updated' | 'published' | 'title' | 'views' | 'reading'
export type SortDir = 'asc' | 'desc'

export interface SearchFilters {
  query:       string
  statuses:    ArticleStatus[]   // empty ⇒ any
  types:       ArticleType[]     // empty ⇒ any
  categories:  string[]          // OR; empty ⇒ any
  tags:        string[]          // OR; empty ⇒ any
  authors:     string[]          // OR; empty ⇒ any
  featuredOnly: boolean
  viewsMin:    number | null
  viewsMax:    number | null
  readingMin:  number | null
  readingMax:  number | null
  dateFrom:    string | null     // YYYY-MM-DD (inclusive), against published||updated
  dateTo:      string | null     // YYYY-MM-DD (inclusive)
  sort:        SortKey
  sortDir:     SortDir
}

export function emptyFilters(): SearchFilters {
  return {
    query: '', statuses: [], types: [], categories: [], tags: [], authors: [],
    featuredOnly: false, viewsMin: null, viewsMax: null, readingMin: null, readingMax: null,
    dateFrom: null, dateTo: null, sort: 'updated', sortDir: 'desc',
  }
}

/** True when any filter narrows the result set (drives the "clear" affordance). */
export function isFilterActive(f: SearchFilters): boolean {
  return !!(f.query.trim() || f.statuses.length || f.types.length || f.categories.length ||
    f.tags.length || f.authors.length || f.featuredOnly || f.viewsMin != null || f.viewsMax != null ||
    f.readingMin != null || f.readingMax != null || f.dateFrom || f.dateTo)
}

function refDate(a: SearchableArticle): string { return a.publishedAt || a.updatedAt || '' }

function haystack(a: SearchableArticle): string {
  return [a.title, a.slug, a.authorName || '', a.status, a.articleType,
    a.categories.join(' '), a.tags.join(' ')].join(' ').toLowerCase()
}

function overlaps(a: string[], b: string[]): boolean {
  if (b.length === 0) return true
  const set = new Set(a.map(x => x.toLowerCase()))
  return b.some(x => set.has(x.toLowerCase()))
}

/** Does a single row satisfy every active filter? */
export function matchesFilters(a: SearchableArticle, f: SearchFilters): boolean {
  // Full-text: every whitespace-separated token must appear somewhere (AND).
  const q = f.query.trim().toLowerCase()
  if (q) {
    const hay = haystack(a)
    if (!q.split(/\s+/).every(tok => hay.includes(tok))) return false
  }
  if (f.statuses.length && !f.statuses.includes(a.status)) return false
  if (f.types.length && !f.types.includes(a.articleType)) return false
  if (!overlaps(a.categories, f.categories)) return false
  if (!overlaps(a.tags, f.tags)) return false
  if (f.authors.length && !f.authors.map(x => x.toLowerCase()).includes((a.authorName || '').toLowerCase())) return false
  if (f.featuredOnly && !a.featured) return false
  if (f.viewsMin != null && a.views < f.viewsMin) return false
  if (f.viewsMax != null && a.views > f.viewsMax) return false
  if (f.readingMin != null && a.readingTime < f.readingMin) return false
  if (f.readingMax != null && a.readingTime > f.readingMax) return false
  if (f.dateFrom && refDate(a).slice(0, 10) < f.dateFrom) return false
  if (f.dateTo && refDate(a).slice(0, 10) > f.dateTo) return false
  return true
}

function compare(a: SearchableArticle, b: SearchableArticle, key: SortKey): number {
  switch (key) {
    case 'title':     return a.title.localeCompare(b.title)
    case 'views':     return a.views - b.views
    case 'reading':   return a.readingTime - b.readingTime
    case 'published': return refCompare(a.publishedAt, b.publishedAt)
    case 'updated':   return refCompare(a.updatedAt, b.updatedAt)
  }
}
function refCompare(a: string | null, b: string | null): number {
  return (a || '').localeCompare(b || '')
}

/** Filter + sort. Returns a new array; input is not mutated. */
export function searchArticles(rows: SearchableArticle[], f: SearchFilters): SearchableArticle[] {
  const out = rows.filter(r => matchesFilters(r, f))
  const dir = f.sortDir === 'asc' ? 1 : -1
  out.sort((a, b) => compare(a, b, f.sort) * dir)
  return out
}

// ── Facets (distinct values + counts, for the filter UI) ───────
export interface Facet { value: string; count: number }
export interface Facets {
  statuses:   Facet[]
  types:      Facet[]
  categories: Facet[]
  tags:       Facet[]
  authors:    Facet[]
}

function tally(values: string[], into: Map<string, number>) {
  values.forEach(v => { if (v) into.set(v, (into.get(v) ?? 0) + 1) })
}
function toFacets(m: Map<string, number>): Facet[] {
  return Array.from(m.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function computeFacets(rows: SearchableArticle[]): Facets {
  const s = new Map<string, number>(), t = new Map<string, number>(),
    c = new Map<string, number>(), g = new Map<string, number>(), au = new Map<string, number>()
  rows.forEach(r => {
    tally([r.status], s); tally([r.articleType], t)
    tally(r.categories, c); tally(r.tags, g)
    tally([r.authorName || ''], au)
  })
  return { statuses: toFacets(s), types: toFacets(t), categories: toFacets(c), tags: toFacets(g), authors: toFacets(au) }
}

// ── CSV export ─────────────────────────────────────────────────
function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** Build a CSV string for the given rows (used by the bulk "Export" action). */
export function toCsv(rows: SearchableArticle[]): string {
  const head = ['title', 'slug', 'status', 'type', 'author', 'categories', 'tags', 'views', 'readingTime', 'published', 'updated']
  const lines = rows.map(r => [
    r.title, r.slug, r.status, r.articleType, r.authorName || '',
    r.categories.join('; '), r.tags.join('; '), String(r.views), String(r.readingTime),
    (r.publishedAt || '').slice(0, 10), (r.updatedAt || '').slice(0, 10),
  ].map(csvCell).join(','))
  return [head.join(','), ...lines].join('\n')
}
