'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, User, Star, FileText, X, Save, AlertCircle, ExternalLink } from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import { slugify } from '@/lib/utils'
import type { AdminAuthorRow, AdminAuthorFull, SocialLinks } from '@/modules/admin/services/adminAuthors'

// ── Form state ────────────────────────────────────────────────

interface FormState {
  name:             string
  slug:             string
  bio:              string
  avatar:           string
  twitter:          string
  linkedin:         string
  website:          string
  featured:         boolean
  _showAvatarPicker: boolean
}

const EMPTY_FORM: FormState = {
  name:              '',
  slug:              '',
  bio:               '',
  avatar:            '',
  twitter:           '',
  linkedin:          '',
  website:           '',
  featured:          false,
  _showAvatarPicker: false,
}

function authorToForm(a: AdminAuthorFull): FormState {
  return {
    name:              a.name,
    slug:              a.slug,
    bio:               a.bio,
    avatar:            a.avatar,
    twitter:           a.socialLinks?.twitter  || '',
    linkedin:          a.socialLinks?.linkedin || '',
    website:           a.socialLinks?.website  || '',
    featured:          a.featured,
    _showAvatarPicker: false,
  }
}

// ── Helpers ───────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Prepend https:// when the user omits the protocol, so byline links aren't
// treated as relative paths. Empty → undefined.
function normalizeUrl(v: string): string | undefined {
  const t = v.trim()
  if (!t) return undefined
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

// ── Avatar ────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])   // reset when the URL changes (e.g. editing)
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
        onError={() => setFailed(true)}   // fall back to initials instead of a blank gap
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: size * 0.33, color: 'var(--accent)',
      fontWeight: 700,
    }}>
      {initials || <User size={size * 0.45} />}
    </div>
  )
}

// ── Author row ────────────────────────────────────────────────

function AuthorRow({
  author,
  onEdit,
  onDelete,
}: {
  author:   AdminAuthorRow
  onEdit:   (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div style={{
      display:       'grid',
      gridTemplateColumns: '44px 1fr auto',
      alignItems:    'center',
      gap:           '14px',
      padding:       '14px 16px',
      background:    'var(--surface)',
      border:        '1px solid var(--border)',
      borderRadius:  '8px',
      transition:    'border-color 0.15s',
    }}>
      <Avatar src={author.avatar} name={author.name} size={36} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--white)', lineHeight: 1.2 }}>
            {author.name}
          </span>
          {author.featured && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 6px', borderRadius: '4px',
              background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.25)',
              fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--gold)',
            }}>
              <Star size={8} /> Featured
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
          {author.bio && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
              {author.bio}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.06em', flexShrink: 0 }}>
            <FileText size={9} />
            {author.articleCount} {author.articleCount === 1 ? 'article' : 'articles'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.72)', letterSpacing: '0.04em', flexShrink: 0 }}>
            Added {formatDate(author.createdAt)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onEdit(author.id)}
          style={actionBtn(false)}
          title="Edit author"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(author.id, author.name)}
          style={actionBtn(true)}
          title="Delete author"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────

