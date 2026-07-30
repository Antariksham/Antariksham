'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Check, Copy, X } from 'lucide-react'
import { TagInput } from './TagInput'
import {
  MediaMetaFields, emptyMeta, resolveTags, hasAlt,
  labelStyle, primaryButton, secondaryButton, type MediaMeta,
} from './MediaMetaFields'
import { hashFile, readImageMeta, makeThumbnail, type ImageMeta } from './imageTools'
import { titleFromFilename } from './mediaNaming'
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
  file:       File
  previewUrl: string
  meta:       MediaMeta
  image:      ImageMeta | null
  checksum:   string | null
  duplicate:  Duplicate | null
  status:     'pending' | 'uploading' | 'done' | 'skipped' | 'error'
  error:      string | null
}

const LOW_RESOLUTION = 640

export function MediaUploadDialog({ files, bucket, onCancel, onDone }: Props) {
  const [items,      setItems]      = useState<Staged[]>([])
  const [sharedTags, setSharedTags] = useState<string[]>([])
  const [sharedDraft, setSharedDraft] = useState('')
  const [busy,       setBusy]       = useState(false)
  const [analysing,  setAnalysing]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
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
        const [image, checksum] = await Promise.all([
          readImageMeta(file),
          hashFile(file).catch(() => null),
        ])
        staged.push({
          file, previewUrl,
          meta:      emptyMeta(titleFromFilename(file.name)),
          image, checksum,
          duplicate: null,
          status:    'pending', error: null,
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

  const pending      = items.filter(i => i.status === 'pending')
  const duplicates   = items.filter(i => i.status === 'skipped')
  const missingAlt   = pending.filter(i => !hasAlt(i.meta))
  const missingTitle = pending.filter(i => !i.meta.title.trim())
  const blocked      = missingAlt.length > 0 || missingTitle.length > 0

  async function upload() {
    if (blocked || busy) return
    setBusy(true); setError(null)
    let uploaded = 0

    // Includes anything still half-typed in a tag field — see MediaMetaFields.
    const batchTags = [...sharedTags, sharedDraft]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.status !== 'pending') continue

      update(i, { status: 'uploading', error: null })
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('title', item.meta.title.trim())
        // A decorative image gets an explicitly empty alt, which is the correct
        // accessibility signal — not a missing one.
        fd.append('altText', item.meta.decorative ? '' : item.meta.altText.trim())
        if (item.meta.credit.trim()) fd.append('credit', item.meta.credit.trim())

        const tags = resolveTags(item.meta, batchTags)
        if (tags.length) fd.append('tags', tags.join(','))

        if (item.image) {
          fd.append('width',  String(item.image.width))
          fd.append('height', String(item.image.height))
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
              draft={sharedDraft}
              onChange={setSharedTags}
              onDraftChange={setSharedDraft}
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
  const lowRes  = item.image && item.image.width < LOW_RESOLUTION
  const done    = item.status === 'done'
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
          {item.image ? `${item.image.width}×${item.image.height}` : '—'}
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
          <MediaMetaFields
            value={item.meta}
            onChange={meta => onChange({ meta })}
            disabled={done}
            tagLabel="Extra tags for this image"
          />
        )}

        {/* Status line */}
        {lowRes && !skipped && (
          <Note tone="warn">
            Low resolution ({item.image!.width}×{item.image!.height}) — may look soft. Aim for 1200px+ wide.
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
