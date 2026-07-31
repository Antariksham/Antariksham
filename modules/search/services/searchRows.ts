/**
 * Pure mapping from the flat rows `search_content()` returns into the grouped
 * shape the search UI already consumes.
 *
 * Kept separate from search.ts so it can be tested without a database — the
 * house pattern for anything with branching in it.
 */

import type {
  SearchArticleResult,
  SearchMissionResult,
  SearchLearnResult,
  SearchResults,
} from './search'

/** One row as returned by the `search_content` RPC. */
export interface SearchRow {
  kind:    string
  id:      string
  slug:    string
  title:   string | null
  excerpt: string | null
  rank:    number
  extra:   Record<string, unknown> | null
}

/** One row as returned by the `search_content_fuzzy` RPC. */
export interface FuzzyRow {
  kind:  string
  id:    string
  slug:  string
  title: string | null
  sim:   number
}

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.length > 0 ? v : fallback

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

/**
 * Groups ranked rows by kind, preserving the global rank order within each
 * group. Rows the caller does not recognise are dropped rather than thrown on,
 * so adding a fourth content type to the SQL side cannot break a deployed client.
 */
export function groupSearchRows(rows: SearchRow[], query: string): SearchResults {
  const articles: SearchArticleResult[] = []
  const missions: SearchMissionResult[] = []
  const learn:    SearchLearnResult[]   = []

  for (const row of rows) {
    const extra = row.extra ?? {}

    if (row.kind === 'article') {
      articles.push({
        type:        'article',
        id:          row.id,
        title:       str(row.title),
        slug:        row.slug,
        excerpt:     str(row.excerpt),
        category:    typeof extra.category === 'string' ? extra.category : null,
        articleType: str(extra.articleType, 'news'),
        publishedAt: typeof extra.publishedAt === 'string' ? extra.publishedAt : null,
        readingTime: num(extra.readingTime, 5),
      })
    } else if (row.kind === 'mission') {
      missions.push({
        type:        'mission',
        id:          row.id,
        name:        str(row.title),
        slug:        row.slug,
        description: str(row.excerpt),
        status:      str(extra.status),
        missionType: str(extra.missionType),
        destination: typeof extra.destination === 'string' ? extra.destination : null,
        agency:      typeof extra.agency === 'string' ? extra.agency : null,
      })
    } else if (row.kind === 'learn') {
      learn.push({
        type:            'learn',
        id:              row.id,
        title:           str(row.title),
        slug:            row.slug,
        excerpt:         str(row.excerpt),
        difficultyLevel: str(extra.difficultyLevel, 'beginner'),
        icon:            str(extra.icon, '🔭'),
      })
    }
  }

  return {
    articles,
    missions,
    learn,
    total: articles.length + missions.length + learn.length,
    query,
  }
}

/**
 * Turns fuzzy rows into de-duplicated "did you mean" terms, best match first.
 * Titles are compared case-insensitively so the same word suggested from two
 * content types only appears once.
 */
export function suggestionsFromFuzzy(rows: FuzzyRow[], limit = 3): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const row of [...rows].sort((a, b) => b.sim - a.sim)) {
    const title = str(row.title).trim()
    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
    if (out.length >= limit) break
  }
  return out
}

/**
 * True when the failure is "the migration has not been run here yet", which is
 * a normal state during a deploy rather than an error worth surfacing.
 * PostgREST reports an unknown function as PGRST202; Postgres itself as 42883.
 */
export function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST202' || error.code === '42883') return true
  return /(could not find the function|does not exist)/i.test(error.message ?? '')
}
