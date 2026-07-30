'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Save, X, AlertCircle, Check, FileText, Layers,
} from 'lucide-react'
import type { AdminCategoryRow } from '@/modules/admin/services/adminCategories'
import {
  categorySlug, normalizeCategoryName, normalizeHexColor, isReservedCategoryName,
  MAX_CATEGORY_NAME_LENGTH,
} from './categoryFields'

/**
 * The Categories screen.
 *
 * Categories were fixed in three places at once: no write path to the table, the
 * ten seeded names hardcoded in a TypeScript union, and the same ten hardcoded
 * again in the public listing's filter rail. The union is now `string` and the
 * rail reads the table, so a category created here reaches readers.
 *
 * Editorially heavier than a tag, which is why this is a screen rather than a
 * type-to-create field in the editor: the name is what the public filter URL
 * carries, and the colour is what the article page tints the label with.
 */

const DEFAULT_COLOR = '#4f8ef7'

interface FormState {
  name:  string
  slug:  string
  color: string
}

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [notice,     setNotice]     = useState('')

  const [modalMode,    setModalMode]    = useState<'new' | 'edit' | null>(null)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [originalName, setOriginalName] = useState('')
  const [form,         setForm]         = useState<FormState>({ name: '', slug: '', color: DEFAULT_COLOR })
  const [formError,    setFormError]    = useState('')
  const [saving,       setSaving]       = useState(false)
  const [slugEdited,   setSlugEdited]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setCategories(json.categories || [])
    } catch {
      setError('Could not load categories. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const unusedCount = useMemo(
    () => categories.filter(c => c.articleCount === 0).length,
    [categories],
  )

  // Renaming changes the public filter URL, because the listing filters on the
  // category NAME. Worth saying before the save, not after.
  const renameWarning = modalMode === 'edit'
    && normalizeCategoryName(form.name) !== originalName
    && originalName.length > 0

  function change<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => {
      if (key === 'name') {
        const name = val as string
        return { ...f, name, slug: slugEdited ? f.slug : categorySlug(name) }
      }
      return { ...f, [key]: val }
    })
    if (key === 'slug') setSlugEdited(true)
    setFormError('')
  }

  function openNew() {
    setForm({ name: '', slug: '', color: DEFAULT_COLOR })
    setEditingId(null)
    setOriginalName('')
    setFormError('')
    setSlugEdited(false)
    setModalMode('new')
    setNotice('')
  }

  function openEdit(row: AdminCategoryRow) {
    setForm({ name: row.name, slug: row.slug, color: row.color || DEFAULT_COLOR })
    setEditingId(row.id)
    setOriginalName(row.name)
    setFormError('')
    setSlugEdited(true)   // keep the stored slug stable while the name is edited
    setModalMode('edit')
    setNotice('')
  }

  async function handleSave() {
    const name = normalizeCategoryName(form.name)
    if (!name) { setFormError('Name is required.'); return }
    if (isReservedCategoryName(name)) {
      setFormError('“All” is reserved — the listing uses it for the unfiltered view.')
      return
    }
    if (form.color && !normalizeHexColor(form.color)) {
      setFormError('Colour must be a hex value like #4f8ef7.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const url    = modalMode === 'edit' ? `/api/admin/categories?id=${editingId}` : '/api/admin/categories'
      const method = modalMode === 'edit' ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, slug: form.slug, color: form.color }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setFormError(data?.error || 'Failed to save.'); return }

      setNotice(modalMode === 'edit' ? `Saved “${name}”.` : `Created “${name}”.`)
      setModalMode(null)
      setEditingId(null)
      await fetchCategories()
    } catch {
      setFormError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/categories?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setDeleteError(data?.error || 'Failed to delete category.')
        return
      }
      setNotice(`Deleted “${deleteTarget.name}”.`)
      setDeleteTarget(null)
      await fetchCategories()
    } catch {
      setDeleteError('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
              Categories
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '6px 0 0' }}>
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              {unusedCount > 0 && ` · ${unusedCount} unused`}
            </p>
          </div>
          <button onClick={openNew} style={primaryBtn}>
            <Plus size={13} />
            New Category
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

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '54px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.5 }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '48px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
            <Layers size={28} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              No categories yet
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)', marginTop: '6px', marginBottom: '16px' }}>
              Categories group articles and become the filter chips on /articles.
            </p>
            <button onClick={openNew} style={{ ...primaryBtn, margin: '0 auto' }}>
              <Plus size={12} /> Create Category
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(row => (
              <div
                key={row.id}
                style={{
                  display: 'grid', gridTemplateColumns: '16px minmax(0, 1fr) auto auto',
                  alignItems: 'center', gap: '12px', padding: '11px 14px',
                  background: 'var(--surface)',
                  border: `1px solid ${row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.28)' : 'var(--border)'}`,
                  borderRadius: '8px',
                }}
              >
                <span
                  aria-hidden
                  title={row.color || 'no colour set'}
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: row.color || 'var(--accent)',
                    border: '1px solid rgba(var(--ink),0.2)',
                    opacity: row.color ? 1 : 0.4,
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)', lineHeight: 1.3 }}>
                    {row.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.04em' }}>
                    {row.slug}{row.color ? ` · ${row.color}` : ''}
                  </div>
                </div>

                <span
                  title={`Used on ${row.articleCount} article${row.articleCount === 1 ? '' : 's'}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 9px', borderRadius: '999px', whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
                    background: row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.12)' : 'rgba(var(--ink),0.05)',
                    border: `1px solid ${row.articleCount === 0 ? 'rgba(var(--gold-rgb),0.35)' : 'var(--border)'}`,
                    color: row.articleCount === 0 ? 'var(--gold)' : 'rgba(var(--ink),0.72)',
                  }}
                >
                  <FileText size={11} /> {row.articleCount}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconBtn label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn
                    label={`Delete ${row.name}`}
                    onClick={() => { setDeleteTarget(row); setDeleteError(''); setNotice('') }}
                    tone="red"
                  >
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 16px', background: 'rgba(var(--accent-rgb),0.04)', border: '1px solid rgba(var(--accent-rgb),0.12)', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
            Categories are the filter chips on <code>/articles</code> and the coloured label on an
            article page. The public filter is keyed on the category <em>name</em>, so renaming one
            changes its filter link. A category still used by an article cannot be deleted —
            recategorise those articles first.
          </p>
        </div>
      </div>

      {/* New / edit */}
      {modalMode && (
        <Backdrop onClose={() => setModalMode(null)}>
          <div style={dialogBox}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ ...dialogTitle, margin: 0 }}>
                {modalMode === 'new' ? 'New category' : 'Edit category'}
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
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  placeholder="e.g. Deep Space"
                  autoFocus
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Field>

              <Field label="Slug" hint={form.slug ? form.slug : 'derived from the name'}>
                <input
                  value={form.slug}
                  onChange={e => change('slug', categorySlug(e.target.value))}
                  placeholder="deep-space"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Field>

              <Field label="Colour" hint="tints the label on article pages">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={normalizeHexColor(form.color) || DEFAULT_COLOR}
                    onChange={e => change('color', e.target.value)}
                    aria-label="Category colour"
                    style={{ width: 44, height: 38, padding: 2, background: 'var(--black)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer' }}
                  />
                  <input
                    value={form.color}
                    onChange={e => change('color', e.target.value)}
                    placeholder="#4f8ef7"
                    aria-label="Category colour hex"
                    style={{ ...inputStyle, flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </Field>

              {renameWarning && (
                <div role="status" style={banner('gold')}>
                  <AlertCircle size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)', lineHeight: 1.5 }}>
                    The listing filters on the name, so this rename changes the filter link from
                    {' '}<code>?category={originalName}</code> to <code>?category={normalizeCategoryName(form.name)}</code>.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModalMode(null)} style={footerBtn(false)}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={footerBtn(true, saving)}>
                <Save size={12} />
                {saving ? 'Saving…' : modalMode === 'new' ? 'Create Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Backdrop onClose={() => setDeleteTarget(null)}>
          <div style={{ ...dialogBox, borderColor: 'rgba(var(--red-rgb),0.3)' }}>
            <h3 style={dialogTitle}>Delete category?</h3>
            <p style={dialogBody}>
              <strong style={{ color: 'var(--white)' }}>{deleteTarget.name}</strong> will be
              permanently deleted and will disappear from the filter chips on <code>/articles</code>.
            </p>
            {deleteTarget.articleCount > 0 && (
              <p style={{ ...dialogBody, fontSize: '14px' }}>
                It is used by {deleteTarget.articleCount} article
                {deleteTarget.articleCount === 1 ? '' : 's'}, so this will be refused until they are
                recategorised — a category is how the site files an article, and unfiling published
                work silently is worse than an error.
              </p>
            )}
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
                {deleting ? 'Deleting…' : 'Delete Category'}
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </>
  )
}

// ── Bits ──────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px', gap: '10px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)' }}>
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
  children, label, onClick, tone,
}: {
  children: React.ReactNode
  label:    string
  onClick:  () => void
  tone?:    'red'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0,
        background: 'transparent', border: '1px solid var(--border)',
        color: tone === 'red' ? 'var(--red)' : 'rgba(var(--ink),0.72)',
        cursor: 'pointer',
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

function banner(tone: 'red' | 'accent' | 'gold'): React.CSSProperties {
  const rgb = tone === 'red' ? '--red-rgb' : tone === 'gold' ? '--gold-rgb' : '--accent-rgb'
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '8px',
    background: `rgba(var(${rgb}),0.08)`,
    border: `1px solid rgba(var(${rgb}),0.25)`,
  }
}

const dialogBox: React.CSSProperties = {
  background: 'var(--black)', border: '1px solid var(--border-hi)',
  borderRadius: '12px', padding: '26px', maxWidth: '460px', width: '100%',
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
