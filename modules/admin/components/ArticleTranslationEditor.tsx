'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, AlertCircle, Globe } from 'lucide-react'
import { getLanguage, type LanguageCode } from '@/lib/i18n'

interface EnglishSource {
  title:   string
  excerpt: string
  content: string
}

// Editor for ONE non-English translation of an article. Loads the existing
// translation (if any) on mount, and saves/deletes via the admin translations
// API. Shared fields (slug, author, categories, image, publish date) are NOT
// here — they live on the English article and apply to every language.
export function ArticleTranslationEditor({
  articleId, lang, english,
}: {
  articleId: string
  lang:      LanguageCode
  english:   EnglishSource
}) {
  const langLabel = getLanguage(lang).native

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [exists,  setExists]  = useState(false)

  const [title,       setTitle]       = useState('')
  const [excerpt,     setExcerpt]     = useState('')
  const [content,     setContent]     = useState('')
  const [isPublished, setIsPublished] = useState(false)

  // Load the existing translation for this language.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch(`/api/admin/articles/translations?articleId=${articleId}&lang=${lang}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return
        const t = data.translation
        if (t) {
          setExists(true)
          setTitle(t.title || '')
          setExcerpt(t.excerpt || '')
          setContent(t.content || '')
          setIsPublished(Boolean(t.isPublished))
        } else {
          setExists(false)
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load the translation.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [articleId, lang])

  async function handleSave() {
    if (!title.trim())   { setError('Title is required.');   return }
    if (!content.trim()) { setError('Content is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/articles/translations?articleId=${articleId}&lang=${lang}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, excerpt, content, isPublished }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save translation.'); return }
      setExists(true)
      setSuccess(isPublished ? `${langLabel} translation published.` : `${langLabel} translation saved (hidden).`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete the ${langLabel} translation? This cannot be undone.`)) return
    setDeleting(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/articles/translations?articleId=${articleId}&lang=${lang}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to delete translation.'); return }
      setExists(false)
      setTitle(''); setExcerpt(''); setContent(''); setIsPublished(false)
      setSuccess(`${langLabel} translation removed.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', padding: '24px 0' }}>Loading {langLabel} translation…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '820px' }}>

      {/* Context banner */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '8px' }}>
        <Globe size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, color: 'rgba(var(--ink),0.8)' }}>
          You&rsquo;re writing the <strong>{langLabel}</strong> version of this article. The slug, author, categories, tags,
          image, view count and publish date are shared from the English article — only the text below changes per language.
        </span>
      </div>

      {/* Error / success */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px' }}>
          <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)' }}>
          ✓ {success}
        </div>
      )}

      {/* Title */}
      <Field label={`Title (${langLabel})`} english={english.title}>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setError('') }}
          placeholder={`${langLabel} title…`}
          lang={lang}
          style={inputStyle(true)}
        />
      </Field>

      {/* Excerpt */}
      <Field label={`Excerpt (${langLabel})`} english={english.excerpt}>
        <textarea
          value={excerpt}
          onChange={e => { setExcerpt(e.target.value); setError('') }}
          placeholder={`${langLabel} summary…`}
          rows={3}
          lang={lang}
          style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.6 }}
        />
      </Field>

      {/* Content — English reference beside the translation */}
      <div>
        <label style={labelStyle}>Content ({langLabel}) — HTML</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
          <div>
            <p style={refHintStyle}>English (reference)</p>
            <textarea
              value={english.content}
              readOnly
              rows={20}
              style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '13px', opacity: 0.7, cursor: 'default' }}
            />
          </div>
          <div>
            <p style={refHintStyle}>{langLabel} (translate here)</p>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setError('') }}
              placeholder={'<p>अनुवाद यहाँ लिखें…</p>'}
              rows={20}
              lang={lang}
              style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '14px' }}
            />
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', margin: '6px 0 0', letterSpacing: '0.04em' }}>
          Keep the same HTML tags as the English version — translate only the words between them.
        </p>
      </div>

      {/* Publish toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <div
          onClick={() => setIsPublished(v => !v)}
          style={{
            width: '32px', height: '18px', borderRadius: '9px',
            background: isPublished ? 'var(--green)' : 'var(--raised)',
            border: `1px solid ${isPublished ? 'var(--green)' : 'var(--border-hi)'}`,
            position: 'relative', transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', top: '2px', left: isPublished ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: isPublished ? 'var(--black)' : 'rgba(var(--ink),0.62)', transition: 'left 0.2s' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(var(--ink),0.85)' }}>
          Show this {langLabel} translation to readers
          <span style={{ color: 'rgba(var(--ink),0.55)' }}> — off = readers see English</span>
        </span>
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
        <button onClick={handleSave} disabled={saving || deleting} style={btnStyle(true, saving || deleting)}>
          <Save size={12} />
          {saving ? 'Saving…' : exists ? 'Save translation' : 'Create translation'}
        </button>
        {exists && (
          <button onClick={handleDelete} disabled={saving || deleting} style={btnStyle(false, saving || deleting)}>
            <Trash2 size={12} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-components / styles ───────────────────────────────────

function Field({ label, english, children }: { label: string; english: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {english && (
        <p style={{ ...refHintStyle, marginBottom: '6px' }}>
          EN: <span style={{ color: 'rgba(var(--ink),0.55)' }}>{english}</span>
        </p>
      )}
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)', display: 'block', marginBottom: '6px',
}

const refHintStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
  color: 'rgba(var(--ink),0.7)', margin: '0 0 4px',
}

function inputStyle(large: boolean): React.CSSProperties {
  return {
    width: '100%', padding: large ? '12px 14px' : '9px 12px',
    background: 'var(--black)', border: '1px solid var(--border)', borderRadius: '7px',
    color: 'var(--white)', fontFamily: large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize: large ? '20px' : '14px', outline: 'none', boxSizing: 'border-box', display: 'block',
  }
}

function btnStyle(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '9px 18px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '14px',
    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    background: primary ? 'var(--accent)' : 'transparent',
    color: primary ? 'var(--black)' : 'var(--red)',
    border: primary ? 'none' : '1px solid rgba(231,76,60,0.4)',
    transition: 'all 0.15s',
  }
}
