/**
 * Analytics Dashboard — pure core (Phase 2, Feature 5).
 * ─────────────────────────────────────────────────────────────────
 * DOM-free aggregation over collected page events: classifiers (referrer type,
 * device from UA), metric roll-ups, time-series bucketing, dimension breakdowns
 * and editorial insights. Kept pure so it runs on the server and is fully
 * unit-testable; the dashboard just renders what these return.
 */

export type EventType = 'view' | 'read' | 'share' | 'bookmark'
export type Device = 'mobile' | 'tablet' | 'desktop'
export type RefType = 'organic' | 'social' | 'direct' | 'referral'

export interface AnalyticsEvent {
  articleId: string
  type:      EventType
  visitor:   string     // stable per-browser hash
  session:   string     // per-visit id
  device:    Device
  refType:   RefType
  referrer:  string     // referrer host, or ''
  country:   string     // ISO-2, or ''
  scrollPct: number     // 0–100 (read events)
  dwellMs:   number     // time on page in ms (read events)
  createdAt: string     // ISO timestamp
}

// ── Classifiers (used at collection time + in tests) ───────────
const SEARCH_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'ecosia.', 'baidu.', 'yandex.']
const SOCIAL_HOSTS = ['t.co', 'twitter.', 'x.com', 'facebook.', 'fb.', 'linkedin.', 'lnkd.in', 'reddit.', 'instagram.', 'youtube.', 'youtu.be', 'whatsapp', 'wa.me', 't.me', 'telegram', 'pinterest.']

/** Classify a referrer host relative to our own host. */
export function classifyReferrer(referrerHost: string, selfHost = ''): RefType {
  const h = (referrerHost || '').toLowerCase().replace(/^www\./, '')
  if (!h) return 'direct'
  if (selfHost && h === selfHost.toLowerCase().replace(/^www\./, '')) return 'direct'
  if (SEARCH_HOSTS.some(s => h.includes(s))) return 'organic'
  if (SOCIAL_HOSTS.some(s => h.includes(s))) return 'social'
  return 'referral'
}

/** Coarse device class from a User-Agent string. */
export function deviceFromUA(ua: string): Device {
  const u = (ua || '').toLowerCase()
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(u)) return 'tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(u)) return 'mobile'
  return 'desktop'
}

// ── Metric roll-up ─────────────────────────────────────────────
export interface Metrics {
  views:             number
  uniqueVisitors:    number
  returningVisitors: number
  avgReadingTimeSec: number
  avgScrollDepth:    number   // 0–100
  completionRate:    number   // 0–100 (% of reads ≥90%)
  bounceRate:        number   // 0–100
  shares:            number
  bookmarks:         number
}

const uniq = (xs: string[]) => new Set(xs.filter(Boolean)).size

export function aggregateMetrics(events: AnalyticsEvent[]): Metrics {
  const views = events.filter(e => e.type === 'view')
  const reads = events.filter(e => e.type === 'read')
  const shares = events.filter(e => e.type === 'share').length
  const bookmarks = events.filter(e => e.type === 'bookmark').length

  // Returning = visitors seen across more than one session.
  const sessionsByVisitor = new Map<string, Set<string>>()
  for (const e of views) {
    if (!e.visitor) continue
    if (!sessionsByVisitor.has(e.visitor)) sessionsByVisitor.set(e.visitor, new Set())
    sessionsByVisitor.get(e.visitor)!.add(e.session)
  }
  let returning = 0
  sessionsByVisitor.forEach(s => { if (s.size > 1) returning++ })

  const avgScroll = reads.length ? reads.reduce((a, e) => a + e.scrollPct, 0) / reads.length : 0
  const avgDwell = reads.length ? reads.reduce((a, e) => a + e.dwellMs, 0) / reads.length : 0
  const completed = reads.filter(e => e.scrollPct >= 90).length
  const completion = reads.length ? (completed / reads.length) * 100 : 0

  // Bounce = single-view sessions that barely engaged (scroll <25% or dwell <10s).
  const readBySession = new Map<string, AnalyticsEvent>()
  for (const r of reads) readBySession.set(r.session, r)
  const viewsBySession = new Map<string, number>()
  for (const v of views) viewsBySession.set(v.session, (viewsBySession.get(v.session) ?? 0) + 1)
  let bounced = 0
  const totalSessions = viewsBySession.size
  viewsBySession.forEach((count, session) => {
    const r = readBySession.get(session)
    const shallow = !r || r.scrollPct < 25 || r.dwellMs < 10_000
    if (count <= 1 && shallow) bounced++
  })

  return {
    views: views.length,
    uniqueVisitors: uniq(views.map(e => e.visitor)),
    returningVisitors: returning,
    avgReadingTimeSec: Math.round(avgDwell / 1000),
    avgScrollDepth: Math.round(avgScroll),
    completionRate: Math.round(completion),
    bounceRate: totalSessions ? Math.round((bounced / totalSessions) * 100) : 0,
    shares,
    bookmarks,
  }
}

