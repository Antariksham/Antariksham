'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import type { HomepageSection, HeroConfig } from '@/modules/admin/services/adminHomepage'
import {
  ChevronUp, ChevronDown, Eye, EyeOff,
  AlertCircle, LayoutDashboard, Pencil, X,
} from 'lucide-react'

interface Props {
  sections:    HomepageSection[]
  heroConfig:  HeroConfig | null
}

const SECTION_LABELS: Record<string, string> = {
  'hero':          'Hero Section',
  'status-strip':  'Status Strip',
  'status':        'Status Strip',
  'latest-news':   'Latest News',
  'news':          'Latest News',
  'missions':      'Missions',
  'apod':          'NASA APOD',
  'learn':         'Learn & Explore',
  'gallery':       'Gallery',
  'live':          'Live Systems',
  'about':         'About',
}

const SECTION_DESC: Record<string, string> = {
  'hero':          'Full-screen hero with featured story card',
  'status-strip':  'Live ISS, launches and mission status bar',
  'latest-news':   'Grid of most recent published articles',
  'missions':      'Featured active and upcoming missions',
  'apod':          'Astronomy Picture of the Day',
  'learn':         'Evergreen knowledge article highlights',
  'gallery':       'Curated space imagery section',
  'about':         'Platform mission and editorial statement',
}

const EMPTY_HERO: HeroConfig = {
  badge:       '',
  title:       '',
  excerpt:     '',
  readTime:    '',
  category:    '',
  articleSlug: '',
  imageUrl:    '',
}

