'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, X, Star, ChevronLeft, ChevronRight, Download,
  CheckCircle, Clock, Archive, Trash2, Bookmark, Save,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  searchArticles, computeFacets, emptyFilters, isFilterActive, toCsv,
  type SearchableArticle, type SearchFilters, type SortKey,
} from './articleSearch'
import { loadSavedFilters, saveFilter, removeSavedFilter, type SavedFilter } from './savedFilters'

interface Opt { id: string; name: string }
const PER_PAGE = 25
const STATUS_COLOR: Record<string, string> = {
  published: 'var(--green)', draft: 'var(--gold)', archived: 'rgba(var(--ink),0.7)', scheduled: 'var(--purple)',
}
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Updated' }, { key: 'published', label: 'Published' },
  { key: 'title', label: 'Title' }, { key: 'views', label: 'Views' }, { key: 'reading', label: 'Read time' },
]

/**
 * Advanced Search & Content Discovery (Phase 2, Feature 8).
 * Client-side instant search / faceted filtering / sorting over the loaded
 * article rows, saved filter presets, multi-select and bulk actions (publish /
 * draft / archive / delete / add category / add tag / assign author / export).
 * Bulk mutations hit /api/admin/articles/bulk then refresh the server data.
 */
export function ArticleBrowser({
  rows, categories, tags, authors,
}: {
  rows: SearchableArticle[]
  categories: Opt[]
  tags: Opt[]
  authors: Opt[]
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [presets, setPresets] = useState<SavedFilter[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => { setPresets(loadSavedFilters()) }, [])
  useEffect(() => { setPage(1) }, [filters])

  const facets = useMemo(() => computeFacets(rows), [rows])
  const filtered = useMemo(() => searchArticles(rows, filters), [rows, filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const patch = (p: Partial<SearchFilters>) => setFilters(f => ({ ...f, ...p }))
  const toggleIn = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])

  const allPageSelected = pageRows.length > 0 && pageRows.every(r => selected.has(r.id))
  const toggleSelectPage = () => setSelected(s => {
    const next = new Set(s)
    if (allPageSelected) pageRows.forEach(r => next.delete(r.id))
    else pageRows.forEach(r => next.add(r.id))
    return next
  })
  const toggleRow = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAllFiltered = () => setSelected(new Set(filtered.map(r => r.id)))

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
      else { setSelected(new Set()); router.refresh() }
    } catch { window.alert('Network error') }
    setBusy(false)
  }

  function exportCsv() {
    const chosen = selected.size ? filtered.filter(r => selected.has(r.id)) : filtered
    const blob = new Blob([toCsv(chosen)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `articles-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function applyPreset(p: SavedFilter) { setFilters(p.filters) }
  function saveCurrent() {
    const name = window.prompt('Name this filter preset')
    if (name?.trim()) setPresets(saveFilter(name.trim(), filters))
  }

  return (
    <div>
      {/* ── Search + controls ── */}
      <div className="ab-bar">
        <div className="ab-search">
          <Search size={15} aria-hidden />
          <input
            value={filters.query}
            onChange={e => patch({ query: e.target.value })}
            placeholder="Search title, slug, author, category, tag…"
            aria-label="Search articles"
          />
          {filters.query && <button className="ab-x" onClick={() => patch({ query: '' })} aria-label="Clear search"><X size={13} /></button>}
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
          <SlidersHorizontal size={14} /> Filters{isFilterActive(filters) ? ' •' : ''}
        </button>
        <button className="ab-btn" onClick={exportCsv} title="Export current results to CSV"><Download size={14} /> Export</button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="ab-filters">
          <FacetRow label="Status" facets={facets.statuses} selected={filters.statuses} onToggle={v => patch({ statuses: toggleIn(filters.statuses, v as SearchFilters['statuses'][number]) })} />
          <FacetRow label="Type" facets={facets.types} selected={filters.types} onToggle={v => patch({ types: toggleIn(filters.types, v as SearchFilters['types'][number]) })} />
          <FacetRow label="Category" facets={facets.categories} selected={filters.categories} onToggle={v => patch({ categories: toggleIn(filters.categories, v) })} />
          <FacetRow label="Tag" facets={facets.tags} selected={filters.tags} onToggle={v => patch({ tags: toggleIn(filters.tags, v) })} />
          <FacetRow label="Author" facets={facets.authors.filter(a => a.value)} selected={filters.authors} onToggle={v => patch({ authors: toggleIn(filters.authors, v) })} />

          <div className="ab-frow">
            <span className="ab-flabel">Metrics</span>
            <NumRange label="Views" min={filters.viewsMin} max={filters.viewsMax} onMin={v => patch({ viewsMin: v })} onMax={v => patch({ viewsMax: v })} />
            <NumRange label="Read min" min={filters.readingMin} max={filters.readingMax} onMin={v => patch({ readingMin: v })} onMax={v => patch({ readingMax: v })} />
            <label className="ab-check"><input type="checkbox" checked={filters.featuredOnly} onChange={e => patch({ featuredOnly: e.target.checked })} /> Featured only</label>
          </div>
          <div className="ab-frow">
            <span className="ab-flabel">Date</span>
            <input className="ab-date" type="date" value={filters.dateFrom || ''} onChange={e => patch({ dateFrom: e.target.value || null })} aria-label="From date" />
            <span style={{ color: 'rgba(var(--ink),0.4)' }}>→</span>
            <input className="ab-date" type="date" value={filters.dateTo || ''} onChange={e => patch({ dateTo: e.target.value || null })} aria-label="To date" />
            {isFilterActive(filters) && <button className="ab-clear" onClick={() => setFilters(emptyFilters())}>Clear all</button>}
          </div>

          {/* Saved presets */}
          <div className="ab-frow">
            <span className="ab-flabel"><Bookmark size={12} aria-hidden /> Presets</span>
            {presets.map(p => (
              <span key={p.id} className="ab-preset">
                <button onClick={() => applyPreset(p)}>{p.name}</button>
                <button className="ab-preset-x" onClick={() => setPresets(removeSavedFilter(p.id))} aria-label={`Delete preset ${p.name}`}><X size={11} /></button>
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
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {filtered.length > 0 && <button className="ab-selectall" onClick={selectAllFiltered}>Select all {filtered.length}</button>}
      </p>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="ab-empty">No articles match your search.</div>
      ) : (
        <div className="ab-table">
          <div className="ab-thead">
            <input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage} aria-label="Select page" />
            <span>Article</span><span>Type</span><span>Status</span><span>Views</span><span></span>
          </div>
          {pageRows.map(a => (
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="ab-pager">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}

function FacetRow({ label, facets, selected, onToggle }: {
  label: string; facets: { value: string; count: number }[]; selected: string[]; onToggle: (v: string) => void
}) {
  if (facets.length === 0) return null
  return (
    <div className="ab-frow">
      <span className="ab-flabel">{label}</span>
      {facets.map(f => (
        <button key={f.value} className={`ab-chip${selected.includes(f.value) ? ' is-on' : ''}`} onClick={() => onToggle(f.value)}>
          {f.value || '—'} <span className="ab-chip-n">{f.count}</span>
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