// ── Time series ────────────────────────────────────────────────
export type Bucket = 'day' | 'week' | 'month' | 'year'

/** Bucket key for a date (UTC) at the given granularity. */
export function bucketKey(iso: string, bucket: Bucket): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  if (bucket === 'year') return `${y}`
  if (bucket === 'month') return `${y}-${m}`
  if (bucket === 'week') {
    // ISO-ish week start (Monday), keyed by that date.
    const t = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()))
    const dow = (t.getUTCDay() + 6) % 7
    t.setUTCDate(t.getUTCDate() - dow)
    return t.toISOString().slice(0, 10)
  }
  return `${y}-${m}-${day}`
}

export interface Point { key: string; value: number }

/** Count events of a type per time bucket, sorted chronologically. */
export function timeSeries(events: AnalyticsEvent[], bucket: Bucket, type: EventType = 'view'): Point[] {
  const m = new Map<string, number>()
  for (const e of events) {
    if (e.type !== type) continue
    const k = bucketKey(e.createdAt, bucket)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return Array.from(m.entries()).map(([key, value]) => ({ key, value })).sort((a, b) => a.key.localeCompare(b.key))
}

// ── Dimension breakdown ────────────────────────────────────────
export interface Slice { label: string; value: number }

export function breakdown(events: AnalyticsEvent[], key: 'device' | 'refType' | 'referrer' | 'country', type: EventType = 'view'): Slice[] {
  const m = new Map<string, number>()
  for (const e of events) {
    if (e.type !== type) continue
    const v = String(e[key] || '—')
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

// ── Insights (need article metadata joined with view counts) ───
export interface ArticleStat {
  id:          string
  title:       string
  author:      string | null
  categories:  string[]
  tags:        string[]
  viewsRecent: number   // e.g. last 7 days
  viewsPrev:   number   // the 7 days before that
  viewsTotal:  number
}

export interface Insights {
  bestPerforming: ArticleStat | null
  fastestGrowing: { article: ArticleStat; growthPct: number } | null
  topCategories:  Slice[]
  topTags:        Slice[]
  topAuthors:     Slice[]
}

function sumBy(stats: ArticleStat[], pick: (s: ArticleStat) => string[]): Slice[] {
  const m = new Map<string, number>()
  for (const s of stats) for (const k of pick(s)) if (k) m.set(k, (m.get(k) ?? 0) + s.viewsTotal)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
}

export function buildInsights(stats: ArticleStat[]): Insights {
  const best = stats.reduce<ArticleStat | null>((m, s) => (!m || s.viewsTotal > m.viewsTotal ? s : m), null)
  let fastest: Insights['fastestGrowing'] = null
  for (const s of stats) {
    if (s.viewsPrev < 3 && s.viewsRecent < 5) continue // ignore tiny numbers
    const growth = s.viewsPrev > 0 ? ((s.viewsRecent - s.viewsPrev) / s.viewsPrev) * 100 : s.viewsRecent * 100
    if (!fastest || growth > fastest.growthPct) fastest = { article: s, growthPct: Math.round(growth) }
  }
  return {
    bestPerforming: best,
    fastestGrowing: fastest,
    topCategories: sumBy(stats, s => s.categories),
    topTags: sumBy(stats, s => s.tags),
    topAuthors: sumBy(stats, s => (s.author ? [s.author] : [])),
  }
}
