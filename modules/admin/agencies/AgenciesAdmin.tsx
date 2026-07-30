'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, AlertCircle, Check, Rocket, Building2, ExternalLink,
} from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import type { AdminAgencyRow, AdminAgencyFull } from '@/modules/admin/services/adminAgencies'
import {
  agencySlug, suggestShortName, normalizeAgencyName,
  MAX_AGENCY_NAME_LENGTH, MAX_SHORT_NAME_LENGTH,
} from './agencyFields'

/**
 * The Space Agencies screen.
 *
 * `space_agencies` was read-only everywhere in the app, so the mission editor's
 * four agency pickers could only offer seeded rows — a mission for an unlisted
 * agency could not be filed at all. This is the write side.
 *
 * A full editor rather than a type-to-create chip field, because an agency row
 * carries a logo, country and website that the public mission page renders; a
 * name-only row would publish an agency with a blank logo.
 */

interface FormState {
  name:        string
  slug:        string
  shortName:   string
  country:     string
  logoUrl:     string
  websiteUrl:  string
  description: string
  _showLogoPicker: boolean
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', shortName: '', country: '',
  logoUrl: '', websiteUrl: '', description: '', _showLogoPicker: false,
}

export function AgenciesAdmin() {
  const [agencies, setAgencies] = useState<AdminAgencyRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [notice,   setNotice]   = useState('')
  const [query,    setQuery]    = useState('')

  const [modalMode,    setModalMode]    = useState<'new' | 'edit' | null>(null)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
  const [formError,    setFormError]    = useState('')
  const [saving,       setSaving]       = useState(false)
  const [slugEdited,   setSlugEdited]   = useState(false)
  const [shortEdited,  setShortEdited]  = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminAgencyRow | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState('')

  // ── Fetch ────────────────────────────────────────────────

  const fetchAgencies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/agencies', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setAgencies(json.agencies || [])
    } catch {
      setError('Could not load agencies. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgencies() }, [fetchAgencies])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return agencies
    return agencies.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.shortName.toLowerCase().includes(q) ||
      (a.country || '').toLowerCase().includes(q))
  }, [agencies, query])

  // ── Form ─────────────────────────────────────────────────

  function change<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => {
      if (key === 'name') {
        const name = val as string
        return {
          ...f,
          name,
          // Both derived fields track the name until the editor touches them —
          // the same rule the Authors screen uses for its slug.
          slug:      slugEdited  ? f.slug      : agencySlug(name),
          shortName: shortEdited ? f.shortName : suggestShortName(name),
        }
      }
      return { ...f, [key]: val }
    })
    if (key === 'slug')      setSlugEdited(true)
    if (key === 'shortName') setShortEdited(true)
    setFormError('')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setSlugEdited(false)
    setShortEdited(false)
    setModalMode('new')
    setNotice('')
  }

  async function openEdit(id: string) {
    setEditingId(id)
    setModalMode('edit')
    setFormError('')
    setNotice('')
    // Keep the stored slug and short name stable while the name is edited.
    setSlugEdited(true)
    setShortEdited(true)
    setForm(EMPTY_FORM)

    const res = await fetch(`/api/admin/agencies?id=${id}`, { cache: 'no-store' })
    if (!res.ok) { setFormError('Could not load agency data.'); return }
    const a: AdminAgencyFull = await res.json()
    // Coerce every field: these are controlled inputs, and a null from the API
    // would hand React `value={null}` and silently make the field uncontrolled.
    setForm({
      name:        a.name       || '',
      slug:        a.slug       || '',
      shortName:   a.shortName  || '',
      country:     a.country    || '',
      logoUrl:     a.logoUrl    || '',
      websiteUrl:  a.websiteUrl || '',
      description: a.description || '',
      _showLogoPicker: false,
    })
  }

  async function handleSave() {
    if (!normalizeAgencyName(form.name)) { setFormError('Name is required.'); return }

    setSaving(true)
    setFormError('')
    try {
      const url    = modalMode === 'edit' ? `/api/admin/agencies?id=${editingId}` : '/api/admin/agencies'
      const method = modalMode === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name: form.name, slug: form.slug, shortName: form.shortName,
          country: form.country, logoUrl: form.logoUrl,
          websiteUrl: form.websiteUrl, description: form.description,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setFormError(data?.error || 'Failed to save.'); return }

      setNotice(modalMode === 'edit' ? `Saved “${form.name}”.` : `Created “${form.name}”.`)
      setModalMode(null)
      setEditingId(null)
      await fetchAgencies()
    } catch {
      setFormError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/agencies?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        // 409 means missions still reference it — keep the dialog open with the
        // reason instead of closing on a silent no-op.
        setDeleteError(data?.error || 'Failed to delete agency.')
        return
      }
      setNotice(`Deleted “${deleteTarget.name}”.`)
      setDeleteTarget(null)
      await fetchAgencies()
    } catch {
      setDeleteError('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
              Space Agencies
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '6px 0 0' }}>
              {agencies.length} {agencies.length === 1 ? 'agency' : 'agencies'} · Selectable in the mission editor
            </p>
          </div>
          <button onClick={openNew} style={primaryBtn}>
            <Plus size={13} />
            New Agency
          </button>
        </div>

        {error && (
          <div role="alert" style={banner('red')}>
            <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" style={banner('accent')}>
            <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)' }}>{notice}</span>
          </div>
        )}

        {agencies.length > 0 && (
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by name, short name or country…"
            aria-label="Filter agencies"
            style={{ ...inputStyle, width: '100%' }}
          />
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '62px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.5 }} />
            ))}
          </div>
        ) : agencies.length === 0 ? (
          <div style={{ padding: '48px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
            <Building2 size={28} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              No agencies yet
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)', marginTop: '6px', marginBottom: '16px' }}>
              Add the agencies you cover — they become selectable in the mission editor.
            </p>
            <button onClick={openNew} style={{ ...primaryBtn, margin: '0 auto' }}>
              <Plus size={12} /> Create Agency
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.6)', letterSpacing: '0.06em', margin: 0 }}>
            No agency matches “{query.trim()}”.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visible.map(a => (
              <div
                key={a.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto auto',
                  alignItems: 'center', gap: '12px', padding: '11px 14px',
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
                }}
              >
                <Logo src={a.logoUrl} name={a.shortName || a.name} />

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)', lineHeight: 1.3 }}>
                      {a.name}
                    </span>
                    {a.shortName && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                        {a.shortName}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.04em' }}>
                    <span>{a.country || 'no country'}</span>
                    {a.websiteUrl && (
                      <a
                        href={a.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'rgba(var(--ink),0.6)' }}
                      >
                        site <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                <span
                  title={`Primary agency on ${a.missionCount} mission${a.missionCount === 1 ? '' : 's'}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
                    background: 'rgba(var(--ink),0.05)', border: '1px solid var(--border)',
                    color: 'rgba(var(--ink),0.72)',
                  }}
                >
                  <Rocket size={11} /> {a.missionCount}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconBtn label={`Edit ${a.name}`} onClick={() => openEdit(a.id)}>
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn label={`Delete ${a.name}`} onClick={() => { setDeleteTarget(a); setDeleteError(''); setNotice('') }} tone="red">
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 16px', background: 'rgba(var(--accent-rgb),0.04)', border: '1px solid rgba(var(--accent-rgb),0.12)', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
            Agencies here fill the mission editor&rsquo;s Primary Agency select and its partner,
            commercial and institution fields. The count is missions where the agency is
            <em> primary</em>. An agency still referenced by any mission cannot be deleted —
            reassign those missions first.
          </p>
        </div>
      </div>

      {/* Edit / new modal */}
      {modalMode && (
        <Backdrop onClose={() => setModalMode(null)}>
          <div style={{ ...dialogBox, maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ ...dialogTitle, margin: 0 }}>
                {modalMode === 'new' ? 'New agency' : 'Edit agency'}
              </h3>
              <IconBtn label="Close" onClick={() => setModalMode(null)}><X size={13} /></IconBtn>
            </div>

            {formError && (
              <div role="alert" style={{ ...banner('red'), marginBottom: '14px' }}>
                <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--red)' }}>{formError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Name *">
                <input
                  value={form.name}
                  onChange={e => change('name', e.target.value)}
                  maxLength={MAX_AGENCY_NAME_LENGTH}
                  placeholder="e.g. Indian Space Research Organisation"
                  autoFocus
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Short name" hint="shown as (ISRO)">
                  <input
                    value={form.shortName}
                    onChange={e => change('shortName', e.target.value)}
                    maxLength={MAX_SHORT_NAME_LENGTH}
                    placeholder="ISRO"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={form.country}
                    onChange={e => change('country', e.target.value)}
                    placeholder="India"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </Field>
              </div>

              <Field label="Slug" hint={form.slug ? `/${form.slug}` : 'derived from the name'}>
                <input
                  value={form.slug}
                  onChange={e => change('slug', agencySlug(e.target.value))}
                  placeholder="isro"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Field>

              <Field label="Website">
                <input
                  value={form.websiteUrl}
                  onChange={e => change('websiteUrl', e.target.value)}
                  placeholder="isro.gov.in"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Field>

              <Field label="Logo" hint="pick from the Media Library or paste a URL">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={form.logoUrl}
                    onChange={e => change('logoUrl', e.target.value)}
                    placeholder="https://…"
                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => change('_showLogoPicker', !form._showLogoPicker)}
                    style={footerBtn(false)}
                  >
                    {form._showLogoPicker ? 'Close' : 'Browse'}
                  </button>
                </div>
                {form._showLogoPicker && (
                  <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <MediaLibrary
                      pickerMode
                      defaultBucket="article-images"
                      onPick={url => { change('logoUrl', url); change('_showLogoPicker', false) }}
                    />
                  </div>
                )}
              </Field>

              <Field label="Description" hint="shown on the agency's missions">
                <textarea
                  value={form.description}
                  onChange={e => change('description', e.target.value)}
                  rows={3}
                  placeholder="What the agency is and what it operates…"
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6 }}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModalMode(null)} style={footerBtn(false)}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={footerBtn(true, saving)}>
                <Save size={12} />
                {saving ? 'Saving…' : modalMode === 'new' ? 'Create Agency' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Backdrop onClose={() => setDeleteTarget(null)}>
          <div style={{ ...dialogBox, borderColor: 'rgba(var(--red-rgb),0.3)' }}>
            <h3 style={dialogTitle}>Delete agency?</h3>
            <p style={dialogBody}>
              <strong style={{ color: 'var(--white)' }}>{deleteTarget.name}</strong> will be
              permanently deleted. It will disappear from the mission editor&rsquo;s agency fields.
            </p>
            {deleteError && (
              <div role="alert" style={{ ...banner('red'), marginBottom: '18px' }}>
                <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--red)', lineHeight: 1.5 }}>
                  {deleteError}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={footerBtn(false)}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  ...footerBtn(true, deleting),
                  background: deleting ? 'rgba(var(--red-rgb),0.5)' : 'var(--red)',
                  color: 'var(--white)',
                }}
              >
                <Trash2 size={12} />
                {deleting ? 'Deleting…' : 'Delete Agency'}
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </>
  )
}

// ── Bits ──────────────────────────────────────────────────────

function Logo({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}   // fall back to initials, not a blank gap
        style={{ width: 34, height: 34, borderRadius: '6px', objectFit: 'contain', background: 'rgba(var(--ink),0.04)', border: '1px solid var(--border)' }}
      />
    )
  }
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '6px', flexShrink: 0,
      background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid rgba(var(--accent-rgb),0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.02em',
    }}>
      {name.slice(0, 4).toUpperCase() || <Building2 size={15} />}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px', gap: '10px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.02em' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--modal-scrim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function IconBtn({
  children, label, onClick, disabled, tone,
}: {
  children: React.ReactNode
  label:    string
  onClick:  () => void
  disabled?: boolean
  tone?:    'red'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '6px',
        background: 'transparent', border: '1px solid var(--border)',
        color: tone === 'red' ? 'var(--red)' : 'rgba(var(--ink),0.72)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── Style helpers ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding:      '9px 12px',
  background:   'var(--black)',
  border:       '1px solid var(--border)',
  borderRadius: '7px',
  color:        'var(--white)',
  fontFamily:   'var(--font-sans)',
  fontSize:     '14px',
  outline:      'none',
  boxSizing:    'border-box',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  padding: '9px 16px', borderRadius: '7px', border: 'none',
  background: 'var(--accent)', color: 'var(--black)',
  fontFamily: 'var(--font-mono)', fontSize: '13px',
  letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
}

function banner(tone: 'red' | 'accent'): React.CSSProperties {
  const rgb = tone === 'red' ? '--red-rgb' : '--accent-rgb'
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '8px',
    background: `rgba(var(${rgb}),0.08)`,
    border: `1px solid rgba(var(${rgb}),0.25)`,
  }
}

const dialogBox: React.CSSProperties = {
  background: 'var(--black)', border: '1px solid var(--border-hi)',
  borderRadius: '12px', padding: '26px', maxWidth: '440px', width: '100%',
}

const dialogTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--white)', margin: '0 0 10px',
}

const dialogBody: React.CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: '15px',
  color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, margin: '0 0 20px',
}

function footerBtn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '7px', whiteSpace: 'nowrap',
    background: primary ? (disabled ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)') : 'transparent',
    border: primary ? 'none' : '1px solid var(--border)',
    color: primary ? 'var(--black)' : 'rgba(var(--ink),0.82)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