export function HomepageAdmin({ sections, heroConfig }: Props) {
  const router  = useRouter()
  const [rows,  setRows]  = useState<HomepageSection[]>(sections)
  const [busy,  setBusy]  = useState<string | null>(null)
  const [error, setError] = useState('')

  // Hero editor state
  const [heroOpen,    setHeroOpen]    = useState(false)
  const [hero,        setHero]        = useState<HeroConfig>(heroConfig || EMPTY_HERO)
  const [heroSaving,  setHeroSaving]  = useState(false)
  const [heroSuccess, setHeroSuccess] = useState(false)

  // ── Section toggle ──────────────────────────────────────────

  async function handleToggle(id: string, current: boolean) {
    setBusy(id); setError('')
    const next = !current
    setRows(r => r.map(s => s.id === id ? { ...s, enabled: next } : s))

    const res = await fetch('/api/admin/homepage', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'toggle', id, enabled: next }),
    })
    if (!res.ok) {
      setRows(r => r.map(s => s.id === id ? { ...s, enabled: current } : s))
      setError('Failed to update section.')
    }
    setBusy(null)
  }

  // ── Section reorder ─────────────────────────────────────────

  async function handleMove(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= rows.length) return

    const updated = [...rows]
    ;[updated[index], updated[next]] = [updated[next], updated[index]]
    const reordered = updated.map((s, i) => ({ ...s, sortOrder: i }))
    setRows(reordered)

    await Promise.all([
      fetch('/api/admin/homepage', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'reorder', id: reordered[index].id, sortOrder: index }),
      }),
      fetch('/api/admin/homepage', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'reorder', id: reordered[next].id, sortOrder: next }),
      }),
    ])
  }

  // ── Hero save ───────────────────────────────────────────────

  async function handleHeroSave() {
    setHeroSaving(true); setError('')
    const res = await fetch('/api/admin/homepage', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'hero', config: hero }),
    })
    setHeroSaving(false)
    if (res.ok) {
      setHeroSuccess(true)
      setTimeout(() => setHeroSuccess(false), 3000)
      router.refresh()
    } else {
      setError('Failed to save hero config.')
    }
  }

  function setHeroField(key: keyof HeroConfig, val: string) {
    setHero(h => ({ ...h, [key]: val }))
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px', marginBottom: '20px' }}>
          <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)' }}>{error}</span>
        </div>
      )}

      {/* ── Sections list ─────────────────────────── */}
      <SidePanel label="Page Sections — reorder with arrows, toggle to show/hide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {rows.map((section, i) => {
            const label = SECTION_LABELS[section.slug] || section.name
            const desc  = SECTION_DESC[section.slug]   || ''
            const isHero = section.slug === 'hero'
            return (
              <div
                key={section.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  padding:      '12px 0',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity:      section.enabled ? 1 : 0.45,
                  transition:   'opacity 0.2s',
                }}
              >
                {/* Order buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                  <button onClick={() => handleMove(i, -1)} disabled={i === 0} style={arrowBtn(i === 0)}>
                    <ChevronUp size={10} />
                  </button>
                  <button onClick={() => handleMove(i, 1)} disabled={i === rows.length - 1} style={arrowBtn(i === rows.length - 1)}>
                    <ChevronDown size={10} />
                  </button>
                </div>

                {/* Number */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(var(--ink),0.2)', width: '16px', textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: section.enabled ? 'var(--white)' : 'rgba(var(--ink),0.4)' }}>
                      {label}
                    </span>
                    {isHero && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', padding: '2px 6px', borderRadius: '3px' }}>
                        Editable
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                      {desc}
                    </p>
                  )}
                </div>

                {/* Edit hero button */}
                {isHero && (
                  <button
                    onClick={() => setHeroOpen(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '5px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'rgba(var(--ink),0.5)', fontFamily: 'var(--font-mono)',
                      fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    <Pencil size={9} /> Edit
                  </button>
                )}

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(section.id, section.enabled)}
                  disabled={busy === section.id}
                  title={section.enabled ? 'Hide section' : 'Show section'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '30px', height: '30px', borderRadius: '5px', cursor: 'pointer',
                    background: 'transparent', flexShrink: 0,
                    border: `1px solid ${section.enabled ? 'rgba(46,204,113,0.3)' : 'var(--border)'}`,
                    color: section.enabled ? 'var(--green)' : 'rgba(var(--ink),0.3)',
                    opacity: busy === section.id ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {section.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            )
          })}
        </div>
      </SidePanel>

      {/* Info note */}
      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(79,142,247,0.05)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: '7px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(var(--ink),0.4)', margin: 0, letterSpacing: '0.06em', lineHeight: 1.6 }}>
          Section order and visibility update instantly. Edit the hero featured card by clicking <strong style={{ color: 'rgba(var(--ink),0.6)' }}>Edit</strong> on the Hero row.
        </p>
      </div>

      {/* ── Hero editor modal ──────────────────────── */}
      {heroOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setHeroOpen(false) }}
        >
          <div style={{ background: '#0d1117', border: '1px solid var(--border)', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--white)' }}>
                  Edit Hero Featured Card
                </span>
              </div>
              <button onClick={() => setHeroOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(var(--ink),0.5)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {heroSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)' }}>
                  ✓ Hero updated — homepage will reflect changes within 5 minutes.
                </div>
              )}

              <HeroField label="Badge Text"       hint="e.g. NASA · Saturn Mission"          value={hero.badge}       onChange={v => setHeroField('badge', v)} />
              <HeroField label="Featured Title"   hint="Article headline shown in hero card" value={hero.title}       onChange={v => setHeroField('title', v)} large />
              <HeroField label="Excerpt"          hint="1–2 sentence summary"                value={hero.excerpt}     onChange={v => setHeroField('excerpt', v)} textarea />
              <HeroField label="Article Slug"     hint="e.g. cassini-enceladus-ocean"        value={hero.articleSlug} onChange={v => setHeroField('articleSlug', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <HeroField label="Read Time" hint='e.g. "10 min read"' value={hero.readTime}  onChange={v => setHeroField('readTime', v)} />
                <HeroField label="Category"  hint='e.g. "Research"'    value={hero.category}  onChange={v => setHeroField('category', v)} />
              </div>
              <HeroField label="Image URL (optional)" hint="Replaces the planet illustration" value={hero.imageUrl} onChange={v => setHeroField('imageUrl', v)} />

              <button
                onClick={handleHeroSave}
                disabled={heroSaving}
                style={{
                  marginTop: '4px', padding: '11px', borderRadius: '6px',
                  background: 'var(--accent)', color: 'var(--black)',
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                  border: 'none', cursor: heroSaving ? 'not-allowed' : 'pointer',
                  opacity: heroSaving ? 0.7 : 1,
                }}
              >
                {heroSaving ? 'Saving…' : 'Save Hero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.4)' }}>
          {label}
        </span>
      </div>
      <div style={{ padding: '4px 16px 8px' }}>{children}</div>
    </div>
  )
}

function HeroField({
  label, hint, value, onChange, large, textarea,
}: {
  label: string; hint?: string; value: string
  onChange: (v: string) => void; large?: boolean; textarea?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '8px 11px',
    background: 'var(--black)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--white)', outline: 'none',
    fontFamily: large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize: large ? '16px' : '12px',
    boxSizing: 'border-box', display: 'block',
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.45)' }}>{label}</label>
        {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(var(--ink),0.25)' }}>{hint}</span>}
      </div>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...base, resize: 'vertical', lineHeight: 1.6 }} />
        : <input    value={value} onChange={e => onChange(e.target.value)} style={base} />
      }
    </div>
  )
}

function arrowBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '18px', height: '18px', borderRadius: '3px',
    border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? 'rgba(var(--ink),0.1)' : 'rgba(var(--ink),0.4)',
    padding: 0,
  }
}
