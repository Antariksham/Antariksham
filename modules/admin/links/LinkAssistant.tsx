'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Search, Plus, Check, AlertTriangle, Waypoints } from 'lucide-react'
import {
  suggestLinks, searchTargets, extractInternalHrefs, findBrokenLinks,
  type LinkTarget, type LinkKind,
} from './internalLinks'

/**
 * Internal Linking Assistant — Phase 2, Feature 6.
 * A modal from the editor toolbar. It fetches the site's internal pages, ranks
 * the ones most related to the current draft (by title-token overlap with the
 * article text), lets the editor insert a link in one click (using the current
 * selection as anchor text when there is one), marks pages already linked (no
 * duplicates), and flags internal links in the draft that don't resolve
 * (broken links). SEO: stronger internal linking + fewer orphans.
 */
const KIND_LABEL: Record<LinkKind, string> = { article: 'Article', mission: 'Mission', learn: 'Learn', author: 'Author' }
const KIND_COLOR: Record<LinkKind, string> = { article: 'var(--accent)', mission: 'var(--gold)', learn: 'var(--green)', author: 'var(--purple)' }

export function LinkAssistant({
  getText, getHtml, onInsert, onClose,
}: {
  getText: () => string
  getHtml: () => string
  onInsert: (href: string, text: string) => void
  onClose: () => void
}) {
  const [targets, setTargets] = useState<LinkTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [linked, setLinked] = useState<Set<string>>(() => new Set(extractInternalHrefs(getHtml())))

  // Snapshot the draft text once, when the modal opens — suggestions should not
  // re-rank under the editor's cursor while they are being read. A lazy
  // `useState` initialiser, not `useMemo([])`: React treats a memo as a hint it
  // may discard, so a "compute once" that must actually happen once belongs in
  // state. It also drops the exhaustive-deps suppression this line used to
  // carry, which was written one line too low and so suppressed nothing.
  const [text] = useState(() => getText())

  useEffect(() => {
    let alive = true
    fetch('/api/admin/link-targets')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load pages')))
      .then(d => { if (alive) { setTargets(Array.isArray(d.targets) ? d.targets : []); setLoading(false) } })
      .catch(() => { if (alive) { setError('Could not load internal pages'); setLoading(false) } })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { alive = false; document.removeEventListener('keydown', onKey) }
  }, [onClose])

  const suggestions = useMemo(
    () => suggestLinks(text, targets, { linkedHrefs: Array.from(linked), limit: 20 }),
    [text, targets, linked])
  const searchResults = useMemo(
    () => (query.trim() ? searchTargets(query, targets, Array.from(linked)) : []),
    [query, targets, linked])
  const broken = useMemo(
    () => (targets.length ? findBrokenLinks(getHtml(), targets.map(t => t.href)) : []),
    [targets, linked]) // eslint-disable-line react-hooks/exhaustive-deps

  const insert = (t: LinkTarget) => {
    onInsert(t.href, t.title)
    setLinked(s => new Set(s).add(t.href))
  }

  const Row = ({ t, isLinked }: { t: LinkTarget; isLinked: boolean }) => (
    <li className="la-item">
      <span className="la-kind" style={{ color: KIND_COLOR[t.kind], borderColor: KIND_COLOR[t.kind] }}>{KIND_LABEL[t.kind]}</span>
      <span className="la-body">
        <span className="la-title">{t.title}</span>
        <span className="la-href">{t.href}</span>
      </span>
      {isLinked
        ? <span className="la-linked"><Check size={13} aria-hidden /> Linked</span>
        : <button type="button" className="la-add" onClick={() => insert(t)}><Plus size={13} /> Insert</button>}
    </li>
  )

  return (
    <div className="cite-modal" role="dialog" aria-modal="true" aria-label="Internal linking assistant">
      <div className="cite-scrim" onClick={onClose} />
      <div className="cite-panel" style={{ maxWidth: 560 }}>
        <div className="cite-head">
          <span className="cite-title"><Waypoints size={16} aria-hidden /> Internal Links</span>
          <button type="button" className="cite-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Broken links */}
          {broken.length > 0 && (
            <div className="la-broken">
              <span className="la-broken-title"><AlertTriangle size={13} aria-hidden /> {broken.length} broken internal link{broken.length > 1 ? 's' : ''}</span>
              <ul>{broken.map(h => <li key={h}><code>{h}</code></li>)}</ul>
              <p className="la-broken-hint">These link to pages that don’t exist. Fix or remove them.</p>
            </div>
          )}

          {/* Search */}
          <div className="ab-search" style={{ background: 'var(--surface)', flex: '0 0 auto' }}>
            <Search size={15} aria-hidden />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all pages to link…" aria-label="Search internal pages" />
            {query && <button className="ab-x" onClick={() => setQuery('')} aria-label="Clear"><X size={13} /></button>}
          </div>

          {loading && <p className="la-note">Loading internal pages…</p>}
          {error && <p className="la-note" style={{ color: 'var(--red)' }}>{error}</p>}

          {!loading && !error && (
            query.trim() ? (
              <ul className="la-list">
                {searchResults.length === 0 && <li className="la-note">No pages match “{query}”.</li>}
                {searchResults.map(t => <Row key={t.href} t={t} isLinked={t.linked} />)}
              </ul>
            ) : (
              <>
                <span className="la-section">Suggested for this article</span>
                <ul className="la-list">
                  {suggestions.length === 0 && <li className="la-note">No related pages found yet — write more, or search above.</li>}
                  {suggestions.map(s => <Row key={s.target.href} t={s.target} isLinked={false} />)}
                </ul>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
