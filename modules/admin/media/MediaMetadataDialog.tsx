'use client'

import { useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { TagInput } from './TagInput'
import {
  MediaMetaFields, emptyMeta, resolveTags, hasAlt,
  labelStyle, primaryButton, secondaryButton, type MediaMeta,
} from './MediaMetaFields'
import { titleFromFilename } from './mediaNaming'

/**
 * Describe assets that are ALREADY uploaded.
 *
 * Cloudinary uploads go through `<CldUploadWidget>`, a third-party iframe that
 * hands us the file only after it has landed — there is no point to interrupt
 * beforehand the way the Supabase dialog does. So the metadata is collected
 * immediately afterwards and PATCHed onto the rows, which gets the Cloudinary
 * tab to the same place: no asset left titled `1000035268`.
 */

export interface EditableAsset {
  id:       string
  url:      string
  thumbUrl?: string | null
  title?:   string | null
  altText?: string | null
  credit?:  string | null
  tags?:    string[]
}

interface Row {
  asset:  EditableAsset
  meta:   MediaMeta
  status: 'pending' | 'saving' | 'done' | 'error'
  error:  string | null
}

interface Props {
  assets:   EditableAsset[]
  title?:   string
  subtitle?: string
  onClose:  (savedCount: number) => void
}

function toRow(asset: EditableAsset): Row {
  return {
    asset,
    meta: {
      // A widget-supplied name like "1000035268" is not a title. Run it through
      // the same derivation as everything else and let the editor fix it.
      ...emptyMeta(asset.title ? titleFromFilename(asset.title) : ''),
      altText:    asset.altText || '',
      decorative: asset.altText === '',
      credit:     asset.credit || '',
      tags:       asset.tags || [],
    },
    status: 'pending',
    error:  null,
  }
}

export function MediaMetadataDialog({ assets, title, subtitle, onClose }: Props) {
  const [rows,        setRows]        = useState<Row[]>(() => assets.map(toRow))
  const [sharedTags,  setSharedTags]  = useState<string[]>([])
  const [sharedDraft, setSharedDraft] = useState('')
  const [busy,        setBusy]        = useState(false)
  const [saved,       setSaved]       = useState(0)

  const update = (index: number, patch: Partial<Row>) =>
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const outstanding   = rows.filter(r => r.status !== 'done')
  const missingTitle  = outstanding.filter(r => !r.meta.title.trim())
  const missingAlt    = outstanding.filter(r => !hasAlt(r.meta))
  const blocked       = missingTitle.length > 0 || missingAlt.length > 0

  async function save() {
    if (blocked || busy) return
    setBusy(true)
    const batchTags = [...sharedTags, sharedDraft]
    let count = saved

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.status === 'done') continue

      update(i, { status: 'saving', error: null })
      try {
        const res = await fetch(`/api/admin/media/${row.asset.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            title:   row.meta.title.trim(),
            altText: row.meta.decorative ? '' : row.meta.altText.trim(),
            credit:  row.meta.credit.trim(),
            tags:    resolveTags(row.meta, batchTags),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not save')
        update(i, { status: 'done' })
        count++
      } catch (e: any) {
        update(i, { status: 'error', error: e.message || 'Could not save' })
      }
    }

    setSaved(count)
    setBusy(false)
    if (count === rows.length) onClose(count)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Describe uploaded images"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '760px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--black)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: 'var(--white)' }}>
                {title || `Describe ${assets.length} image${assets.length !== 1 ? 's' : ''}`}
              </h2>
              <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.65)' }}>
                {subtitle || 'Uploaded. A title and a couple of tags are what make these findable.'}
              </p>
            </div>
            <button
              type="button" onClick={() => onClose(saved)} disabled={busy} aria-label="Close"
              style={{ display: 'flex', background: 'none', border: 'none', padding: '4px', cursor: busy ? 'not-allowed' : 'pointer', color: 'rgba(var(--ink),0.6)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Tags for all {assets.length} image{assets.length !== 1 ? 's' : ''}</label>
            <TagInput
              value={sharedTags}
              draft={sharedDraft}
              onChange={setSharedTags}
              onDraftChange={setSharedDraft}
              placeholder="e.g. mars, rover, nasa — Enter to add"
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rows.map((row, index) => (
            <div
              key={row.asset.id}
              style={{
                display: 'flex', gap: '12px', padding: '12px',
                background: 'rgba(var(--ink),0.03)',
                border: `1px solid ${row.status === 'error' ? 'rgba(var(--red-rgb),0.4)' : 'rgba(var(--ink),0.09)'}`,
                borderRadius: '9px',
              }}
            >
              <div style={{ width: '104px', flexShrink: 0 }}>
                <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.asset.thumbUrl || row.asset.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MediaMetaFields
                  value={row.meta}
                  onChange={meta => update(index, { meta })}
                  disabled={row.status === 'done'}
                  tagLabel="Extra tags for this image"
                />
                {row.status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--red)' }}>
                    <AlertTriangle size={13} /><span>{row.error}</span>
                  </div>
                )}
                {row.status === 'done' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--green)' }}>
                    <Check size={13} /><span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.7)' }}>
            {blocked ? (
              <span style={{ color: 'var(--gold)' }}>
                {missingTitle.length > 0
                  ? `${missingTitle.length} image${missingTitle.length !== 1 ? 's need' : ' needs'} a title`
                  : `${missingAlt.length} image${missingAlt.length !== 1 ? 's need' : ' needs'} alt text (or mark decorative)`}
              </span>
            ) : (
              <span>
                Already uploaded — these details are what make them searchable.
              </span>
            )}
          </div>

          <button type="button" onClick={() => onClose(saved)} disabled={busy} style={secondaryButton(busy)}>
            Skip for now
          </button>
          <button type="button" onClick={save} disabled={busy || blocked} style={primaryButton(busy || blocked)}>
            {busy ? 'Saving…' : 'Save details'}
          </button>
        </div>
      </div>
    </div>
  )
}
