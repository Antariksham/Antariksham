'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Check, X, Copy } from 'lucide-react'
import { TagInput } from './TagInput'
import { hashFile, readImageMeta, makeThumbnail, type ImageMeta } from './imageTools'
import { titleFromFilename, normalizeTags } from './mediaNaming'
import type { SupabaseBucket } from './types'

/**
 * Staging dialog shown between picking files and uploading them (Phase 4 — see
 * docs/MEDIA_LIBRARY_ARCHITECTURE.md).
 *
 * This is the step that makes the library searchable. Everything before it —
 * the index, the GIN indexes, the search functions — can only find words that
 * exist, and a camera filename like IMG_4471.jpg has none. Metadata entered
 * "later" is never entered, so it is asked for here, prefilled and cheap:
 * title from the filename, tags shared across the batch, alt text required
 * unless the image is explicitly decorative.
 *
 * While the editor types, each file is hashed and checked against the library,
 * so re-adding a photo that is already there costs one request rather than a
 * second copy.
 */

interface Props {
  files:    File[]
  bucket:   SupabaseBucket
  onCancel: () => void
  onDone:   (uploaded: number) => void
}

interface Duplicate {
  id:       string
  url:      string
  thumbUrl: string | null
  title:    string | null
}

interface Staged {
  file:      File
  previewUrl: string
  title:     string
  altText:   string
  decorative: boolean
  credit:    string
  tags:      string[]
  meta:      ImageMeta | null
  checksum:  string | null
  duplicate: Duplicate | null
  status:    'pending' | 'uploading' | 'done' | 'skipped' | 'error'
  error:     string | null
}

const LOW_RESOLUTION = 640

