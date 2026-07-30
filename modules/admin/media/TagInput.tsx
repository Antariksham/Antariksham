'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { normalizeTags, MAX_TAGS } from './mediaNaming'

// Tag chips with autocomplete over tags already in the library. Suggesting what
// exists is what keeps the vocabulary converging — without it you end up with
// isro / ISRO / Isro as three separate filters.
//
// The half-typed draft is owned by the PARENT, not this component. Typing "mars"
// and clicking Upload without pressing Enter used to throw the tag away, and
// committing it on blur only turns that into a race with the click handler.
// Hoisting it means the submitting code can always merge whatever is on screen.

interface Props {
  value:        string[]
  draft:        string
  onChange:     (tags: string[]) => void
  onDraftChange: (draft: string) => void
  placeholder?: string
  autoFocus?:   boolean
}

interface Suggestion { tag: string; uses: number }

export function TagInput({ value, draft, onChange, onDraftChange, placeholder, autoFocus }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const term = draft.trim()
    if (!term) { setSuggestions([]); return }

    const id = ++requestId.current
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/admin/media/tags?prefix=${encodeURIComponent(term)}`)
        const data = await res.json()
        if (id !== requestId.current) return
        setSuggestions((data.tags || []).filter((s: Suggestion) => !value.includes(s.tag)))
      } catch {
        if (id === requestId.current) setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [draft, value])

  function add(raw: string) {
    onChange(normalizeTags([...value, raw]))
    onDraftChange('')
    setSuggestions([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (draft.trim()) { e.preventDefault(); add(draft) }
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const atLimit = value.length >= MAX_TAGS

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center',
          padding: '6px 8px', minHeight: '36px',
          background: 'rgba(var(--ink),0.04)',
          border: '1px solid rgba(var(--ink),0.12)', borderRadius: '7px',
        }}
      >
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 6px 2px 8px', borderRadius: '5px',
              background: 'rgba(var(--accent-rgb),0.12)',
              border: '1px solid rgba(var(--accent-rgb),0.28)',
              color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '12px',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(t => t !== tag))}
              aria-label={`Remove tag ${tag}`}
              style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          value={draft}
          autoFocus={autoFocus}
          disabled={atLimit}
          onChange={e => { onDraftChange(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          // Turn the draft into a chip when focus leaves, so what is on screen
          // matches what will be saved. Correctness does not depend on this
          // firing — the parent merges the draft on submit either way.
          onBlur={() => {
            const pending = draft.trim()
            setTimeout(() => {
              setOpen(false)
              if (pending) add(pending)
            }, 120)
          }}
          placeholder={atLimit ? `Tag limit reached (${MAX_TAGS})` : (placeholder || 'Add tags…')}
          style={{
            flex: 1, minWidth: '110px', padding: '3px 2px',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '14px',
          }}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '7px', overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
          }}
        >
          {suggestions.map(s => (
            <button
              key={s.tag}
              type="button"
              onMouseDown={e => { e.preventDefault(); add(s.tag) }}
              style={{
                display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 11px', background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(var(--ink),0.88)', fontFamily: 'var(--font-sans)', fontSize: '14px',
                textAlign: 'left',
              }}
            >
              <span>{s.tag}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.5)' }}>
                {s.uses}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
