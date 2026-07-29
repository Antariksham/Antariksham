/**
 * Topic hub content aggregation — pulls the articles, learn pages and
 * missions that belong to a topic out of the existing tables.
 *
 * The ranking/de-duping logic is pure and DOM-free (unit-tested); the fetch
 * imports Supabase lazily inside its try/catch so a hub page still renders
 * (empty) when the database env is absent, exactly like `getExploreMissions`.
 */

import type { Topic } from './topics'

export interface TopicArticle {
  id: string; title: string; slug: string; excerpt: string
  featuredImage: string | null; publishedAt: string | null
  readingTime: number; category: string | null
}

export interface TopicLearn {
  id: string; title: string; slug: string; excerpt: string
  icon: string; difficultyLevel: string
}

export interface TopicMission {
  id: string; name: string; slug: string; description: string
  status: string; destination: string | null; launchDate: string | null
  featuredImage: string | null; agency: string | null
}

export interface TopicContent {
  articles: TopicArticle[]
  learn:    TopicLearn[]
  missions: TopicMission[]
  /** True when every source returned nothing (drives the empty state). */
  isEmpty:  boolean
}

/** Fields a rankable record exposes; extra keys are ignored. */
export interface Rankable {
  title?: string | null
  name?: string | null
  excerpt?: string | null
  description?: string | null
  destination?: string | null
  /** ISO date used only to break ties (newest first). */
  date?: string | null
}

/**
 * Relevance score for a record against a topic's terms.
 *
 * A term hit in the title/name is worth 3, in the body text 1, and in a
 * mission destination 2 — so "Mars Sample Return" outranks an article that
 * merely mentions Mars in passing. Matching is case-insensitive substring
 * (mirrors the `ilike` filter that selected the rows).
 */
export function scoreByTerms(item: Rankable, terms: string[]): number {
  const heading = `${item.title ?? ''} ${item.name ?? ''}`.toLowerCase()
  const body    = `${item.excerpt ?? ''} ${item.description ?? ''}`.toLowerCase()
  const dest    = (item.destination ?? '').toLowerCase()

  let score = 0
  for (const raw of terms) {
    const term = raw.toLowerCase()
    if (!term) continue
    if (heading.includes(term)) score += 3
    if (body.includes(term))    score += 1
    if (dest.includes(term))    score += 2
  }
  return score
}

/**
 * Sort by relevance, then newest first; drop anything that matched nothing.
 * Stable for equal keys, so the caller's incoming order is preserved.
 */
export function rankByTerms<T extends Rankable>(items: T[], terms: string[], limit: number): T[] {
  return items
    .map((item, i) => ({ item, i, score: scoreByTerms(item, terms) }))
    .filter(x => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ad = a.item.date ?? '', bd = b.item.date ?? ''
      if (ad !== bd) return bd.localeCompare(ad)
      return a.i - b.i
    })
    .slice(0, limit)
    .map(x => x.item)
}

/** De-duplicate by `id`, keeping first occurrence. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(i => (seen.has(i.id) ? false : (seen.add(i.id), true)))
}

/**
 * Build a Supabase `.or()` filter matching any term against any column.
 * Terms come from our own registry, but PostgREST treats `,` `(` `)` as
 * syntax, so they are stripped defensively.
 */
export function buildOrFilter(terms: string[], columns: string[]): string {
  const clauses: string[] = []
  for (const raw of terms) {
    const term = raw.replace(/[,()*]/g, '').trim()
    if (!term) continue
    for (const col of columns) clauses.push(`${col}.ilike.%${term}%`)
  }
  return clauses.join(',')
}

// How many of each kind a hub shows.
const ARTICLE_LIMIT = 9
const LEARN_LIMIT   = 6
const MISSION_LIMIT = 6
/** Fetch wider than we display so ranking has something to choose from. */
const FETCH_MULTIPLIER = 4

/**
 * Everything on the site that belongs to `topic`. Never throws: any failure
 * (missing env, absent table, network) degrades that source to an empty list.
 */
export async function getTopicContent(topic: Topic): Promise<TopicContent> {
  let articles: TopicArticle[] = []
  let learn:    TopicLearn[]   = []
  let missions: TopicMission[] = []

  try {
    const { supabase } = await import('@/lib/supabase')

    const [articlesRes, learnRes, missionsRes] = await Promise.all([
      supabase
        .from('articles')
        .select('id, title, slug, excerpt, featured_image, published_at, reading_time, article_categories ( categories ( name ) )')
        .eq('status', 'published')
        .or(buildOrFilter(topic.terms, ['title', 'excerpt']))
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(ARTICLE_LIMIT * FETCH_MULTIPLIER)
        .then(r => r, () => ({ data: null, error: true })),

      supabase
        .from('knowledge_articles')
        .select('id, title, slug, excerpt, icon, difficulty_level')
        .or(buildOrFilter(topic.terms, ['title', 'excerpt']))
        .order('created_at', { ascending: false })
        .limit(LEARN_LIMIT * FETCH_MULTIPLIER)
        .then(r => r, () => ({ data: null, error: true })),

      supabase
        .from('missions')
        .select('id, name, slug, description, status, destination, launch_date, featured_image, space_agencies ( short_name )')
        .or(buildOrFilter(topic.terms, ['name', 'description', 'destination']))
        .order('launch_date', { ascending: false, nullsFirst: false })
        .limit(MISSION_LIMIT * FETCH_MULTIPLIER)
        .then(r => r, () => ({ data: null, error: true })),
    ])

    articles = rankByTerms(
      dedupeById((articlesRes.data || []).map((r: any): TopicArticle & { date: string | null } => ({
        id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt || '',
        featuredImage: r.featured_image || null, publishedAt: r.published_at || null,
        readingTime: r.reading_time || 5,
        category: r.article_categories?.[0]?.categories?.name || null,
        date: r.published_at || null,
      }))),
      topic.terms, ARTICLE_LIMIT,
    )

    learn = rankByTerms(
      dedupeById((learnRes.data || []).map((r: any): TopicLearn => ({
        id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt || '',
        icon: r.icon || '🔭', difficultyLevel: r.difficulty_level || 'beginner',
      }))),
      topic.terms, LEARN_LIMIT,
    )

    missions = rankByTerms(
      dedupeById((missionsRes.data || []).map((r: any): TopicMission & { date: string | null } => ({
        id: r.id, name: r.name, slug: r.slug, description: r.description || '',
        status: r.status, destination: r.destination || null,
        launchDate: r.launch_date || null, featuredImage: r.featured_image || null,
        agency: r.space_agencies?.short_name || null,
        date: r.launch_date || null,
      }))),
      topic.terms, MISSION_LIMIT,
    )
  } catch {
    // No database configured (or it is unreachable) — the hub still renders
    // its introduction and tool cross-links.
  }

  return {
    articles, learn, missions,
    isEmpty: articles.length === 0 && learn.length === 0 && missions.length === 0,
  }
}