export function MediaUploadDialog({ files, bucket, onCancel, onDone }: Props) {
  const [items,     setItems]     = useState<Staged[]>([])
  const [sharedTags, setSharedTags] = useState<string[]>([])
  const [busy,      setBusy]      = useState(false)
  const [analysing, setAnalysing] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const objectUrls = useRef<string[]>([])

  // Stage the files: preview, dimensions, checksum, then one batched duplicate
  // lookup for the whole set.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const staged: Staged[] = []
      for (const file of files) {
        const previewUrl = URL.createObjectURL(file)
        objectUrls.current.push(previewUrl)
        const [meta, checksum] = await Promise.all([
          readImageMeta(file),
          hashFile(file).catch(() => null),
        ])
        staged.push({
          file, previewUrl,
          title:      titleFromFilename(file.name),
          altText:    '', decorative: false, credit: '',
          tags:       [],
          meta, checksum,
          duplicate:  null,
          status:     'pending', error: null,
        })
      }
      if (cancelled) return

      const checksums = staged.map(s => s.checksum).filter(Boolean) as string[]
      if (checksums.length) {
        try {
          const res  = await fetch('/api/admin/media/precheck', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ checksums }),
          })
          const data = await res.json()
          if (!cancelled && data.matches) {
            for (const item of staged) {
              if (item.checksum && data.matches[item.checksum]) {
                item.duplicate = data.matches[item.checksum]
                item.status    = 'skipped'
              }
            }
          }
        } catch {
          // Precheck is an optimisation — the upload route checks again anyway.
        }
      }

      if (!cancelled) { setItems(staged); setAnalysing(false) }
    })()

    return () => { cancelled = true }
  }, [files])

  // Release preview URLs on unmount.
  useEffect(() => () => { objectUrls.current.forEach(URL.revokeObjectURL) }, [])

  const update = useCallback((index: number, patch: Partial<Staged>) => {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }, [])

  const pending    = items.filter(i => i.status === 'pending')
  const duplicates = items.filter(i => i.status === 'skipped')
  const missingAlt = pending.filter(i => !i.decorative && !i.altText.trim())
  const missingTitle = pending.filter(i => !i.title.trim())
  const blocked    = missingAlt.length > 0 || missingTitle.length > 0

  async function upload() {
    if (blocked || busy) return
    setBusy(true); setError(null)
    let uploaded = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.status !== 'pending') continue

      update(i, { status: 'uploading', error: null })
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('title', item.title.trim())
        // A decorative image gets an explicitly empty alt, which is the correct
        // accessibility signal — not a missing one.
        fd.append('altText', item.decorative ? '' : item.altText.trim())
        if (item.credit.trim()) fd.append('credit', item.credit.trim())

        const tags = normalizeTags([...sharedTags, ...item.tags])
        if (tags.length) fd.append('tags', tags.join(','))

        if (item.meta) {
          fd.append('width',  String(item.meta.width))
          fd.append('height', String(item.meta.height))
        }

        const thumb = await makeThumbnail(item.file)
        if (thumb) fd.append('thumb', thumb, 'thumb.webp')

        const res  = await fetch(`/api/admin/media?bucket=${bucket}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        update(i, { status: data.duplicate ? 'skipped' : 'done' })
        if (!data.duplicate) uploaded++
      } catch (e: any) {
        update(i, { status: 'error', error: e.message || 'Upload failed' })
      }
    }

    setBusy(false)
    onDone(uploaded)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add images to the media library"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div
        style={{
          width: '100%', maxWidth: '760px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--black)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: 'var(--white)' }}>
                Add {files.length} image{files.length !== 1 ? 's' : ''}
              </h2>
              <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.65)' }}>
                A title and a couple of tags now is what makes these findable later.
              </p>
            </div>
            <button
              type="button" onClick={onCancel} disabled={busy} aria-label="Close"
              style={{ display: 'flex', background: 'none', border: 'none', padding: '4px', cursor: busy ? 'not-allowed' : 'pointer', color: 'rgba(var(--ink),0.6)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tags applied to the whole batch — usually the right granularity. */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Tags for all {files.length} image{files.length !== 1 ? 's' : ''}</label>
            <TagInput
              value={sharedTags}
              onChange={setSharedTags}
              placeholder="e.g. mars, rover, nasa — Enter to add"
            />
          </div>
        </div>

        {/* Files */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {analysing && (
            <div style={{ padding: '28px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>
              Reading images…
            </div>
          )}

          {items.map((item, index) => (
            <StagedRow
              key={`${item.file.name}-${index}`}
              item={item}
              onChange={patch => update(index, patch)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.7)' }}>
            {error ? (
              <span style={{ color: 'var(--red)' }}>{error}</span>
            ) : blocked ? (
              <span style={{ color: 'var(--gold)' }}>
                {missingTitle.length > 0
                  ? `${missingTitle.length} image${missingTitle.length !== 1 ? 's need' : ' needs'} a title`
                  : `${missingAlt.length} image${missingAlt.length !== 1 ? 's need' : ' needs'} alt text (or mark decorative)`}
              </span>
            ) : duplicates.length > 0 ? (
              <span>{duplicates.length} already in the library — {pending.length} will be uploaded</span>
            ) : (
              <span>{pending.length} ready</span>
            )}
          </div>

          <button type="button" onClick={onCancel} disabled={busy} style={secondaryButton(busy)}>
            Cancel
          </button>
          <button type="button" onClick={upload} disabled={busy || blocked || pending.length === 0} style={primaryButton(busy || blocked || pending.length === 0)}>
            {busy ? 'Uploading…' : `Upload ${pending.length || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── One staged file ──────────────────────────────────────────────────────────

function StagedRow({ item, onChange }: { item: Staged; onChange: (patch: Partial<Staged>) => void }) {
  const lowRes = item.meta && item.meta.width < LOW_RESOLUTION
  const done   = item.status === 'done'
  const skipped = item.status === 'skipped'

  return (
    <div
      style={{
        display: 'flex', gap: '12px', padding: '12px',
        background: 'rgba(var(--ink),0.03)',
        border: `1px solid ${item.status === 'error' ? 'rgba(var(--red-rgb),0.4)' : 'rgba(var(--ink),0.09)'}`,
        borderRadius: '9px',
        opacity: skipped ? 0.6 : 1,
      }}
    >
      {/* Preview */}
      <div style={{ width: '104px', flexShrink: 0 }}>
        <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ marginTop: '5px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', textAlign: 'center' }}>
          {item.meta ? `${item.meta.width}×${item.meta.height}` : '—'}
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {skipped && item.duplicate ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.75)' }}>
            <Copy size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }} />
            <span>
              Already in the library as <strong style={{ color: 'rgba(var(--ink),0.95)' }}>{item.duplicate.title || 'an existing asset'}</strong>. It will be skipped — the existing copy is reused.
            </span>
          </div>
        ) : (
          <>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                value={item.title}
                onChange={e => onChange({ title: e.target.value })}
                disabled={done}
                placeholder="What is in this image?"
                style={inputStyle(!item.title.trim())}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Alt text
                <span style={{ marginLeft: '8px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(var(--ink),0.5)' }}>
                  described for screen readers and search
                </span>
              </label>
              <input
                value={item.altText}
                onChange={e => onChange({ altText: e.target.value })}
                disabled={done || item.decorative}
                placeholder={item.decorative ? 'Decorative — no alt text needed' : 'e.g. The Vikram lander on the lunar south pole'}
                style={inputStyle(!item.decorative && !item.altText.trim())}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '5px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.6)' }}>
                <input
                  type="checkbox"
                  checked={item.decorative}
                  onChange={e => onChange({ decorative: e.target.checked })}
                  disabled={done}
                />
                Decorative — no alt text needed
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={labelStyle}>Credit</label>
                <input
                  value={item.credit}
                  onChange={e => onChange({ credit: e.target.value })}
                  disabled={done}
                  placeholder="e.g. ISRO"
                  style={inputStyle(false)}
                />
              </div>
              <div style={{ flex: '2 1 240px' }}>
                <label style={labelStyle}>Extra tags for this image</label>
                <TagInput value={item.tags} onChange={tags => onChange({ tags })} placeholder="optional" />
              </div>
            </div>
          </>
        )}

        {/* Status line */}
        {lowRes && !skipped && (
          <Note tone="warn">
            Low resolution ({item.meta!.width}×{item.meta!.height}) — may look soft. Aim for 1200px+ wide.
          </Note>
        )}
        {item.status === 'error' && <Note tone="error">{item.error}</Note>}
        {done && <Note tone="ok">Uploaded</Note>}
      </div>
    </div>
  )
}

function Note({ tone, children }: { tone: 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const color = tone === 'error' ? 'var(--red)' : tone === 'ok' ? 'var(--green)' : 'rgba(var(--ink),0.7)'
  const Icon  = tone === 'ok' ? Check : AlertTriangle
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '12px', color }}>
      <Icon size={13} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '4px',
  fontFamily: 'var(--font-mono)', fontSize: '11px',
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'rgba(var(--ink),0.6)',
}

function inputStyle(invalid: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
    background: 'rgba(var(--ink),0.04)',
    border: `1px solid ${invalid ? 'rgba(var(--red-rgb),0.45)' : 'rgba(var(--ink),0.12)'}`,
    borderRadius: '7px', outline: 'none',
    color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '14px',
  }
}

function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 20px', borderRadius: '7px',
    background: disabled ? 'rgba(var(--accent-rgb),0.25)' : 'var(--accent)',
    border: '1px solid transparent',
    color: disabled ? 'rgba(var(--ink),0.55)' : 'var(--black)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function secondaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 18px', borderRadius: '7px',
    background: 'transparent', border: '1px solid rgba(var(--ink),0.14)',
    color: 'rgba(var(--ink),0.8)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
