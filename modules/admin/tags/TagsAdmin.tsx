'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, AlertCircle, Tag as TagIcon, GitMerge, Check,
} from 'lucide-react'
import type { AdminTagRow } from '@/modules/admin/services/adminTags'
import { normalizeTagName, tagSlug, MAX_TAG_NAME_LENGTH } from './tagNames'

/**
 * The Tags screen — the other half of type-to-create.
 *
 * Because the article editor mints a tag the moment someone types a new name, a
 * typo is a row. This is where the vocabulary gets maintained: rename, merge one
 * tag into another (carrying its articles over), and delete. The article count
 * per tag is the useful signal — a tag on 0 articles is almost always the
 * mistake you came here to clean up.
 */

type SortKey = 'name' | 'uses'

export function TagsAdmin() {
  const [tags,    setTags]    = useState<AdminTagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [query,   setQuery]   = useState('')
  const [sort,    setSort]    = useState<SortKey>('name')

  // Row-level transient state, keyed by the row it belongs to.
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [draftName,    setDraftName]    = useState('')
  const [rowError,     setRowError]     = useState('')
  const [busyId,       setBusyId]       = useState<string | null>(null)
  const [mergeSource,  setMergeSource]  = useState<AdminTagRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminTagRow | null>(null)
  const [notice,       setNotice]       = useState('')

  // Inline create — the article editor is the main way tags appear, but seeding
  // the vocabulary before writing shouldn't mean opening an article.
  const [showNew,     setShowNew]     = useState(false)
  const [newName,     setNewName]     = useState('')
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')

  // ── Fetch ────────────────────────────────────────────────

  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/tags', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setTags(json.tags || [])
    } catch {
      setError('Could not load tags. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTags() }, [fetchTags])

  const visible = useMemo(() => {
    const q    = query.trim().toLowerCase()
    const slug = tagSlug(query)
    const rows = q
      ? tags.filter(t => t.name.toLowerCase().includes(q) || (slug ? t.slug.includes(slug) : false))
      : tags
    return [...rows].sort((a, b) => sort === 'uses'
      ? b.articleCount - a.articleCount || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name))
  }, [tags, query, sort])

  const unusedCount = useMemo(() => tags.filter(t => t.articleCount === 0).length, [tags])

  // ── Create ───────────────────────────────────────────────

  async function handleCreate() {
    const name = normalizeTagName(newName)
    if (!name) { setCreateError('Enter a tag name with at least one letter or number.'); return }

    setCreating(true)
    setCreateError('')
    setError('')
    try {
      const res  = await fetch('/api/admin/tags', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setCreateError(data?.error || 'Failed to create tag.'); return }

      // The endpoint is resolve-or-create, so an existing slug comes back
      // instead of a duplicate — say which happened rather than implying a new
      // tag appeared.
      setNotice(data.created ? `Created “${data.tag.name}”.` : `“${data.tag.name}” already existed.`)
      setNewName('')
      setShowNew(false)
      await fetchTags()
    } catch {
      setCreateError('Something went wrong. Try again.')
    } finally {
      setCreating(false)
    }
  }

  // ── Rename ───────────────────────────────────────────────

  function startEdit(row: AdminTagRow) {
    setEditingId(row.id)
    setDraftName(row.name)
    setRowError('')
    setNotice('')
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName('')
    setRowError('')
  }

  async function saveEdit(row: AdminTagRow) {
    const name = normalizeTagName(draftName)
    if (!name) { setRowError('Enter a tag name with at least one letter or number.'); return }
    if (name === row.name) { cancelEdit(); return }

    setBusyId(row.id)
    setRowError('')
    try {
      const res  = await fetch(`/api/admin/tags?id=${row.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setRowError(data?.error || 'Failed to rename tag.'); return }
      cancelEdit()
      setNotice(`Renamed to “${data.tag.name}”.`)
      await fetchTags()
    } catch {
      setRowError('Something went wrong. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  // ── Merge ────────────────────────────────────────────────

  async function handleMerge(targetId: string) {
    if (!mergeSource) return
    setBusyId(mergeSource.id)
    setError('')
    try {
      const res  = await fetch('/api/admin/tags/merge', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sourceId: mergeSource.id, targetId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setError(data?.error || 'Failed to merge tags.'); return }

      const target = tags.find(t => t.id === targetId)
      setNotice(
        `Merged “${mergeSource.name}” into “${target?.name ?? 'the target tag'}” — ` +
        `${data.moved} article${data.moved === 1 ? '' : 's'} moved` +
        (data.dropped > 0 ? `, ${data.dropped} already tagged.` : '.'))
      setMergeSource(null)
      await fetchTags()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusyId(null)
    }
  }

  // ── Delete ───────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError('')
    try {
      const res = await fetch(`/api/admin/tags?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { setError('Failed to delete tag.'); return }
      setNotice(`Deleted “${deleteTarget.name}”.`)
      setDeleteTarget(null)
      await fetchTags()
    } catch {
      setError('Something went wrong.')
    } finally {
      setBusyId(null)
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
              Tags
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '6px 0 0' }}>
              {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
              {unusedCount > 0 && ` · ${unusedCount} unused`}
            </p>
          </div>
          <button
            onClick={() => { setShowNew(v => !v); setCreateError(''); setNotice('') }}
            aria-expanded={showNew}
            style={primaryBtn}
          >
            {showNew ? <X size={13} /> : <Plus size={13} />}
            {showNew ? 'Cancel' : 'New Tag'}
          </button>
        </div>

        {/* Inline create */}
        {showNew && (
          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <label htmlFor="new-tag-name" style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
              Tag name
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                id="new-tag-name"
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter')  { e.preventDefault(); handleCreate() }
                  if (e.key === 'Escape') { e.preventDefault(); setShowNew(false); setNewName('') }
                }}
                maxLength={MAX_TAG_NAME_LENGTH}
                placeholder="e.g. Mars Sample Return"
                autoFocus
                style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
              />
              <button onClick={handleCreate} disabled={creating} style={footerBtn(true, creating)}>
                <Save size={12} />
                {creating ? 'Creating…' : 'Create Tag'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: createError ? 'var(--red)' : 'rgba(var(--ink),0.55)', letterSpacing: '0.04em' }}>
              {createError || `slug: ${tagSlug(newName) || '—'}`}
            </p>
          </div>
        )}

        {/* Error / notice */}
        {error && (
          <div role="alert" style={banner('red')}>
            <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" style={banner('accent')}>
            <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)' }}>{notice}</span>
          </div>
        )}

        {/* Filter + sort */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter tags…"
            aria-label="Filter tags"
            style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
          />
          <div role="group" aria-label="Sort tags" style={{ display: 'inline-flex', gap: '2px', background: 'rgba(var(--ink),0.04)', border: '1px solid var(--border)', padding: '3px', borderRadius: '8px' }}>
            {([{ key: 'name', label: 'Name' }, { key: 'uses', label: 'Most used' }] as const).map(o => (
              <button
                key={o.key}
                type="button"
                onClick={() => setSort(o.key)}
                aria-pressed={sort === o.key}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: sort === o.key ? 'var(--accent)' : 'transparent',
                  color:      sort === o.key ? 'var(--black)' : 'rgba(var(--ink),0.72)',
                  fontFamily: 'var(--font-mono)', fontSize: '12px',
                  letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '54px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.5 }} />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div style={{ padding: '48px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
            <TagIcon size={28} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              No tags yet
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)', marginTop: '6px', marginBottom: 0 }}>
              Tags are created as you write — type a new one in an article&rsquo;s Tags panel.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.6)', letterSpacing: '0.06em', margin: 0 }}>
            No tag matches “{query.trim()}”.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visible.map(row => {
              const editing = editingId === row.id
              const busy    = busyId === row.id
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                    alignItems: 'center', gap: '12px',
                    padding: '11px 14px',
                    background: 'var(--surface)',
                    border: `1px solid ${row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.28)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {/* Name / slug, or the rename field */}
                  {editing ? (
                    <div style={{ minWidth: 0 }}>
                      <input
                        value={draftName}
                        onChange={e => { setDraftName(e.target.value); setRowError('') }}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); saveEdit(row) }
                          if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                        }}
                        maxLength={MAX_TAG_NAME_LENGTH}
                        aria-label={`Rename ${row.name}`}
                        autoFocus
                        style={{ ...inputStyle, width: '100%' }}
                      />
                      <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: rowError ? 'var(--red)' : 'rgba(var(--ink),0.55)', letterSpacing: '0.04em' }}>
                        {rowError || `slug: ${tagSlug(draftName) || '—'}`}
                      </p>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)', lineHeight: 1.3, overflowWrap: 'anywhere' }}>
                        {row.name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.04em' }}>
                        {row.slug}
                      </div>
                    </div>
                  )}

                  {/* Usage count */}
                  <span
                    title={`Used on ${row.articleCount} article${row.articleCount === 1 ? '' : 's'}`}
                    style={{
                      padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
                      background: row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.12)' : 'rgba(var(--ink),0.05)',
                      border: `1px solid ${row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.35)' : 'var(--border)'}`,
                      color: row.articleCount === 0 ? 'var(--gold)' : 'rgba(var(--ink),0.72)',
                    }}
                  >
                    {row.articleCount === 0 ? 'unused' : `${row.articleCount}×`}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {editing ? (
                      <>
                        <IconBtn label="Save name" onClick={() => saveEdit(row)} disabled={busy} tone="accent">
                          <Save size={13} />
                        </IconBtn>
                        <IconBtn label="Cancel rename" onClick={cancelEdit} disabled={busy}>
                          <X size={13} />
                        </IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn label={`Rename ${row.name}`} onClick={() => startEdit(row)} disabled={busy}>
                          <Pencil size={13} />
                        </IconBtn>
                        <IconBtn
                          label={`Merge ${row.name} into another tag`}
                          onClick={() => { setMergeSource(row); setNotice('') }}
                          disabled={busy || tags.length < 2}
                        >
                          <GitMerge size={13} />
                        </IconBtn>
                        <IconBtn
                          label={`Delete ${row.name}`}
                          onClick={() => { setDeleteTarget(row); setNotice('') }}
                          disabled={busy}
                          tone="red"
                        >
                          <Trash2 size={13} />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info note */}
        <div style={{ padding: '12px 16px', background: 'rgba(var(--accent-rgb),0.04)', border: '1px solid rgba(var(--accent-rgb),0.12)', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
            Tags are created from an article&rsquo;s Tags panel as you write. Renaming updates the
            slug to match, so the tag keeps matching what authors type. Merging moves every article
            from one tag onto another and deletes the emptied tag — the way to fix two spellings of
            the same subject.
          </p>
        </div>

      </div>

      {/* Merge modal */}
      {mergeSource && (
        <MergeDialog
          source={mergeSource}
          candidates={tags.filter(t => t.id !== mergeSource.id)}
          busy={busyId === mergeSource.id}
          onCancel={() => setMergeSource(null)}
          onConfirm={handleMerge}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Backdrop onClose={() => setDeleteTarget(null)}>
          <div style={{ ...dialogBox, borderColor: 'rgba(var(--red-rgb),0.3)' }}>
            <h3 style={dialogTitle}>Delete tag?</h3>
            <p style={dialogBody}>
              <strong style={{ color: 'var(--white)' }}>{deleteTarget.name}</strong> will be
              permanently deleted{deleteTarget.articleCount > 0
                ? ` and removed from ${deleteTarget.articleCount} article${deleteTarget.articleCount === 1 ? '' : 's'}`
                : ''}. The articles themselves are not touched.
            </p>
            {deleteTarget.articleCount > 0 && (
              <p style={{ ...dialogBody, fontSize: '14px' }}>
                To keep those articles tagged, merge this tag into another one instead.
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={footerBtn(false)}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={busyId === deleteTarget.id}
                style={{
                  ...footerBtn(true, busyId === deleteTarget.id),
                  background: busyId === deleteTarget.id ? 'rgba(var(--red-rgb),0.5)' : 'var(--red)',
                  color: 'var(--white)',
                }}
              >
                <Trash2 size={12} />
                {busyId === deleteTarget.id ? 'Deleting…' : 'Delete Tag'}
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </>
  )
}

// ── Merge dialog ──────────────────────────────────────────────

function MergeDialog({
  source, candidates, busy, onCancel, onConfirm,
}: {
  source:     AdminTagRow
  candidates: AdminTagRow[]
  busy:       boolean
  onCancel:   () => void
  onConfirm:  (targetId: string) => void
}) {
  const [targetId, setTargetId] = useState('')
  const target = candidates.find(t => t.id === targetId)

  return (
    <Backdrop onClose={onCancel}>
      <div style={dialogBox}>
        <h3 style={dialogTitle}>Merge tag</h3>
        <p style={dialogBody}>
          Every article tagged <strong style={{ color: 'var(--white)' }}>{source.name}</strong>
          {' '}({source.articleCount === 0 ? 'unused' : `${source.articleCount} article${source.articleCount === 1 ? '' : 's'}`})
          {' '}will be tagged with the tag you pick, and{' '}
          <strong style={{ color: 'var(--white)' }}>{source.name}</strong> will be deleted.
          This cannot be undone.
        </p>

        <label style={{ display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
          Merge into
        </label>
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          autoFocus
          style={{ ...inputStyle, width: '100%', marginBottom: '20px', cursor: 'pointer' }}
        >
          <option value="">— Pick a tag —</option>
          {candidates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.articleCount}×)
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={footerBtn(false)}>Cancel</button>
          <button
            onClick={() => targetId && onConfirm(targetId)}
            disabled={busy || !targetId}
            style={footerBtn(true, busy || !targetId)}
          >
            <GitMerge size={12} />
            {busy ? 'Merging…' : target ? `Merge into ${target.name}` : 'Merge'}
          </button>
        </div>
      </div>
    </Backdrop>
  )
}

// ── Shared bits ───────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--modal-scrim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function IconBtn({
  children, label, onClick, disabled, tone,
}: {
  children: React.ReactNode
  label:    string
  onClick:  () => void
  disabled?: boolean
  tone?:    'accent' | 'red'
}) {
  const color = tone === 'red' ? 'var(--red)' : tone === 'accent' ? 'var(--accent)' : 'rgba(var(--ink),0.72)'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '6px',
        background: 'transparent', border: '1px solid var(--border)',
        color, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Style helpers ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding:      '9px 12px',
  background:   'var(--black)',
  border:       '1px solid var(--border)',
  borderRadius: '7px',
  color:        'var(--white)',
  fontFamily:   'var(--font-sans)',
  fontSize:     '14px',
  outline:      'none',
  boxSizing:    'border-box',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  padding: '9px 16px', borderRadius: '7px', border: 'none',
  background: 'var(--accent)', color: 'var(--black)',
  fontFamily: 'var(--font-mono)', fontSize: '13px',
  letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
}

function banner(tone: 'red' | 'accent'): React.CSSProperties {
  const rgb = tone === 'red' ? '--red-rgb' : '--accent-rgb'
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '8px',
    background: `rgba(var(${rgb}),0.08)`,
    border: `1px solid rgba(var(${rgb}),0.25)`,
  }
}

const dialogBox: React.CSSProperties = {
  background: 'var(--black)', border: '1px solid var(--border-hi)',
  borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%',
}

const dialogTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--white)', margin: '0 0 10px',
}

const dialogBody: React.CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: '15px',
  color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, margin: '0 0 20px',
}

function footerBtn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '7px',
    background: primary ? (disabled ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)') : 'transparent',
    border: primary ? 'none' : '1px solid var(--border)',
    color: primary ? 'var(--black)' : 'rgba(var(--ink),0.82)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