function AuthorModal({
  mode,
  form,
  saving,
  error,
  onChange,
  onSave,
  onClose,
}: {
  mode:     'new' | 'edit'
  form:     FormState
  saving:   boolean
  error:    string
  onChange: (key: keyof FormState, val: any) => void
  onSave:   () => void
  onClose:  () => void
}) {
  return (
    <div style={{
      position:       'fixed', inset: 0, zIndex: 200,
      background:     'rgba(10,10,15,0.85)',
      display:        'flex', alignItems: 'center', justifyContent: 'center',
      padding:        '20px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        onKeyDown={e => {
          if (e.key === 'Escape') { onClose(); return }
          // Enter on a single-line field saves; textarea + the picker are exempt.
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && !form._showAvatarPicker && !saving) {
            e.preventDefault()
            onSave()
          }
        }}
        style={{
        background:   'var(--black)',
        border:       '1px solid var(--border)',
        borderRadius: '12px',
        width:        '100%',
        maxWidth:     '560px',
        maxHeight:    '90vh',
        overflowY:    'auto',
        display:      'flex',
        flexDirection:'column',
      }}>

        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
            {mode === 'new' ? 'New Author' : 'Edit Author'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(var(--ink),0.82)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px' }}>
              <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
            </div>
          )}

          {/* Avatar preview + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar src={form.avatar || null} name={form.name || '?'} size={56} />
            <div style={{ flex: 1 }}>
              <FieldLabel>Full Name *</FieldLabel>
              <input
                value={form.name}
                onChange={e => onChange('name', e.target.value)}
                placeholder="e.g. Aditya Sharma"
                style={inputStyle({ large: true })}
                autoFocus
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <FieldLabel hint={`/authors/${form.slug || '…'}`}>Slug</FieldLabel>
            <input
              value={form.slug}
              onChange={e => onChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="author-name"
              style={inputStyle({})}
            />
          </div>

          {/* Avatar URL */}
          <div>
            <FieldLabel hint="Upload via Media Library or paste a URL">Avatar Image</FieldLabel>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input
                value={form.avatar}
                onChange={e => onChange('avatar', e.target.value)}
                placeholder="https://… or pick from Media Library →"
                style={{ ...inputStyle({}), flex: 1 }}
              />
              <button
                type="button"
                onClick={() => onChange('_showAvatarPicker', !form._showAvatarPicker)}
                style={{
                  flexShrink: 0, padding: '0 12px',
                  background:  form._showAvatarPicker ? 'var(--accent)' : 'rgba(var(--ink),0.05)',
                  border:      '1px solid',
                  borderColor: form._showAvatarPicker ? 'var(--accent)' : 'rgba(var(--ink),0.12)',
                  borderRadius:'6px',
                  color:       form._showAvatarPicker ? 'var(--black)' : 'rgba(var(--ink),0.9)',
                  fontFamily:  'var(--font-mono)', fontSize: '13px',
                  letterSpacing:'0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >
                {form._showAvatarPicker ? '✕ Close' : '📁 Browse'}
              </button>
            </div>
            {form._showAvatarPicker && (
              <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <MediaLibrary
                  pickerMode
                  defaultBucket="article-images"
                  onPick={url => { onChange('avatar', url); onChange('_showAvatarPicker', false) }}
                />
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <FieldLabel hint="Shown on article pages">Bio</FieldLabel>
            <textarea
              value={form.bio}
              onChange={e => onChange('bio', e.target.value)}
              placeholder="Short bio — who they are, what they cover…"
              rows={3}
              style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* Social links */}
          <div>
            <FieldLabel>Social Links</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                { key: 'twitter',  placeholder: 'https://twitter.com/username',     label: '𝕏 Twitter'  },
                { key: 'linkedin', placeholder: 'https://linkedin.com/in/username', label: 'LinkedIn'  },
                { key: 'website',  placeholder: 'https://yoursite.com',             label: 'Website'   },
              ] as const).map(({ key, placeholder, label }) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.78)' }}>
                    {label}
                  </span>
                  <input
                    value={form[key]}
                    onChange={e => onChange(key, e.target.value)}
                    placeholder={placeholder}
                    style={inputStyle({})}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Featured toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div
              onClick={() => onChange('featured', !form.featured)}
              style={{
                width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
                background: form.featured ? 'var(--accent)' : 'var(--raised)',
                border: `1px solid ${form.featured ? 'var(--accent)' : 'var(--border-hi)'}`,
                position: 'relative', transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: '2px',
                left: form.featured ? '14px' : '2px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: form.featured ? 'var(--black)' : 'rgba(var(--ink),0.62)',
                transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
                Featured author
              </span>
              <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.78)' }}>
                Mark as a highlighted contributor
              </p>
            </div>
          </label>

        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={footerBtn(false)}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={footerBtn(true, saving)}>
            <Save size={12} />
            {saving ? 'Saving…' : mode === 'new' ? 'Create Author' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function AuthorsAdmin() {
  const [authors,     setAuthors]     = useState<AdminAuthorRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [modalMode,   setModalMode]   = useState<'new' | 'edit' | null>(null)
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [deleteTarget,setDeleteTarget]= useState<{ id: string; name: string } | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [slugEdited,  setSlugEdited]  = useState(false)

  // ── Fetch ────────────────────────────────────────────────

  const fetchAuthors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/authors', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setAuthors(json.authors || [])
    } catch {
      setError('Could not load authors. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAuthors() }, [fetchAuthors])

  // ── Form helpers ─────────────────────────────────────────

  function handleChange(key: keyof FormState, val: any) {
    setForm(f => {
      // Auto-fill the slug from the name until the admin edits the slug directly.
      if (key === 'name' && !slugEdited) return { ...f, name: val, slug: slugify(val) }
      return { ...f, [key]: val }
    })
    if (key === 'slug') setSlugEdited(true)
    setFormError('')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setSlugEdited(false)
    setModalMode('new')
  }

  async function openEdit(id: string) {
    setFormError('')
    setEditingId(id)
    setModalMode('edit')
    setSlugEdited(true) // keep the existing slug stable when the name is edited
    setForm(EMPTY_FORM) // show modal immediately with empty while fetching

    const res  = await fetch(`/api/admin/authors?id=${id}`, { cache: 'no-store' })
    if (!res.ok) { setFormError('Could not load author data.'); return }
    const data: AdminAuthorFull = await res.json()
    setForm(authorToForm(data))
  }

  function closeModal() {
    setModalMode(null)
    setEditingId(null)
    setFormError('')
  }

  // ── Save ─────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return }

    setSaving(true); setFormError('')

    const payload = {
      name:        form.name.trim(),
      slug:        form.slug.trim(),
      bio:         form.bio.trim()    || null,
      avatar:      form.avatar.trim() || null,
      socialLinks: {
        twitter:  normalizeUrl(form.twitter),
        linkedin: normalizeUrl(form.linkedin),
        website:  normalizeUrl(form.website),
      },
      featured: form.featured,
    }

    try {
      const url    = modalMode === 'edit' ? `/api/admin/authors?id=${editingId}` : '/api/admin/authors'
      const method = modalMode === 'edit' ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) { setFormError(data.error || 'Failed to save.'); return }

      closeModal()
      await fetchAuthors()
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
    try {
      const res = await fetch(`/api/admin/authors?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { setError('Failed to delete author.'); return }
      setDeleteTarget(null)
      await fetchAuthors()
    } catch {
      setError('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
              Authors
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '6px 0 0' }}>
              {authors.length} {authors.length === 1 ? 'author' : 'authors'} · Manage contributor profiles
            </p>
          </div>
          <button onClick={openNew} style={primaryBtn}>
            <Plus size={13} />
            New Author
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px' }}>
            <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}

        {/* Author list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '68px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.5 }} />
            ))}
          </div>
        ) : authors.length === 0 ? (
          <div style={{ padding: '48px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
            <User size={28} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              No authors yet
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)', marginTop: '6px', marginBottom: '16px' }}>
              Create your first author profile — start with yourself
            </p>
            <button onClick={openNew} style={{ ...primaryBtn, margin: '0 auto' }}>
              <Plus size={12} /> Create Author
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {authors.map(author => (
              <AuthorRow
                key={author.id}
                author={author}
                onEdit={openEdit}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}
          </div>
        )}

        {/* Info note */}
        <div style={{ padding: '12px 16px', background: 'rgba(79,142,247,0.04)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
            Author profiles appear on article pages when assigned in the Article editor. Avatar and name display in the article byline. Create your own profile first, then assign it to your articles via the Article editor.
          </p>
        </div>

      </div>

      {/* Edit / New modal */}
      {modalMode && (
        <AuthorModal
          mode={modalMode}
          form={form}
          saving={saving}
          error={formError}
          onChange={handleChange}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,10,15,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
        >
          <div style={{ background: 'var(--black)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--white)', margin: '0 0 10px' }}>
              Delete author?
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.78)', lineHeight: 1.6, margin: '0 0 20px' }}>
              <strong style={{ color: 'var(--white)' }}>{deleteTarget.name}</strong> will be permanently deleted. Articles assigned to this author will become unattributed — they won't be deleted.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={footerBtn(false)}>Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ ...footerBtn(true, deleting), background: deleting ? 'rgba(231,76,60,0.5)' : 'var(--red)', color: 'var(--white)' }}
              >
                <Trash2 size={12} />
                {deleting ? 'Deleting…' : 'Delete Author'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Style helpers ─────────────────────────────────────────────

function inputStyle({ large }: { large?: boolean }): React.CSSProperties {
  return {
    width: '100%', padding: large ? '10px 14px' : '9px 12px',
    background: 'var(--black)', border: '1px solid var(--border)',
    borderRadius: '7px', color: 'var(--white)',
    fontFamily: large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize: large ? '17px' : '13px',
    outline: 'none', boxSizing: 'border-box', display: 'block',
    transition: 'border-color 0.2s',
  }
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
        {children}
      </label>
      {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)' }}>{hint}</span>}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  padding: '9px 16px', borderRadius: '7px',
  background: 'var(--accent)', border: 'none',
  color: 'var(--black)', fontFamily: 'var(--font-mono)',
  fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase',
  fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
}

function actionBtn(danger: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '6px',
    background: 'transparent',
    border: `1px solid ${danger ? 'rgba(231,76,60,0.15)' : 'var(--border)'}`,
    color: danger ? 'rgba(231,76,60,0.6)' : 'rgba(var(--ink),0.62)',
    cursor: 'pointer', transition: 'all 0.15s',
  }
}

function footerBtn(primary: boolean, disabled?: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '6px',
    background: primary ? 'var(--accent)' : 'var(--surface)',
    border: primary ? 'none' : '1px solid var(--border-hi)',
    color: primary ? 'var(--black)' : 'rgba(var(--ink),0.9)',
    fontFamily: 'var(--font-mono)', fontSize: '14px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s',
  }
}
