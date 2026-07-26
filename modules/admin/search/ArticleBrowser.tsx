'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, X, Star, Download,
  CheckCircle, Clock, Archive, Trash2, Bookmark, Save, Loader2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toCsv, type SearchableArticle, type SortKey, type SortDir } from './articleSearch'
import { loadSavedFilters, saveFilter, removeSavedFilter, type SavedFilter } from './savedFilters'
import type { ArticleStatus, ArticleType } from '@/types/article'

interface Opt { id: string; name: string }

const STATUS_COLOR: Record<string, string> = {
  published: 'var(--green)', draft: 'var(--gold)', archived: 'rgba(var(--ink),0.7)', scheduled: 'var(--purple)',
}
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Updated' }, { key: 'published', label: 'Published' },
  { key: 'title', label: 'Title' }, { key: 'views', label: 'Views' }, { key: 'reading', label: 'Read time' },
]
const STATUS_OPTS: ArticleStatus[] = ['published', 'draft', 'scheduled', 'archived']
const TYPE_OPTS: { value: ArticleType; label: string }[] = [
  { value: 'breaking-news', label: 'Breaking' }, { value: 'analysis', label: 'Analysis' },
  { value: 'editorial', label: 'Editorial' }, { value: 'mission-update', label: 'Mission update' },
  { value: 'research-breakdown', label: 'Research' }, { value: 'explainer', label: 'Explainer' },
  { value: 'guide', label: 'Guide' },
]

/** Server-side filter state (mirrors AdminArticleQuery, minus paging). */
export interface BrowseFilters {
  status:     ArticleStatus | 'all'
  type:       ArticleType | 'all'
  categoryId: string | null
  tagId:      string | null
  authorId:   string | null
  featuredOnly: boolean
  viewsMin:   number | null
  viewsMax:   number | null
  readingMin: number | null
  readingMax: number | null
  dateFrom:   string | null
  dateTo:     string | null
  sort:       SortKey
  sortDir:    SortDir
}

const emptyFilters = (): BrowseFilters => ({
  status: 'all', type: 'all', categoryId: null, tagId: null, authorId: null, featuredOnly: false,
  viewsMin: null, viewsMax: null, readingMin: null, readingMax: null, dateFrom: null, dateTo: null,
  sort: 'updated', sortDir: 'desc',
})

function isActive(f: BrowseFilters): boolean {
  return f.status !== 'all' || f.type !== 'all' || !!f.categoryId || !!f.tagId || !!f.authorId ||
    f.featuredOnly || f.viewsMin != null || f.viewsMax != null || f.readingMin != null ||
    f.readingMax != null || !!f.dateFrom || !!f.dateTo
}

/**
 * Advanced Search & Content Discovery (Phase 2, Feature 8 — scaled).
 * ─────────────────────────────────────────────────────────────────
 * Search / filter / sort all run in the DATABASE, and the list loads in capped
 * batches (`perPage` rows per API call) via infinite scroll: the first batch is
 * the server snapshot, and each time the admin nears the bottom the next batch
 * is fetched and appended. So a single API call never returns more than one
 * batch — the corpus can be millions of rows and the panel still stays light.
 * Multi-select + bulk actions operate on the rows loaded so far.
 */
