'use client'

import { useState } from 'react'
import { UploadCloud, X, Crosshair, ChevronDown, ChevronRight, AlertTriangle, Check } from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import type { FeaturedImageMeta } from '@/types/article'

interface Props {
  url:    string
  meta:   FeaturedImageMeta
  onUrl:  (url: string) => void
  onMeta: (meta: FeaturedImageMeta) => void
}

const BAD_EXT = ['.bmp', '.tiff', '.tif', '.svg', '.ico', '.heic']

/**
 * Newsroom-quality featured image manager: drag-drop / paste / URL / Media
 * Library, live validation (resolution, format, load errors), a click-to-set
 * focal point, and full attribution + licensing metadata. Metadata persists in
 * articles.featured_image_meta and drives the public hero (alt / focal /
 * caption / credit).
 */
export function FeaturedImageManager({ url, meta, onUrl, onMeta }: Props) {
  const [showMedia, setShowMedia] = useState(false)
  const [showMeta, setShowMeta]   = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [dims, setDims]           = useState<{ w: number; h: number } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [dropHint, setDropHint]   = useState('')

  const set = <K extends keyof FeaturedImageMeta>(key: K, val: FeaturedImageMeta[K]) =>
    onMeta({ ...meta, [key]: val })

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (uri && /^https?:\/\//i.test(uri.trim())) { onUrl(uri.trim()); setDropHint(''); return }
    if (e.dataTransfer.files?.length) setDropHint('To upload a file, use Browse → Media Library.')
  }

  function setFocal(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - r.left) / r.width) * 100)
    const y = Math.round(((e.clientY - r.top) / r.height) * 100)
    onMeta({ ...meta, focalX: Math.max(0, Math.min(100, x)), focalY: Math.max(0, Math.min(100, y)) })
  }

  // ── Validation ──
  const ext = url.toLowerCase().match(/\.[a-z0-9]+($|\?)/)?.[0]?.replace(/\?.*/, '')
  const warnings: { level: 'warn' | 'ok'; text: string }[] = []
  if (url) {
    if (loadError) warnings.push({ level: 'warn', text: 'Image failed to load — check the URL.' })
    else if (dims) {
      if (dims.w < 640) warnings.push({ level: 'warn', text: `Low resolution (${dims.w}×${dims.h}) — may look soft. Aim for 1200px+ wide.` })
      else if (dims.w >= 1200) warnings.push({ level: 'ok', text: `Good resolution (${dims.w}×${dims.h}).` })
      else warnings.push({ level: 'ok', text: `${dims.w}×${dims.h}.` })
    }
    if (ext && BAD_EXT.includes(ext)) warnings.push({ level: 'warn', text: `${ext} is not ideal for a hero image — prefer JPG/WebP/AVIF.` })
    if (!meta.alt?.trim()) warnings.push({ level: 'warn', text: 'Add alt text for accessibility & SEO.' })
  }

  const focalX = meta.focalX ?? 50
  const focalY = meta.focalY ?? 50

  return (
    <div>
      {/* URL + Browse */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={url}
          onChange={e => { onUrl(e.target.value); setLoadError(false); setDims(null) }}
          placeholder="https://… or drop / paste a URL, or Browse →"
          style={{ flex: 1, padding: '9px 12px', background: 'var(--black)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          onClick={() => setShowMedia(true)}
          style={{ flexShrink: 0, padding: '0 14px', background: 'rgba(var(--ink),0.05)', border: '1px solid rgba(var(--ink),0.12)', borderRadius: '6px', color: 'rgba(var(--ink),0.9)', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          📁 Browse
        </button>
      </div>

      {/* Drop zone / preview */}
      {url ? (
        <div style={{ marginTop: '10px' }}>
          <div
            onClick={setFocal}
            title="Click to set the focal point"
            style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'crosshair' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={meta.alt || 'preview'}
              onLoad={e => { const t = e.target as HTMLImageElement; setDims({ w: t.naturalWidth, h: t.naturalHeight }); setLoadError(false) }}
              onError={() => { setLoadError(true); setDims(null) }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${focalX}% ${focalY}%`, display: 'block' }}
            />
            {/* Focal point marker */}
            <div style={{ position: 'absolute', left: `${focalX}%`, top: `${focalY}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
              <Crosshair size={22} style={{ color: '#fff', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', letterSpacing: '0.04em' }}>
              Focal point {focalX}% · {focalY}% — click image to reposition
            </span>
            <button type="button" onClick={() => { onUrl(''); setDims(null); setLoadError(false) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'rgba(var(--ink),0.6)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <X size={11} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ marginTop: '10px', padding: '28px 16px', textAlign: 'center', borderRadius: '10px', border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`, background: dragOver ? 'rgba(var(--accent-rgb),0.06)' : 'rgba(var(--ink),0.02)', transition: 'all 0.15s' }}
        >
          <UploadCloud size={22} style={{ color: 'rgba(var(--ink),0.4)' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', margin: '8px 0 0', letterSpacing: '0.04em' }}>
            Drop an image URL here, paste a URL above, or Browse the Media Library
          </p>
          {dropHint && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', margin: '6px 0 0' }}>{dropHint}</p>}
        </div>
      )}

      {/* Validation */}
      {warnings.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {warnings.map((w, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: w.level === 'warn' ? 'var(--gold)' : 'var(--green)' }}>
              {w.level === 'warn' ? <AlertTriangle size={11} /> : <Check size={11} />} {w.text}
            </li>
          ))}
        </ul>
      )}

      {/* Alt text — always visible (accessibility/SEO critical) */}
      {url && (
        <div style={{ marginTop: '12px' }}>
          <MetaLabel>Alt text <span style={{ color: 'rgba(var(--ink),0.4)' }}>(describes the image)</span></MetaLabel>
          <input value={meta.alt || ''} onChange={e => set('alt', e.target.value)} placeholder="e.g. The Artemis II crew capsule on the launch pad at dusk" style={metaInput} />
        </div>
      )}

      {/* Attribution & licensing — collapsible */}
      {url && (
        <div style={{ marginTop: '10px' }}>
          <button type="button" onClick={() => setShowMeta(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em' }}>
            {showMeta ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Attribution & licensing
          </button>
          {showMeta && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <MetaField label="Caption"      value={meta.caption}      onChange={v => set('caption', v)}      full />
              <MetaField label="Credit"       value={meta.credit}       onChange={v => set('credit', v)} />
              <MetaField label="Photographer" value={meta.photographer} onChange={v => set('photographer', v)} />
              <MetaField label="Organization" value={meta.organization} onChange={v => set('organization', v)} />
              <MetaField label="Source URL"   value={meta.sourceUrl}    onChange={v => set('sourceUrl', v)} />
              <MetaField label="License"      value={meta.license}      onChange={v => set('license', v)} />
              <MetaField label="Copyright"    value={meta.copyright}    onChange={v => set('copyright', v)}    full />
            </div>
          )}
        </div>
      )}

      {/* Media picker modal */}
      {showMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => { if (e.target === e.currentTarget) setShowMedia(false) }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', width: '100%', maxWidth: '760px', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>Featured Image</span>
              <button onClick={() => setShowMedia(false)} style={{ background: 'none', border: 'none', color: 'rgba(var(--ink),0.8)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <MediaLibrary pickerMode defaultBucket="article-images" onPick={u => { onUrl(u); setShowMedia(false); setDims(null); setLoadError(false) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const metaInput: React.CSSProperties = {
  width: '100%', padding: '8px 11px', background: 'var(--black)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.7)', marginBottom: '4px' }}>{children}</label>
}

function MetaField({ label, value, onChange, full }: { label: string; value?: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <MetaLabel>{label}</MetaLabel>
      <input value={value || ''} onChange={e => onChange(e.target.value)} style={metaInput} />
    </div>
  )
}
