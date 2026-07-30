'use client'

import { Search } from 'lucide-react'

// Shared search input for the provider panels. The query is sent to
// /api/admin/media and resolved in Postgres, so this box searches the whole
// library — not just the page currently on screen.

interface Action {
  label:     string
  title?:    string
  onClick:   () => void
  disabled?: boolean
}

interface Props {
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
  busy?:        boolean
  action?:      Action
}

export function MediaSearchBar({ value, onChange, placeholder, busy, action }: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search
          size={15}
          style={{
            position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
            color: busy ? 'var(--accent)' : 'rgba(var(--ink),0.45)', pointerEvents: 'none',
            transition: 'color 0.2s',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Search…'}
          style={{
            width: '100%', padding: '10px 14px 10px 36px',
            background: 'rgba(var(--ink),0.04)',
            border: '1px solid rgba(var(--ink),0.1)', borderRadius: '8px',
            color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '15px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.title}
          style={{
            flexShrink: 0, padding: '0 16px',
            background: 'rgba(var(--ink),0.05)',
            border: '1px solid rgba(var(--ink),0.12)', borderRadius: '8px',
            color: action.disabled ? 'rgba(var(--ink),0.45)' : 'rgba(var(--ink),0.85)',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
