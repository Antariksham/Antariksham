'use client'

import { useState } from 'react'
import { FileArchive } from 'lucide-react'
import type { MediaItem } from './types'

// ── Shared presentational grid + card. Reused by every provider panel. ────────

interface GridProps {
  items:        MediaItem[]
  loading:      boolean
  error:        string | null
  pickerMode?:  boolean
  deletingId:   string | null
  onPick?:      (item: MediaItem) => void
  onDelete:     (item: MediaItem) => void
  emptyLabel?:  string
  // Keyset pagination — the grid holds one page at a time and asks for the
  // next, so library size no longer drives DOM size or payload size.
  hasMore?:     boolean
  loadingMore?: boolean
  onLoadMore?:  () => void
  // Search spans every bucket, so results need to say which one they came from.
  showBucket?:  boolean
  /** Opens the detail drawer. Without it, cards are not clickable. */
  onOpenDetails?: (item: MediaItem) => void
}

export function MediaGrid({
  items, loading, error, pickerMode, deletingId, onPick, onDelete, emptyLabel,
  hasMore, loadingMore, onLoadMore, showBucket, onOpenDetails,
}: GridProps) {
  if (error) {
    return (
      <div style={{ padding: '12px 16px', background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--red)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {items.map(item => (
          <MediaCard
            key={`${item.provider}-${item.id}`}
            item={item}
            pickerMode={pickerMode}
            deleting={deletingId === item.id}
            onPick={onPick}
            onDelete={onDelete}
            showBucket={showBucket}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          style={{
            alignSelf: 'center', padding: '9px 26px', borderRadius: '7px',
            background: 'rgba(var(--ink),0.04)',
            border: '1px solid rgba(var(--ink),0.12)',
            color: loadingMore ? 'rgba(var(--ink),0.45)' : 'rgba(var(--ink),0.85)',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loadingMore ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          }}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
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
  item, pickerMode, deleting, onPick, onDelete, showBucket, onOpenDetails,
}: {
  item: MediaItem
  pickerMode?: boolean
  deleting: boolean
  onPick?: (item: MediaItem) => void
  onDelete: (item: MediaItem) => void
  showBucket?: boolean
  onOpenDetails?: (item: MediaItem) => void
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
      {/* Preview — the whole thing opens the detail drawer. */}
      <div
        onClick={onOpenDetails ? () => onOpenDetails(item) : undefined}
        role={onOpenDetails ? 'button' : undefined}
        tabIndex={onOpenDetails ? 0 : undefined}
        onKeyDown={onOpenDetails ? e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetails(item) }
        } : undefined}
        title={onOpenDetails ? 'Open details' : undefined}
        style={{
          width: '100%', aspectRatio: '16/10', background: 'var(--surface)',
          overflow: 'hidden', position: 'relative', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: onOpenDetails ? 'pointer' : 'default',
        }}
      >
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

        {/* Hover affordance — the click target is not otherwise discoverable. */}
        {onOpenDetails && hovered && (
          <span style={{
            position: 'absolute', bottom: '6px', right: '6px',
            padding: '2px 7px', borderRadius: '4px',
            background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.92)',
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Details
          </span>
        )}
      </div>

      {/* Info + actions */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          onClick={onOpenDetails ? () => onOpenDetails(item) : undefined}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '14px',
            color: 'rgba(var(--ink),0.8)', overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            cursor: onOpenDetails ? 'pointer' : 'default',
          }}
        >
          {item.name}
        </div>

        {!item.altText && item.kind === 'image' && (
          <span
            title="No alt text — open details to add one"
            style={{
              alignSelf: 'flex-start', padding: '1px 6px', borderRadius: '4px',
              background: 'rgba(var(--gold-rgb),0.12)',
              border: '1px solid rgba(var(--gold-rgb),0.3)',
              color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '10px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            No alt
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)' }}>
            {formatBytes(item.sizeBytes)}
          </span>
          {showBucket && item.bucket && (
            <span style={{
              padding: '1px 6px', borderRadius: '4px',
              background: 'rgba(var(--ink),0.07)', border: '1px solid rgba(var(--ink),0.1)',
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'rgba(var(--ink),0.6)', whiteSpace: 'nowrap',
            }}>
              {item.bucket.replace('-images', '')}
            </span>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                padding: '1px 5px', borderRadius: '4px',
                background: 'rgba(var(--accent-rgb),0.1)',
                color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '11px',
              }}>
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)' }}>
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

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
              border: '1px solid rgba(var(--red-rgb),0.2)', background: 'transparent',
              color: deleting ? 'rgba(var(--red-rgb),0.3)' : 'rgba(var(--red-rgb),0.6)',
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
    ? { border: 'var(--accent)', bg: 'rgba(var(--accent-rgb),0.12)', fg: 'var(--accent)' }
    : kind === 'green'
    ? { border: 'var(--green)', bg: 'rgba(var(--green-rgb),0.1)', fg: 'var(--green)' }
    : { border: 'rgba(var(--ink),0.12)', bg: 'transparent', fg: 'rgba(var(--ink),0.72)' }
  return {
    flex: 1, fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em',
    textTransform: 'uppercase', padding: '5px 0', borderRadius: '5px',
    border: `1px solid ${c.border}`, background: c.bg, color: c.fg,
    cursor: 'pointer', transition: 'all 0.2s',
  }
}
