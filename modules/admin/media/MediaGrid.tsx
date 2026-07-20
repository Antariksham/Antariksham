'use client'

import { useState } from 'react'
import { FileArchive } from 'lucide-react'
import type { MediaItem } from './types'

// ── Shared presentational grid + card. Reused by every provider panel. ────────

interface GridProps {
  items:       MediaItem[]
  loading:     boolean
  error:       string | null
  pickerMode?: boolean
  deletingId:  string | null
  onPick?:     (item: MediaItem) => void
  onDelete:    (item: MediaItem) => void
  emptyLabel?: string
}

export function MediaGrid({
  items, loading, error, pickerMode, deletingId, onPick, onDelete, emptyLabel,
}: GridProps) {
  if (error) {
    return (
      <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--red)' }}>
        {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.72)' }}>
        Loading…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>🖼️</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.72)' }}>
          {emptyLabel || 'No images yet — upload your first one above'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
      {items.map(item => (
        <MediaCard
          key={`${item.provider}-${item.id}`}
          item={item}
          pickerMode={pickerMode}
          deleting={deletingId === item.id}
          onPick={onPick}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaCard({
  item, pickerMode, deleting, onPick, onDelete,
}: {
  item: MediaItem
  pickerMode?: boolean
  deleting: boolean
  onPick?: (item: MediaItem) => void
  onDelete: (item: MediaItem) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [copied,  setCopied]  = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.url)
    } catch {
      const el = document.createElement('textarea')
      el.value = item.url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(var(--ink),0.03)',
        border: `1px solid ${hovered ? 'rgba(var(--ink),0.16)' : 'rgba(var(--ink),0.08)'}`,
        borderRadius: '10px', overflow: 'hidden',
        transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Preview */}
      <div style={{ width: '100%', aspectRatio: '16/10', background: 'var(--surface)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.kind === 'image' ? (
          <img
            src={item.thumbUrl || item.url}
            alt={item.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <FileArchive size={30} style={{ color: 'rgba(var(--ink),0.4)' }} />
        )}
      </div>

      {/* Info + actions */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.8)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)' }}>
          {formatBytes(item.sizeBytes)}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          {pickerMode ? (
            <button onClick={() => onPick?.(item)} style={actionStyle('accent')}>Use this</button>
          ) : (
            <button onClick={copy} style={actionStyle(copied ? 'green' : 'muted')}>
              {copied ? '✓ Copied' : 'Copy URL'}
            </button>
          )}
          <button
            onClick={() => onDelete(item)}
            disabled={deleting}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '5px 8px', borderRadius: '5px',
              border: '1px solid rgba(231,76,60,0.2)', background: 'transparent',
              color: deleting ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.6)',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? '…' : 'Del'}
          </button>
        </div>
      </div>
    </div>
  )
}

function actionStyle(kind: 'accent' | 'green' | 'muted'): React.CSSProperties {
  const c = kind === 'accent'
    ? { border: 'var(--accent)', bg: 'rgba(79,142,247,0.12)', fg: 'var(--accent)' }
    : kind === 'green'
    ? { border: 'var(--green)', bg: 'rgba(46,204,113,0.1)', fg: 'var(--green)' }
    : { border: 'rgba(var(--ink),0.12)', bg: 'transparent', fg: 'rgba(var(--ink),0.72)' }
  return {
    flex: 1, fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em',
    textTransform: 'uppercase', padding: '5px 0', borderRadius: '5px',
    border: `1px solid ${c.border}`, background: c.bg, color: c.fg,
    cursor: 'pointer', transition: 'all 0.2s',
  }
}
