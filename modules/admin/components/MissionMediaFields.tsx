'use client'

/**
 * Enhanced Media Management editor (Phase 1, Feature 7).
 *
 * Single slots (hero / patch / logo / agency logo / banner) and list slots
 * (gallery / infographics / animations / videos / documents), each item with
 * newsroom-grade metadata behind a collapsible "Details" panel. Images can be
 * pasted as a URL or picked from the Media Library (whose Cloudinary tab
 * delivers optimised AVIF/WebP + responsive variants). Reuses `SubLabel`.
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, Trash2, Plus, X, FileText } from 'lucide-react'
import type { MissionMedia, MediaItem } from '@/types/mission'
import { emptyMediaItem } from '@/modules/missions/services/missionMedia'
import { SubLabel } from '@/modules/admin/components/MissionClassificationFields'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'

interface Props {
  value:    MissionMedia
  onChange: (next: MissionMedia) => void
}

export function MissionMediaFields({ value, onChange }: Props) {
  const setSingle = (slot: 'hero' | 'patch' | 'logo' | 'agencyLogo' | 'banner', item: MediaItem) => onChange({ ...value, [slot]: item })
  const setList = (slot: 'gallery' | 'infographics' | 'animations' | 'videos' | 'documents', items: MediaItem[]) => onChange({ ...value, [slot]: items })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <MediaField label="Mission Hero Image" hint="The main image (also the card + hero). Mirrors the featured image." value={value.hero} onChange={i => setSingle('hero', i)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        <MediaField label="Mission Patch" value={value.patch} onChange={i => setSingle('patch', i)} />
        <MediaField label="Mission Logo" value={value.logo} onChange={i => setSingle('logo', i)} />
        <MediaField label="Agency Logo" value={value.agencyLogo} onChange={i => setSingle('agencyLogo', i)} />
        <MediaField label="Mission Banner" value={value.banner} onChange={i => setSingle('banner', i)} />
      </div>

      <MediaListField label="Gallery Images" hint="Add as many images as you like." items={value.gallery} onChange={i => setList('gallery', i)} />
      <MediaListField label="Infographics" items={value.infographics} onChange={i => setList('infographics', i)} />
      <MediaListField label="Animations" hint="GIFs or short animated clips (by URL)." items={value.animations} onChange={i => setList('animations', i)} />
      <MediaListField label="Videos" hint="Video URLs (YouTube, Vimeo, …)." items={value.videos} onChange={i => setList('videos', i)} link />
      <MediaListField label="Mission Documents" hint="PDFs, press kits, papers (by URL)." items={value.documents} onChange={i => setList('documents', i)} link />
    </div>
  )
}

// ── Single image slot ────────────────────────────────────────────────

function MediaField({ label, hint, value, onChange }: { label: string; hint?: string; value: MediaItem; onChange: (i: MediaItem) => void }) {
  const [details, setDetails] = useState(false)
  return (
    <div>
      <SubLabel hint={hint}>{label}</SubLabel>
      <ImageUrlInput url={value.url} onUrlChange={url => onChange({ ...value, url })} />
      {value.url && (
        <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', aspectRatio: '16/7' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={value.alt || label} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}
      <DetailsToggle open={details} onToggle={() => setDetails(!details)} />
      {details && <MediaMetaFields value={value} onChange={onChange} />}
    </div>
  )
}

// ── List slot (images or links) ──────────────────────────────────────

function MediaListField({ label, hint, items, onChange, link }: { label: string; hint?: string; items: MediaItem[]; onChange: (i: MediaItem[]) => void; link?: boolean }) {
  const [adding, setAdding] = useState(false)
  const update = (i: number, item: MediaItem) => onChange(items.map((it, idx) => idx === i ? item : it))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir
    if (to < 0 || to >= items.length) return
    const next = [...items];[next[i], next[to]] = [next[to], next[i]]; onChange(next)
  }
  const add = (url: string) => { if (url.trim()) { onChange([...items, { ...emptyMediaItem(), url: url.trim() }]); setAdding(false) } }

  return (
    <div>
      <SubLabel hint={hint}>{label}</SubLabel>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          {items.map((item, i) => (
            <MediaListItem key={i} item={item} link={link} index={i} total={items.length}
              onChange={it => update(i, it)} onRemove={() => remove(i)} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
          ))}
        </div>
      )}
      {adding ? (
        <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <ImageUrlInput url="" onUrlChange={() => {}} onCommit={add} autoBrowse={!link} placeholder={link ? 'https://… then Enter' : 'https://… or Browse →'} />
          <button type="button" onClick={() => setAdding(false)} style={{ ...ghostBtn, marginTop: '8px' }}>Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={ghostBtn}>
          <Plus size={11} /> Add {link ? 'link' : 'image'}
        </button>
      )}
    </div>
  )
}

function MediaListItem({ item, link, index, total, onChange, onRemove, onUp, onDown }: {
  item: MediaItem; link?: boolean; index: number; total: number
  onChange: (i: MediaItem) => void; onRemove: () => void; onUp: () => void; onDown: () => void
}) {
  const [details, setDetails] = useState(false)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {link ? (
          <FileText size={16} style={{ color: 'rgba(var(--ink),0.4)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '48px', height: '36px', borderRadius: '4px', overflow: 'hidden', background: 'var(--black)', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
          </div>
        )}
        <input value={item.caption} onChange={e => onChange({ ...item, caption: e.target.value })} placeholder={link ? 'Title' : 'Caption'} style={{ ...inputStyle, flex: 1, fontSize: '13px' }} />
        <IconBtn onClick={onUp} disabled={index === 0} label="Move up"><ChevronUp size={13} /></IconBtn>
        <IconBtn onClick={onDown} disabled={index === total - 1} label="Move down"><ChevronDown size={13} /></IconBtn>
        <IconBtn onClick={onRemove} label="Remove" danger><Trash2 size={12} /></IconBtn>
      </div>
      <DetailsToggle open={details} onToggle={() => setDetails(!details)} />
      {details && (
        <div style={{ marginTop: '4px' }}>
          <label style={metaLabel}>URL</label>
          <input value={item.url} onChange={e => onChange({ ...item, url: e.target.value })} placeholder="https://…" style={{ ...inputStyle, marginBottom: '8px' }} />
          <MediaMetaFields value={item} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

// ── Metadata (the 8 attribution/licensing fields) ────────────────────

function MediaMetaFields({ value, onChange }: { value: MediaItem; onChange: (i: MediaItem) => void }) {
  const set = (k: keyof MediaItem, v: string) => onChange({ ...value, [k]: v })
  const field = (k: keyof MediaItem, label: string, placeholder?: string) => (
    <div>
      <label style={metaLabel}>{label}</label>
      <input value={value[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
      {field('alt', 'Alt Text', 'Describe the image')}
      {field('caption', 'Caption')}
      {field('credit', 'Credits', 'e.g. NASA/JPL')}
      {field('photographer', 'Photographer')}
      {field('agency', 'Agency')}
      {field('sourceUrl', 'Source URL', 'https://…')}
      {field('copyright', 'Copyright')}
      {field('license', 'License', 'e.g. CC BY 4.0')}
    </div>
  )
}

// ── URL input + Media Library browse ─────────────────────────────────

function ImageUrlInput({ url, onUrlChange, onCommit, autoBrowse, placeholder }: {
  url: string; onUrlChange: (u: string) => void; onCommit?: (u: string) => void; autoBrowse?: boolean; placeholder?: string
}) {
  const [browse, setBrowse] = useState(Boolean(autoBrowse))
  const [draft, setDraft] = useState(url)
  const commit = onCommit || onUrlChange
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={onCommit ? draft : url}
          onChange={e => (onCommit ? setDraft(e.target.value) : onUrlChange(e.target.value))}
          onKeyDown={e => { if (onCommit && e.key === 'Enter') { e.preventDefault(); commit(draft) } }}
          placeholder={placeholder || 'https://… or Browse →'}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={() => setBrowse(!browse)} style={{ ...ghostBtn, flexShrink: 0 }}>
          {browse ? <><X size={11} /> Close</> : <>📁 Browse</>}
        </button>
      </div>
      {browse && (
        <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <MediaLibrary pickerMode defaultBucket="mission-images" onPick={u => { commit(u); setBrowse(false) }} />
        </div>
      )}
    </div>
  )
}

// ── shared bits ──────────────────────────────────────────────────────

function DetailsToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', padding: 0 }}>
      {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />} Details &amp; credits
    </button>
  )
}

function IconBtn({ onClick, disabled, label, danger, children }: { onClick: () => void; disabled?: boolean; label: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', color: danger ? 'rgba(231,76,60,0.7)' : 'rgba(var(--ink),0.6)', opacity: disabled ? 0.35 : 1, flexShrink: 0 }}>
      {children}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--black)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box', display: 'block',
}
const metaLabel: React.CSSProperties = { display: 'block', marginBottom: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)' }
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '6px',
  background: 'rgba(var(--ink),0.05)', border: '1px solid rgba(var(--ink),0.12)', color: 'rgba(var(--ink),0.9)',
  fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer', whiteSpace: 'nowrap',
}
