'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Eye, Users, UserCheck, Clock, ArrowDownWideNarrow, CheckCircle2,
  LogOut, Share2, Bookmark, TrendingUp, Award, Loader2, BarChart3,
} from 'lucide-react'
import { LineChart, BarList } from './AnalyticsCharts'
import type { AnalyticsData, RangeKey } from './getAnalytics'

/**
 * Analytics Dashboard (Phase 2, Feature 5) — client shell.
 * ─────────────────────────────────────────────────────────────────
 * Renders the server-provided snapshot immediately (SSR fallback, hydration-safe)
 * and refreshes from the `/api/admin/analytics` proxy whenever the range changes
 * — the live-data pattern the rest of the platform uses. All numbers come from
 * the unit-tested pure core; this component only lays them out.
 */

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
  { key: 'year', label: '12 months' },
]

export function AnalyticsDashboard({ initial }: { initial: AnalyticsData }) {
  const [data, setData] = useState<AnalyticsData>(initial)
  const [range, setRange] = useState<RangeKey>(initial.range.key)
  const [custom, setCustom] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback((key: RangeKey, from?: string, to?: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    const qs = new URLSearchParams({ range: key })
    if (key === 'custom' && from && to) { qs.set('from', from); qs.set('to', to) }
    fetch(`/api/admin/analytics?${qs.toString()}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: AnalyticsData) => setData(d))
      .catch(err => { if (err?.name !== 'AbortError') console.error(err) })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
  }, [])

  // Refetch when a preset range is picked (custom is applied via its own button).
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (range !== 'custom') load(range)
  }, [range, load])

  const applyCustom = () => {
    if (custom.from && custom.to) { setRange('custom'); load('custom', custom.from, custom.to) }
  }

  const m = data.metrics
  const bucket = data.range.bucket
  const fmtKey = makeKeyFormatter(bucket)

  return (
    <div className="an-dash">

      {/* ── Header + range selector ─────────────────────── */}
      <div className="an-dash__head">
        <div>
          <span className="an-dash__eyebrow">Insights</span>
          <h1 className="an-dash__title">Analytics</h1>
          <p className="an-dash__sub">Audience &amp; engagement across your published stories</p>
        </div>
        <div className="an-range" role="group" aria-label="Time range">
          {RANGES.map(r => (
            <button
              key={r.key}
              type="button"
              className={`an-range__btn${range === r.key ? ' is-active' : ''}`}
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
            >
              {r.label}
            </button>
          ))}
          {loading && <Loader2 size={14} className="an-range__spin" aria-hidden />}
        </div>
      </div>

      {/* Custom range */}
      <div className="an-custom">
        <label className="an-custom__field">
          <span>From</span>
          <input type="date" value={custom.from} max={custom.to || undefined} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />
        </label>
        <label className="an-custom__field">
          <span>To</span>
          <input type="date" value={custom.to} min={custom.from || undefined} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />
        </label>
        <button type="button" className="an-custom__apply" onClick={applyCustom} disabled={!custom.from || !custom.to}>
          Apply
        </button>
      </div>

      {!data.available ? (
        <div className="an-empty-state">
          <BarChart3 size={26} aria-hidden />
          <h2>No analytics yet</h2>
          <p>
            Once the events table is migrated and readers start visiting published
            articles, views, engagement and traffic sources will appear here.
            Data collection is privacy-friendly — no cookies, no personal data.
          </p>
        </div>
      ) : data.totalEvents === 0 ? (
        <div className="an-empty-state">
          <BarChart3 size={26} aria-hidden />
          <h2>No activity in this range</h2>
          <p>Try a wider time range, or check back once readers have visited your articles.</p>
        </div>
      ) : (
        <>
          {/* ── KPI tiles ────────────────────────────────── */}
          <div className="an-kpis">
            <Kpi icon={<Eye size={14} />}          label="Views"            value={m.views.toLocaleString()} tone="accent" />
            <Kpi icon={<Users size={14} />}        label="Unique visitors"  value={m.uniqueVisitors.toLocaleString()} tone="accent" />
            <Kpi icon={<UserCheck size={14} />}    label="Returning"        value={m.returningVisitors.toLocaleString()} tone="green" />
            <Kpi icon={<Clock size={14} />}        label="Avg. read time"   value={fmtDuration(m.avgReadingTimeSec)} tone="gold" />
            <Kpi icon={<ArrowDownWideNarrow size={14} />} label="Avg. scroll" value={`${m.avgScrollDepth}%`} tone="accent" />
            <Kpi icon={<CheckCircle2 size={14} />} label="Completion"       value={`${m.completionRate}%`} tone="green" />
            <Kpi icon={<LogOut size={14} />}       label="Bounce rate"      value={`${m.bounceRate}%`} tone="red" />
            <Kpi icon={<Share2 size={14} />}       label="Shares"           value={m.shares.toLocaleString()} tone="gold" />
            <Kpi icon={<Bookmark size={14} />}     label="Bookmarks"        value={m.bookmarks.toLocaleString()} tone="accent" />
          </div>

          {/* ── Views over time ──────────────────────────── */}
          <section className="an-card an-card--wide">
            <div className="an-card__head">
              <h2 className="an-card__title">Views over time</h2>
              <span className="an-card__meta">{data.series.reduce((a, p) => a + p.value, 0).toLocaleString()} total</span>
            </div>
            <LineChart points={data.series} label="Views" formatKey={fmtKey} />
          </section>

          {/* ── Breakdowns ───────────────────────────────── */}
          <div className="an-grid2">
            <section className="an-card">
              <h2 className="an-card__title">By device</h2>
              <BarList slices={data.byDevice} renderLabel={cap} />
            </section>
            <section className="an-card">
              <h2 className="an-card__title">Traffic sources</h2>
              <BarList slices={data.bySource} renderLabel={cap} />
            </section>
            <section className="an-card">
              <h2 className="an-card__title">Top referrers</h2>
              <BarList slices={data.byReferrer} />
            </section>
            <section className="an-card">
              <h2 className="an-card__title">Top countries</h2>
              <BarList slices={data.byCountry} renderLabel={l => l.toUpperCase()} />
            </section>
          </div>

          {/* ── Editorial insights ───────────────────────── */}
          <div className="an-grid2">
            <section className="an-card">
              <h2 className="an-card__title">Highlights</h2>
              <div className="an-insight">
                <Award size={16} className="an-insight__icon" aria-hidden />
                <div>
                  <span className="an-insight__k">Best performing</span>
                  <span className="an-insight__v">{data.insights.bestPerforming?.title || '—'}</span>
                  {data.insights.bestPerforming && (
                    <span className="an-insight__sub">{data.insights.bestPerforming.viewsTotal.toLocaleString()} views</span>
                  )}
                </div>
              </div>
              <div className="an-insight">
                <TrendingUp size={16} className="an-insight__icon" aria-hidden />
                <div>
                  <span className="an-insight__k">Fastest growing</span>
                  <span className="an-insight__v">{data.insights.fastestGrowing?.article.title || '—'}</span>
                  {data.insights.fastestGrowing && (
                    <span className="an-insight__sub">
                      {data.insights.fastestGrowing.growthPct >= 0 ? '+' : ''}{data.insights.fastestGrowing.growthPct}% vs. earlier in range
                    </span>
                  )}
                </div>
              </div>
              <div className="an-insight__cols">
                <MiniList title="Top categories" slices={data.insights.topCategories} />
                <MiniList title="Top tags" slices={data.insights.topTags} />
              </div>
            </section>

            <section className="an-card">
              <h2 className="an-card__title">Top articles</h2>
              {data.topArticles.length === 0
                ? <p className="an-empty">No views in this range yet.</p>
                : (
                  <ol className="an-top">
                    {data.topArticles.map((a, i) => (
                      <li className="an-top__row" key={a.id}>
                        <span className="an-top__rank">{i + 1}</span>
                        <span className="an-top__title" title={a.title}>{a.title}</span>
                        <span className="an-top__views"><Eye size={11} aria-hidden /> {a.views.toLocaleString()}</span>
                      </li>
                    ))}
                  </ol>
                )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────
function Kpi({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: string; tone: 'accent' | 'green' | 'gold' | 'red'
}) {
  return (
    <div className="an-kpi">
      <div className="an-kpi__head">
        <span className={`an-kpi__icon an-kpi__icon--${tone}`}>{icon}</span>
        <span className="an-kpi__label">{label}</span>
      </div>
      <div className={`an-kpi__value an-kpi__value--${tone}`}>{value}</div>
    </div>
  )
}

function MiniList({ title, slices }: { title: string; slices: { label: string; value: number }[] }) {
  return (
    <div className="an-mini">
      <span className="an-mini__title">{title}</span>
      {slices.length === 0
        ? <span className="an-mini__empty">—</span>
        : slices.slice(0, 5).map(s => (
          <div className="an-mini__row" key={s.label}>
            <span className="an-mini__label" title={s.label}>{s.label}</span>
            <span className="an-mini__value">{s.value.toLocaleString()}</span>
          </div>
        ))}
    </div>
  )
}

// ── Formatting helpers ─────────────────────────────────────────
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—')

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Turn a bucket key (YYYY / YYYY-MM / YYYY-MM-DD) into a short axis label. */
function makeKeyFormatter(bucket: string) {
  return (key: string): string => {
    const parts = key.split('-')
    if (bucket === 'year' || parts.length === 1) return parts[0]
    const mo = MONTHS[Number(parts[1]) - 1] || parts[1]
    if (bucket === 'month' || parts.length === 2) return mo
    return `${mo} ${Number(parts[2])}`
  }
}
