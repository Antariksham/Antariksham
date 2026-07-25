import { supabaseAdmin } from '@/lib/supabase'
import {
  aggregateMetrics, timeSeries, breakdown, buildInsights,
  type AnalyticsEvent, type Bucket, type Metrics, type Point, type Slice,
  type Insights, type ArticleStat,
} from './analytics'

/**
 * Analytics Dashboard data service (Phase 2, Feature 5).
 * ─────────────────────────────────────────────────────────────────
 * Reads the privacy-friendly `article_events` table (service role), maps rows
 * onto the DOM-free core's `AnalyticsEvent`, and returns everything the
 * dashboard renders. All the maths lives in `analytics.ts` (unit-tested) — this
 * layer is just query + shape + graceful degradation:
 *   • If the events migration hasn't run yet, `available:false` is returned with
 *     empty-but-valid data, so the page renders a friendly "no data" state
 *     instead of crashing.
 *   • Events are capped (most-recent-first within the range) to bound memory.
 */

export type RangeKey = 'day' | 'week' | 'month' | 'year' | 'custom'

const DAY = 86_400_000
const EVENT_CAP = 20_000

export interface AnalyticsData {
  available:    boolean
  range:        { from: string; to: string; bucket: Bucket; key: RangeKey }
  totalEvents:  number
  metrics:      Metrics
  series:       Point[]      // views over time
  byDevice:     Slice[]
  bySource:     Slice[]      // referrer type (organic/social/direct/referral)
  byReferrer:   Slice[]      // top referring hosts
  byCountry:    Slice[]
  topArticles:  { id: string; title: string; slug: string; views: number }[]
  insights:     Insights
}

/** Resolve a range key (or explicit custom dates) to a from/to + a sensible bucket. */
export function resolveRange(key: RangeKey, from?: string, to?: string, now: number = Date.now()): AnalyticsData['range'] {
  if (key === 'custom' && from && to) {
    const span = Math.max(0, Date.parse(to) - Date.parse(from))
    const bucket: Bucket = span <= 2 * DAY ? 'day' : span <= 90 * DAY ? 'day' : span <= 730 * DAY ? 'month' : 'year'
    return { from, to, bucket, key }
  }
  const spanDays = key === 'day' ? 1 : key === 'week' ? 7 : key === 'month' ? 30 : 365
  const bucket: Bucket = key === 'day' ? 'day' : key === 'week' ? 'day' : key === 'month' ? 'day' : 'month'
  return {
    from: new Date(now - spanDays * DAY).toISOString(),
    to:   new Date(now).toISOString(),
    bucket,
    key: key === 'custom' ? 'week' : key,
  }
}

const empty = (range: AnalyticsData['range']): AnalyticsData => ({
  available: false,
  range,
  totalEvents: 0,
  metrics: {
    views: 0, uniqueVisitors: 0, returningVisitors: 0, avgReadingTimeSec: 0,
    avgScrollDepth: 0, completionRate: 0, bounceRate: 0, shares: 0, bookmarks: 0,
  },
  series: [], byDevice: [], bySource: [], byReferrer: [], byCountry: [],
  topArticles: [], insights: { bestPerforming: null, fastestGrowing: null, topCategories: [], topTags: [], topAuthors: [] },
})

function isMissingEventsTable(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return error?.code === '42P01' || (msg.includes('article_events') && msg.includes('does not exist'))
}

function mapRow(r: any): AnalyticsEvent {
  return {
    articleId: r.article_id || '',
    type:      r.type,
    visitor:   r.visitor || '',
    session:   r.session || '',
    device:    r.device || 'desktop',
    refType:   r.ref_type || 'direct',
    referrer:  r.referrer || '',
    country:   r.country || '',
    scrollPct: r.scroll_pct || 0,
    dwellMs:   r.dwell_ms || 0,
    createdAt: r.created_at,
  }
}

export async function getAnalytics(key: RangeKey = 'week', from?: string, to?: string): Promise<AnalyticsData> {
  const range = resolveRange(key, from, to)
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('article_events')
    .select('article_id, type, visitor, session, device, ref_type, referrer, country, scroll_pct, dwell_ms, created_at')
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .limit(EVENT_CAP)

  if (error) {
    if (isMissingEventsTable(error)) return empty(range)
    console.error('getAnalytics:', error.message)
    return empty(range)
  }

  const events = (data || []).map(mapRow)
  const viewEvents = events.filter(e => e.type === 'view')

  // ── Per-article view counts, split at the range midpoint for a growth read ──
  const mid = (Date.parse(range.from) + Date.parse(range.to)) / 2
  const totalByArticle = new Map<string, number>()
  const recentByArticle = new Map<string, number>()
  const prevByArticle = new Map<string, number>()
  for (const e of viewEvents) {
    if (!e.articleId) continue
    totalByArticle.set(e.articleId, (totalByArticle.get(e.articleId) ?? 0) + 1)
    const bin = Date.parse(e.createdAt) >= mid ? recentByArticle : prevByArticle
    bin.set(e.articleId, (bin.get(e.articleId) ?? 0) + 1)
  }

  // Join article metadata (title/slug/author/categories/tags) for the articles
  // that actually got views in this range.
  const ids = Array.from(totalByArticle.keys())
  const metaById = new Map<string, { title: string; slug: string; author: string | null; categories: string[]; tags: string[] }>()
  if (ids.length) {
    const { data: arts } = await db
      .from('articles')
      .select('id, title, slug, authors ( name ), article_categories ( categories ( name ) ), article_tags ( tags ( name ) )')
      .in('id', ids)
    for (const a of (arts || []) as any[]) {
      metaById.set(a.id, {
        title:      a.title,
        slug:       a.slug,
        author:     a.authors?.name || null,
        categories: (a.article_categories || []).map((ac: any) => ac.categories?.name).filter(Boolean),
        tags:       (a.article_tags || []).map((at: any) => at.tags?.name).filter(Boolean),
      })
    }
  }

  const stats: ArticleStat[] = ids.map(id => {
    const m = metaById.get(id)
    return {
      id,
      title:       m?.title || 'Untitled',
      author:      m?.author ?? null,
      categories:  m?.categories || [],
      tags:        m?.tags || [],
      viewsRecent: recentByArticle.get(id) ?? 0,
      viewsPrev:   prevByArticle.get(id) ?? 0,
      viewsTotal:  totalByArticle.get(id) ?? 0,
    }
  })

  const topArticles = stats
    .slice()
    .sort((a, b) => b.viewsTotal - a.viewsTotal)
    .slice(0, 8)
    .map(s => ({ id: s.id, title: s.title, slug: metaById.get(s.id)?.slug || '', views: s.viewsTotal }))

  return {
    available:   true,
    range,
    totalEvents: events.length,
    metrics:     aggregateMetrics(events),
    series:      timeSeries(events, range.bucket, 'view'),
    byDevice:    breakdown(events, 'device', 'view'),
    bySource:    breakdown(events, 'refType', 'view'),
    byReferrer:  breakdown(events.filter(e => e.referrer), 'referrer', 'view').slice(0, 8),
    byCountry:   breakdown(events.filter(e => e.country), 'country', 'view').slice(0, 8),
    topArticles,
    insights:    buildInsights(stats),
  }
}
