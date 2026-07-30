'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { TagOption } from '@/modules/admin/services/adminArticles'
import { normalizeTagName, tagSlug, MAX_TAG_NAME_LENGTH } from './tagNames'

/**
 * The article editor's Tags field: type to filter the existing vocabulary,
 * press Enter (or hit Create) to mint a tag that doesn't exist yet.
 *
 * Filtering and creating share one input on purpose. Two controls would invite
 * an author to create a tag that already exists under a slightly different
 * spelling; here the matches are on screen while they type, and the Create
 * button only appears once nothing in the list keys to the same slug.
 */

interface Props {
  tags:        TagOption[]
  selectedIds: string[]
  onToggle:    (id: string) => void
  /** A tag that now exists server-side — merge it into the known list. */
  onCreated:   (tag: TagOption) => void
}

export function TagPicker({ tags, selectedIds, onToggle, onCreated }: Props) {
  const [query, setQuery] = useState('')
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const typed = normalizeTagName(query)
  const slug  = tagSlug(typed)

  // An existing tag keying to the same slug — Enter should select it, not try
  // to create a duplicate the API would hand straight back.
  const exact = slug ? tags.find(t => t.slug === slug) : undefined

  // Selected tags stay visible while filtering. The filter exists to find tags
  // you haven't picked yet, and hiding the ones you have reads as losing them.
  const visible = useMemo(() => {
    const q = typed.toLowerCase()
    const matches = q
      ? tags.filter(t =>
          selected.has(t.id) ||
          t.name.toLowerCase().includes(q) ||
          (slug ? t.slug.includes(slug) : false))
      : tags
    // Stable sort, so the server's alphabetical order survives inside each group.
    return [...matches].sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)))
  }, [tags, typed, slug, selected])

  async function commit() {
    if (!slug || busy) return

    // Already in the vocabulary: just select it and clear the box.
    if (exact) {
      if (!selected.has(exact.id)) onToggle(exact.id)
      setQuery('')
      setError('')
      return
    }

    setBusy(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/tags', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: typed }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.tag) {
        setError(data?.error || 'Could not create that tag.')
        return
      }

      // The response may be an existing row (someone else created it first, or
      // this list is stale), so merge before selecting and never double-toggle.
      onCreated(data.tag)
      if (!selected.has(data.tag.id)) onToggle(data.tag.id)
      setQuery('')
    } catch {
      setError('Could not reach the server. Check your connection and retry.')
    } finally {
      setBusy(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setError('')
    }
  }

  const canCreate = Boolean(slug) && !exact

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_TAG_NAME_LENGTH}
          aria-label="Filter tags, or type a new tag name"
          placeholder="Filter or add a tag…"
          style={{
            flex: 1, minWidth: 0,
            padding:      '7px 10px',
            background:   'var(--black)',
            border:       '1px solid var(--border)',
            borderRadius: '6px',
            color:        'var(--white)',
            fontFamily:   'var(--font-sans)',
            fontSize:     '13px',
            outline:      'none',
            boxSizing:    'border-box',
          }}
        />
        {canCreate && (
          <button
            type="button"
            onClick={commit}
            disabled={busy}
            title={`Create the tag “${typed}”`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              flexShrink: 0, padding: '0 10px', borderRadius: '6px',
              cursor: busy ? 'wait' : 'pointer',
              background: 'rgba(var(--gold-rgb),0.14)',
              border: '1px solid rgba(var(--gold-rgb),0.45)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-mono)', fontSize: '12px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Plus size={12} />
            {busy ? 'Adding…' : 'Create'}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '8px', padding: '6px 9px', borderRadius: '6px',
            background: 'rgba(var(--red-rgb),0.08)',
            border: '1px solid rgba(var(--red-rgb),0.3)',
            color: 'var(--red)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.04em',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
        {visible.map(tag => {
          const active = selected.has(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              aria-pressed={active}
              style={{
                padding: '3px 9px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '13px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: active ? 'rgba(var(--gold-rgb),0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(var(--gold-rgb),0.4)' : 'var(--border)'}`,
                color: active ? 'var(--gold)' : 'rgba(var(--ink),0.62)',
                transition: 'all 0.15s',
              }}
            >
              {tag.name}
            </button>
          )
        })}

        {visible.length === 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.5)', letterSpacing: '0.04em' }}>
            {tags.length === 0
              ? 'No tags yet — type one above to create it.'
              : canCreate
                ? 'No match. Create it to add it to the vocabulary.'
                : 'No match.'}
          </span>
        )}
      </div>
    </div>
  )
}