export function ArticleBrowser({
  initialRows, initialTotal, perPage, categories, tags, authors,
}: {
  initialRows:  SearchableArticle[]
  initialTotal: number
  perPage:      number
  categories:   Opt[]
  tags:         Opt[]
  authors:      Opt[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState<SearchableArticle[]>(initialRows)
  const [total, setTotal] = useState(initialTotal)
  const [filters, setFilters] = useState<BrowseFilters>(emptyFilters)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [presets, setPresets] = useState<SavedFilter<BrowseFilters>[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  // Refs the IntersectionObserver reads without re-subscribing on every render.
  const pageRef    = useRef(1)          // highest batch (page) loaded
  const loadingRef = useRef(false)
  const rowsRef    = useRef(initialRows)
  const totalRef   = useRef(initialTotal)
  const abortRef   = useRef<AbortController | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { totalRef.current = total }, [total])

  useEffect(() => { setPresets(loadSavedFilters<BrowseFilters>()) }, [])

  // Debounce the free-text query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const buildQuery = useCallback((targetPage: number) => {
    const p = new URLSearchParams()
    p.set('page', String(targetPage)); p.set('perPage', String(perPage))
    p.set('sort', filters.sort); p.set('sortDir', filters.sortDir)
    if (debouncedQuery.trim()) p.set('search', debouncedQuery.trim())
    if (filters.status !== 'all') p.set('status', filters.status)
    if (filters.type !== 'all') p.set('type', filters.type)
    if (filters.categoryId) p.set('categoryId', filters.categoryId)
    if (filters.tagId) p.set('tagId', filters.tagId)
    if (filters.authorId) p.set('authorId', filters.authorId)
    if (filters.featuredOnly) p.set('featuredOnly', '1')
    if (filters.viewsMin != null) p.set('viewsMin', String(filters.viewsMin))
    if (filters.viewsMax != null) p.set('viewsMax', String(filters.viewsMax))
    if (filters.readingMin != null) p.set('readingMin', String(filters.readingMin))
    if (filters.readingMax != null) p.set('readingMax', String(filters.readingMax))
    if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) p.set('dateTo', filters.dateTo)
    return p.toString()
  }, [perPage, filters, debouncedQuery])

  // Fetch one batch. `replace` starts a fresh list (filter/search change);
  // otherwise the batch is appended (infinite scroll).
  const loadPage = useCallback((targetPage: number, replace: boolean) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true); loadingRef.current = true

    fetch(`/api/admin/articles/list?${buildQuery(targetPage)}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { rows: SearchableArticle[]; total: number }) => {
        setTotal(d.total)
        pageRef.current = targetPage
        setRows(prev => {
          if (replace) return d.rows
          const have = new Set(prev.map(r => r.id))
          return [...prev, ...d.rows.filter(r => !have.has(r.id))]
        })
      })
      .catch(err => { if (err?.name !== 'AbortError') console.error(err) })
      .finally(() => { if (!ctrl.signal.aborted) { setLoading(false); loadingRef.current = false } })
  }, [buildQuery])

  // Reset to the first batch whenever the query or a filter changes (not on the
  // initial mount — the server already provided batch 1).
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    pageRef.current = 1
    setSelected(new Set())
    loadPage(1, true)
  }, [filters, debouncedQuery, loadPage])

  const hasMore = rows.length < total

  // Infinite scroll: load the next batch when the sentinel nears the viewport.
  // Re-subscribes when `hasMore` flips (the sentinel mounts/unmounts) or the
  // active query changes (so appended batches use the current filters).
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingRef.current && rowsRef.current.length < totalRef.current) {
        loadPage(pageRef.current + 1, false)
      }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadPage, hasMore])

  const patch = (p: Partial<BrowseFilters>) => setFilters(f => ({ ...f, ...p }))
  const single = <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => {
    const clear = (key === 'status' || key === 'type') ? ('all' as BrowseFilters[K]) : (null as BrowseFilters[K])
    patch({ [key]: filters[key] === value ? clear : value } as Partial<BrowseFilters>)
  }

  const allLoadedSelected = rows.length > 0 && rows.every(r => selected.has(r.id))
  const toggleSelectAll = () => setSelected(s => {
    const next = new Set(s)
    if (allLoadedSelected) rows.forEach(r => next.delete(r.id))
    else rows.forEach(r => next.add(r.id))
    return next
  })
  const toggleRow = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function runBulk(action: string, value?: string) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (action === 'delete' && !window.confirm(`Delete ${ids.length} article${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/articles/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids, value }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); window.alert(e.error || 'Bulk action failed') }
      else { setSelected(new Set()); pageRef.current = 1; loadPage(1, true); router.refresh() }
    } catch { window.alert('Network error') }
    setBusy(false)
  }

  function exportCsv() {
    // Export the rows loaded so far (or the current selection) — bounded by
    // what's been fetched, never the whole corpus.
    const chosen = selected.size ? rows.filter(r => selected.has(r.id)) : rows
    const blob = new Blob([toCsv(chosen)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `articles-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function applyPreset(f: BrowseFilters) { setFilters(f) }
  function saveCurrent() {
    const name = window.prompt('Name this filter preset')
    if (name?.trim()) setPresets(saveFilter(name.trim(), filters))
  }
  function clearAll() { setFilters(emptyFilters()); setQuery('') }

  return (
    <div>
      {/* ── Search + controls ── */}
      <div className="ab-bar">
        <div className="ab-search">
          <Search size={15} aria-hidden />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title or slug…"
            aria-label="Search articles"
          />
          {loading
            ? <Loader2 size={14} className="ab-spin" aria-hidden />
            : query && <button className="ab-x" onClick={() => setQuery('')} aria-label="Clear search"><X size={13} /></button>}
        </div>
        <div className="ab-sort">
          <select value={filters.sort} onChange={e => patch({ sort: e.target.value as SortKey })} aria-label="Sort by">
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="ab-dir" onClick={() => patch({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })} title="Toggle direction">
            {filters.sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        <button className={`ab-btn${showFilters ? ' is-on' : ''}`} onClick={() => setShowFilters(s => !s)}>
          <SlidersHorizontal size={14} /> Filters{isActive(filters) ? ' •' : ''}
        </button>
        <button className="ab-btn" onClick={exportCsv} title="Export the loaded rows to CSV"><Download size={14} /> Export</button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="ab-filters">
          <ChipRow label="Status" options={STATUS_OPTS.map(s => ({ value: s, label: s }))} selected={filters.status === 'all' ? null : filters.status} onPick={v => single('status', v as ArticleStatus)} />
          <ChipRow label="Type" options={TYPE_OPTS} selected={filters.type === 'all' ? null : filters.type} onPick={v => single('type', v as ArticleType)} />
          <ChipRow label="Category" options={categories.map(c => ({ value: c.id, label: c.name }))} selected={filters.categoryId} onPick={v => single('categoryId', v)} />
          <ChipRow label="Tag" options={tags.map(t => ({ value: t.id, label: t.name }))} selected={filters.tagId} onPick={v => single('tagId', v)} />
          <ChipRow label="Author" options={authors.map(a => ({ value: a.id, label: a.name }))} selected={filters.authorId} onPick={v => single('authorId', v)} />

          <div className="ab-frow">
            <span className="ab-flabel">Metrics</span>
            <NumRange label="Views" min={filters.viewsMin} max={filters.viewsMax} onMin={v => patch({ viewsMin: v })} onMax={v => patch({ viewsMax: v })} />
            <NumRange label="Read min" min={filters.readingMin} max={filters.readingMax} onMin={v => patch({ readingMin: v })} onMax={v => patch({ readingMax: v })} />
            <label className="ab-check"><input type="checkbox" checked={filters.featuredOnly} onChange={e => patch({ featuredOnly: e.target.checked })} /> Featured only</label>
          </div>
          <div className="ab-frow">
            <span className="ab-flabel">Published</span>
            <input className="ab-date" type="date" value={filters.dateFrom || ''} onChange={e => patch({ dateFrom: e.target.value || null })} aria-label="From date" />
            <span style={{ color: 'rgba(var(--ink),0.4)' }}>→</span>
            <input className="ab-date" type="date" value={filters.dateTo || ''} onChange={e => patch({ dateTo: e.target.value || null })} aria-label="To date" />
            {(isActive(filters) || query) && <button className="ab-clear" onClick={clearAll}>Clear all</button>}
          </div>

          {/* Saved presets */}
          <div className="ab-frow">
            <span className="ab-flabel"><Bookmark size={12} aria-hidden /> Presets</span>
            {presets.map(p => (
              <span key={p.id} className="ab-preset">
                <button onClick={() => applyPreset(p.filters)}>{p.name}</button>
                <button className="ab-preset-x" onClick={() => setPresets(removeSavedFilter<BrowseFilters>(p.id))} aria-label={`Delete preset ${p.name}`}><X size={11} /></button>
              </span>
            ))}
            <button className="ab-clear" onClick={saveCurrent}><Save size={12} /> Save current</button>
          </div>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="ab-bulk">
          <span className="ab-bulk-count">{selected.size} selected</span>
          <button onClick={() => runBulk('status', 'published')} disabled={busy}><CheckCircle size={13} /> Publish</button>
          <button onClick={() => runBulk('status', 'draft')} disabled={busy}><Clock size={13} /> Draft</button>
          <button onClick={() => runBulk('status', 'archived')} disabled={busy}><Archive size={13} /> Archive</button>
          <BulkSelect label="Add category" options={categories} onPick={id => runBulk('addCategory', id)} disabled={busy} />
          <BulkSelect label="Add tag" options={tags} onPick={id => runBulk('addTag', id)} disabled={busy} />
          <BulkSelect label="Assign author" options={authors} onPick={id => runBulk('author', id)} disabled={busy} />
          <button onClick={exportCsv}><Download size={13} /> Export</button>
          <button className="ab-danger" onClick={() => runBulk('delete')} disabled={busy}><Trash2 size={13} /> Delete</button>
          <button className="ab-clear" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* ── Results count ── */}
      <p className="ab-count">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        <span className="ab-count-sub"> · {rows.length.toLocaleString()} loaded</span>
      </p>

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <div className="ab-empty">{loading ? 'Loading…' : 'No articles match your search.'}</div>
      ) : (
        <div className="ab-table">
          <div className="ab-thead">
            <input type="checkbox" checked={allLoadedSelected} onChange={toggleSelectAll} aria-label="Select all loaded" />
            <span>Article</span><span>Type</span><span>Status</span><span>Views</span><span></span>
          </div>
          {rows.map(a => (
            <div key={a.id} className={`ab-row${selected.has(a.id) ? ' is-sel' : ''}`}>
              <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleRow(a.id)} aria-label={`Select ${a.title}`} />
              <div className="ab-titlecell">
                <div className="ab-title">
                  {a.featured && <Star size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                  <Link href={`/admin/articles/${a.id}`}>{a.title}</Link>
                </div>
                <div className="ab-meta">
                  {a.authorName && <span>{a.authorName}</span>}
                  <span>{a.publishedAt ? formatDate(a.publishedAt) : 'Unpublished'}</span>
                  {a.categories[0] && <span style={{ color: 'var(--accent)' }}>{a.categories[0]}</span>}
                  {a.readingTime > 0 && <span>{a.readingTime}m</span>}
                </div>
              </div>
              <span className="ab-type">{a.articleType.replace('-', ' ')}</span>
              <span style={{ color: STATUS_COLOR[a.status] || 'inherit' }}>{a.status}</span>
              <span className="ab-views">{a.views.toLocaleString()}</span>
              <Link className="ab-edit" href={`/admin/articles/${a.id}`}>Edit</Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Infinite-scroll sentinel + status ── */}
      {hasMore && <div ref={sentinelRef} className="ab-sentinel" aria-hidden />}
      {rows.length > 0 && (
        <div className="ab-more">
          {loading
            ? <span className="ab-more-load"><Loader2 size={14} className="ab-spin" aria-hidden /> Loading more…</span>
            : hasMore
              ? <button className="ab-more-btn" onClick={() => loadPage(pageRef.current + 1, false)}>Load more</button>
              : <span className="ab-more-end">All {total.toLocaleString()} loaded</span>}
        </div>
      )}
    </div>
  )
}

function ChipRow({ label, options, selected, onPick }: {
  label: string; options: { value: string; label: string }[]; selected: string | null; onPick: (v: string) => void
}) {
  if (options.length === 0) return null
  return (
    <div className="ab-frow">
      <span className="ab-flabel">{label}</span>
      {options.map(o => (
        <button key={o.value} className={`ab-chip${selected === o.value ? ' is-on' : ''}`} onClick={() => onPick(o.value)}>
          {o.label || '—'}
        </button>
      ))}
    </div>
  )
}

function NumRange({ label, min, max, onMin, onMax }: {
  label: string; min: number | null; max: number | null; onMin: (v: number | null) => void; onMax: (v: number | null) => void
}) {
  const num = (s: string) => (s === '' ? null : Number(s))
  return (
    <span className="ab-range">
      <span>{label}</span>
      <input type="number" placeholder="min" value={min ?? ''} onChange={e => onMin(num(e.target.value))} />
      <input type="number" placeholder="max" value={max ?? ''} onChange={e => onMax(num(e.target.value))} />
    </span>
  )
}

function BulkSelect({ label, options, onPick, disabled }: {
  label: string; options: Opt[]; onPick: (id: string) => void; disabled: boolean
}) {
  return (
    <select
      className="ab-bulk-select"
      value=""
      disabled={disabled || options.length === 0}
      onChange={e => { if (e.target.value) { onPick(e.target.value); e.target.value = '' } }}
    >
      <option value="">{label}…</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  )
}
