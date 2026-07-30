'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Check, Copy, ExternalLink, Trash2, X } from 'lucide-react'
import {
  MediaMetaFields, metaFromAsset, isMetaDirty, resolveTags, hasAlt,
  labelStyle, primaryButton, secondaryButton, type MediaMeta,
} from './MediaMetaFields'
import type { MediaItem } from './types'

/**
 * Per-asset detail drawer (Phase 5 — see docs/MEDIA_LIBRARY_ARCHITECTURE.md).
 *
 * Until now metadata could only be set at the moment of upload, which left
 * everything from before Phase 4 stuck with a filename-derived title and no way
 * to fix it. This is that way: open any asset, correct the title, describe it,
 * tag it, save.
 *
 * Alt text is *required* while uploading but only *warned about* here. Blocking
 * a title fix because a different field is incomplete would punish the person
 * improving the record — the opposite of what this is for.
 */

interface Props {
  item:      MediaItem
  onClose:   () => void
  /** Merge the saved fields back into the grid without refetching the page. */
  onSaved:   (id: string, patch: Partial<MediaItem>) => void
  onDelete?: (item: MediaItem) => void
  deleting?: boolean
}

export function MediaDetailDrawer({ item, onClose, onSaved, onDelete, deleting }: Props) {
  const initial = useMemo(() => metaFromAsset({
    title:   item.name,
    altText: item.altText,
    caption: item.caption,
    credit:  item.credit,
    tags:    item.tags,
  }), [item])

  const [meta,   setMeta]   = useState<MediaMeta>(initial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Switching cards while the drawer is open reseeds the form.
  useEffect(() => { setMeta(initial); setSaved(false); setError(null) }, [initial])

  const dirty      = isMetaDirty(initial, meta)
  const savedTags  = resolveTags(meta)
  const titleError = !meta.title.trim()

  function requestClose() {
    if (dirty && !confirm('Discard your unsaved changes to this image?')) return
    onClose()
  }

  // Escape closes, which is what a drawer should do.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function save() {
    if (titleError || saving) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:   meta.title.trim(),
          altText: meta.decorative ? '' : meta.altText.trim(),
          caption: meta.caption.trim(),
          credit:  meta.credit.trim(),
          tags:    savedTags,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')

      onSaved(item.id, {
        name:    meta.title.trim(),
        altText: meta.decorative ? '' : meta.altText.trim(),
        caption: meta.caption.trim() || null,
        credit:  meta.credit.trim() || null,
        tags:    savedTags,
      })
      setSaved(true)
    } catch (e: any) {
      setError(e.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function copyUrl() {
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
      style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget && !saving) requestClose() }}
    >
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${item.name}`}
        style={{
          position: 'relative', width: '100%', maxWidth: '440px', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'var(--black)', borderLeft: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600, color: 'var(--white)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {item.name}
          </h2>
          <button
            type="button" onClick={requestClose} disabled={saving} aria-label="Close details"
            style={{ display: 'flex', flexShrink: 0, background: 'none', border: 'none', padding: '4px', cursor: saving ? 'not-allowed' : 'pointer', color: 'rgba(var(--ink),0.6)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Preview. flexShrink:0 is required — as a flex child in this
              scrolling column, the aspect-ratio box otherwise collapses to
              zero height and the image vanishes entirely. */}
          <div style={{ width: '100%', flexShrink: 0, aspectRatio: '16/10', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbUrl || item.url}
              alt={item.altText || ''}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          <MediaMetaFields
            value={meta}
            onChange={next => { setMeta(next); setSaved(false) }}
            disabled={saving}
            showCaption
            altRequired={false}
            tagLabel="Tags"
          />

          {!hasAlt(meta) && (
            <Note tone="warn">
              No alt text yet — worth adding for accessibility and SEO, but you can save without it.
            </Note>
          )}
          {error && <Note tone="error">{error}</Note>}
          {saved && !dirty && <Note tone="ok">Saved</Note>}

          {/* Read-only facts */}
          <div>
            <div style={labelStyle}>File</div>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <Fact label="Dimensions" value={item.width && item.height ? `${item.width} × ${item.height}` : '—'} />
              <Fact label="Size"       value={formatBytes(item.sizeBytes)} />
              <Fact label="Type"       value={item.mimeType || '—'} />
              <Fact label="Provider"   value={item.provider} />
              {item.bucket && <Fact label="Bucket" value={item.bucket} />}
              <Fact label="Added"      value={formatDate(item.createdAt)} />
              {item.storageKey && <Fact label="Key" value={item.storageKey} wrap />}
            </dl>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={copyUrl} style={{ ...secondaryButton(false), display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <a
              href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ ...secondaryButton(false), display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Open
            </a>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={deleting || saving}
                style={{
                  padding: '8px 16px', borderRadius: '7px',
                  background: 'transparent', border: '1px solid rgba(var(--red-rgb),0.3)',
                  color: deleting ? 'rgba(var(--red-rgb),0.4)' : 'var(--red)',
                  fontFamily: 'var(--font-mono)', fontSize: '13px',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: deleting || saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Trash2 size={13} /> {deleting ? '…' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.6)' }}>
            {titleError ? <span style={{ color: 'var(--red)' }}>A title is required</span>
              : dirty ? 'Unsaved changes'
              : 'Up to date'}
          </span>
          <button type="button" onClick={requestClose} disabled={saving} style={secondaryButton(saving)}>
            Close
          </button>
          <button
            type="button" onClick={save}
            disabled={saving || titleError || !dirty}
            style={primaryButton(saving || titleError || !dirty)}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </aside>
    </div>
  )
}

// ── Bits ─────────────────────────────────────────────────────────────────────

function Fact({ label, value, wrap }: { label: string; value: string; wrap?: boolean }) {
  return (
    <>
      <dt style={{ color: 'rgba(var(--ink),0.5)', whiteSpace: 'nowrap' }}>{label}</dt>
      <dd style={{
        margin: 0, color: 'rgba(var(--ink),0.85)',
        overflowWrap: wrap ? 'anywhere' : undefined,
        overflow: wrap ? undefined : 'hidden',
        whiteSpace: wrap ? 'normal' : 'nowrap',
        textOverflow: wrap ? undefined : 'ellipsis',
      }}>
        {value}
      </dd>
    </>
  )
}

function Note({ tone, children }: { tone: 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const color = tone === 'error' ? 'var(--red)' : tone === 'ok' ? 'var(--green)' : 'var(--gold)'
  const Icon  = tone === 'ok' ? Check : AlertTriangle
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '12px', color }}>
      <Icon size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
