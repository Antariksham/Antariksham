'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface SeoRow {
  id:               string
  meta_title:       string
  meta_description: string | null
  og_image:         string | null
  keywords:         string | null
  canonical_url:    string | null
  schema_markup:    any
  created_at:       string
  updated_at:       string
}

interface FormState {
  metaTitle:       string
  metaDescription: string
  ogImage:         string
  keywords:        string
  canonicalUrl:    string
}

const EMPTY_FORM: FormState = {
  metaTitle:       '',
  metaDescription: '',
  ogImage:         '',
  keywords:        '',
  canonicalUrl:    '',
}

// ── Helpers ───────────────────────────────────────────────────

function CharCounter({ value, max, warn }: { value: string; max: number; warn: number }) {
  const len   = value.length
  const color = len > max ? 'var(--red)' : len > warn ? 'var(--gold)' : 'rgba(240,244,250,0.3)'
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color }}>
      {len}/{max}
    </span>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Google SERP Preview ───────────────────────────────────────

function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayTitle = title       || 'Page Title — Antariksham'
  const displayDesc  = description || 'Page description will appear here. Keep it between 120–160 characters for best results.'
  const displayUrl   = url         || 'antariksham.org/page'

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '16px 20px', maxWidth: '600px' }}>
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#202124', marginBottom: '2px', opacity: 0.7 }}>
        {displayUrl}
      </div>
      <div style={{
        fontFamily: 'Arial, sans-serif', fontSize: '18px',
        color: '#1a0dab', marginBottom: '4px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {displayTitle}
      </div>
      <div style={{
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#4d5156', lineHeight: '1.5',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {displayDesc}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function SEOCenter() {
  const [rows,         setRows]         = useState<SeoRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [modalMode,    setModalMode]    = useState<'create' | 'edit' | null>(null)
  const [editingRow,   setEditingRow]   = useState<SeoRow | null>(null)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [formError,    setFormError]    = useState<string | null>(null)
  const [showPreview,  setShowPreview]  = useState(false)
  const [expandedRow,  setExpandedRow]  = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchRef    = useRef<(q: string) => Promise<void>>(async () => {})

  // ── Fetch ──────────────────────────────────────────────────

  fetchRef.current = async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = query ? `/api/admin/seo?search=${encodeURIComponent(query)}` : '/api/admin/seo'
      const res  = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.rows || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRef.current(search) }, [search])

  // ── Debounced search ───────────────────────────────────────

  function handleSearchChange(val: string) {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 350)
  }

  // ── Modal helpers ──────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowPreview(false)
    setEditingRow(null)
    setModalMode('create')
  }

  function openEdit(row: SeoRow) {
    setForm({
      metaTitle:       row.meta_title       || '',
      metaDescription: row.meta_description || '',
      ogImage:         row.og_image         || '',
      keywords:        row.keywords         || '',
      canonicalUrl:    row.canonical_url    || '',
    })
    setFormError(null)
    setShowPreview(false)
    setEditingRow(row)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowPreview(false)
  }

  function setField(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Save ───────────────────────────────────────────────────

  async function handleSave() {
    setFormError(null)
    if (!form.metaTitle.trim()) {
      setFormError('Meta title is required.')
      return
    }
    setSaving(true)
    try {
      const isEdit = modalMode === 'edit' && editingRow
      const url    = isEdit ? `/api/admin/seo?id=${editingRow!.id}` : '/api/admin/seo'
      const method = isEdit ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      closeModal()
      fetchRef.current(search)
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('Delete this SEO entry? Any articles linked to it will lose their SEO metadata.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/seo?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Delete failed')
        return
      }
      setRows(prev => prev.filter(r => r.id !== id))
      if (expandedRow === id) setExpandedRow(null)
    } finally {
      setDeleting(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1000px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
          Admin
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--white)', margin: '0 0 4px' }}>
              SEO Center
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.45)', letterSpacing: '0.06em', margin: 0 }}>
              Manage meta titles, descriptions, and OG images
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '7px',
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontFamily: 'var(--font-mono)',
              fontSize: '11px', letterSpacing: '0.08em',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={13} /> New SEO Entry
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
        <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,250,0.3)', pointerEvents: 'none' }} />
        <input
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search SEO entries…"
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '7px', color: 'var(--white)',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            outline: 'none',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(240,90,90,0.08)', border: '1px solid rgba(240,90,90,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 72px', gap: '12px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
          {['Meta Title', 'Canonical URL', 'Updated', 'Actions'].map(col => (
            <span key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)' }}>
              {col}
            </span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
              Loading…
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              {search ? 'No results found' : 'No SEO entries yet'}
            </p>
            {!search && (
              <button
                onClick={openCreate}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Create your first SEO entry →
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && rows.map((row, i) => {
          const isExpanded = expandedRow === row.id
          const isLast     = i === rows.length - 1

          return (
            <div key={row.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>

              {/* Main row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 72px', gap: '12px', padding: '14px 20px', alignItems: 'center' }}>

                {/* Title + expand toggle */}
                <div style={{ minWidth: 0 }}>
                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  >
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {row.meta_title}
                    </span>
                    {isExpanded
                      ? <ChevronUp   size={12} style={{ color: 'rgba(240,244,250,0.3)', flexShrink: 0 }} />
                      : <ChevronDown size={12} style={{ color: 'rgba(240,244,250,0.3)', flexShrink: 0 }} />
                    }
                  </button>
                  {row.meta_description && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.35)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.meta_description}
                    </p>
                  )}
                </div>

                {/* Canonical URL */}
                <div style={{ overflow: 'hidden' }}>
                  {row.canonical_url ? (
                    <a
                      href={row.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                    >
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.canonical_url.replace('https://', '').replace('http://', '')}
                      </span>
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.2)' }}>—</span>
                  )}
                </div>

                {/* Updated */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.35)' }}>
                  {formatDate(row.updated_at)}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => openEdit(row)}
                    title="Edit"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '5px',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'rgba(240,244,250,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.color = 'rgba(240,244,250,0.5)' }}
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    title="Delete"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '5px',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'rgba(240,244,250,0.35)', cursor: deleting === row.id ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (deleting !== row.id) { e.currentTarget.style.borderColor = 'rgba(240,90,90,0.5)'; e.currentTarget.style.color = 'var(--red)' }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'rgba(240,244,250,0.35)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Expanded detail row */}
              {isExpanded && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {row.meta_description && <DetailField label="Meta Description" value={row.meta_description} />}
                    {row.keywords         && <DetailField label="Keywords"         value={row.keywords} />}
                    {row.og_image         && <DetailField label="OG Image URL"     value={row.og_image} truncate />}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)', margin: '0 0 8px' }}>
                        Google Preview
                      </p>
                      <SerpPreview
                        title={row.meta_title}
                        description={row.meta_description || ''}
                        url={row.canonical_url || 'antariksham.org'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Count */}
      {!loading && rows.length > 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.25)', letterSpacing: '0.1em', margin: '12px 0 0', textAlign: 'right' }}>
          {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </p>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modalMode && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
                {modalMode === 'create' ? 'New SEO Entry' : 'Edit SEO Entry'}
              </h2>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'rgba(240,244,250,0.4)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px' }}>

              {formError && (
                <div style={{ background: 'rgba(240,90,90,0.08)', border: '1px solid rgba(240,90,90,0.25)', borderRadius: '7px', padding: '10px 14px', marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)', margin: 0 }}>{formError}</p>
                </div>
              )}

              <FieldGroup label="Meta Title" hint="Appears in browser tab and search results. 50–60 characters ideal." required counter={<CharCounter value={form.metaTitle} max={60} warn={50} />}>
                <input value={form.metaTitle} onChange={e => setField('metaTitle', e.target.value)} placeholder="e.g. Orbital Mechanics Explained | Antariksham" style={inputStyle} />
              </FieldGroup>

              <FieldGroup label="Meta Description" hint="Shown in search snippets. 120–160 characters ideal." counter={<CharCounter value={form.metaDescription} max={160} warn={120} />}>
                <textarea value={form.metaDescription} onChange={e => setField('metaDescription', e.target.value)} placeholder="A clear description of what this page covers…" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
              </FieldGroup>

              <FieldGroup label="Canonical URL" hint="Full URL of the canonical page, e.g. https://antariksham.org/learn/orbital-mechanics">
                <input value={form.canonicalUrl} onChange={e => setField('canonicalUrl', e.target.value)} placeholder="https://antariksham.org/…" style={inputStyle} />
              </FieldGroup>

              <FieldGroup label="OG Image URL" hint="Image shown when shared on social media. 1200×630px recommended.">
                <input value={form.ogImage} onChange={e => setField('ogImage', e.target.value)} placeholder="https://…" style={inputStyle} />
              </FieldGroup>

              <FieldGroup label="Keywords" hint="Comma-separated. Minimal SEO impact today, but useful for internal reference.">
                <input value={form.keywords} onChange={e => setField('keywords', e.target.value)} placeholder="space, orbital mechanics, NASA, satellite" style={inputStyle} />
              </FieldGroup>

              {/* SERP Preview toggle */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => setShowPreview(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', color: 'rgba(240,244,250,0.5)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer' }}
                >
                  {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showPreview ? 'Hide' : 'Show'} Google Preview
                </button>
                {showPreview && (
                  <div style={{ marginTop: '12px' }}>
                    <SerpPreview title={form.metaTitle} description={form.metaDescription} url={form.canonicalUrl} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'rgba(240,244,250,0.5)', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: '7px', border: 'none', background: saving ? 'rgba(59,158,255,0.5)' : 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : modalMode === 'create' ? 'Create Entry' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function FieldGroup({ label, hint, required, counter, children }: {
  label:     string
  hint?:     string
  required?: boolean
  counter?:  React.ReactNode
  children:  React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.5)' }}>
          {label}{required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
        </label>
        {counter}
      </div>
      {children}
      {hint && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.25)', margin: '5px 0 0', lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function DetailField({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.3)', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(240,244,250,0.7)', margin: 0, ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { lineHeight: 1.6 }) }}>
        {value}
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '9px 12px',
  background:   'var(--surface)',
  border:       '1px solid var(--border)',
  borderRadius: '7px',
  color:        'var(--white)',
  fontFamily:   'var(--font-sans)',
  fontSize:     '13px',
  outline:      'none',
  boxSizing:    'border-box',
}
