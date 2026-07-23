'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, AlertCircle, Globe } from 'lucide-react'
import { getLanguage, type LanguageCode } from '@/lib/i18n'

export interface FieldSpec {
  key:   string
  label: string
  type:  'input' | 'textarea' | 'code'
  rows?: number
}

// Generic editor for ONE non-English translation of any entity (learn article,
// mission, …). Fields are configurable; it loads/saves via the given API
// endpoint (`?<idParam>=<entityId>&lang=<lang>`). Shared fields (slug, media,
// publish state) live on the English entity and are NOT edited here.
export function TranslationEditor({
  endpoint, idParam, entityId, lang, fields, english, requiredKeys = [],
}: {
  endpoint:     string
  idParam:      string
  entityId:     string
  lang:         LanguageCode
  fields:       FieldSpec[]
  english:      Record<string, string>
  requiredKeys?: string[]
}) {
  const langLabel = getLanguage(lang).native
  const url = `${endpoint}?${idParam}=${entityId}&lang=${lang}`

  const emptyValues = () => Object.fromEntries(fields.map(f => [f.key, ''])) as Record<string, string>

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [exists, setExists]     = useState(false)
  const [values, setValues]     = useState<Record<string, string>>(emptyValues())
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return
        const t = data.translation
        if (t) {
          setExists(true)
          setValues(Object.fromEntries(fields.map(f => [f.key, t[f.key] || ''])) as Record<string, string>)
          setIsPublished(Boolean(t.isPublished))
        } else {
          setExists(false)
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load the translation.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, lang])

  function setField(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val })); setError('')
  }

  async function handleSave() {
    for (const key of requiredKeys) {
      if (!(values[key] || '').trim()) {
        const f = fields.find(x => x.key === key)
        setError(`${f?.label || key} is required.`); return
      }
    }
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, isPublished }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save translation.'); return }
      setExists(true)
      setSuccess(isPublished ? `${langLabel} translation published.` : `${langLabel} translation saved (hidden).`)
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Something went wrong. Try again.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete the ${langLabel} translation? This cannot be undone.`)) return
    setDeleting(true); setError(''); setSuccess('')
    try {
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to delete translation.'); return }
      setExists(false); setValues(emptyValues()); setIsPublished(false)
      setSuccess(`${langLabel} translation removed.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Something went wrong. Try again.') }
    finally { setDeleting(false) }
  }

  if (loading) {
    return <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', padding: '24px 0' }}>Loading {langLabel} translation…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '820px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '8px' }}>
        <Globe size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, color: 'rgba(var(--ink),0.8)' }}>
          You&rsquo;re writing the <strong>{langLabel}</strong> version. Slug, media, and publish state are shared from the
          English entity — only the text below changes per language.
        </span>
      </div>

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

      {fields.map(f => (
        <div key={f.key}>
          <label style={labelStyle}>{f.label} ({langLabel})</label>
          {f.type === 'code' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              <div>
                <p style={refHintStyle}>English (reference)</p>
                <textarea value={english[f.key] || ''} readOnly rows={f.rows || 18}
                  style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '13px', opacity: 0.7, cursor: 'default' }} />
              </div>
              <div>
                <p style={refHintStyle}>{langLabel} (translate here)</p>
                <textarea value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} rows={f.rows || 18} lang={lang}
                  style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '14px' }} />
              </div>
            </div>
          ) : (
            <>
              {english[f.key] && (
                <p style={{ ...refHintStyle, marginBottom: '6px' }}>EN: <span style={{ color: 'rgba(var(--ink),0.55)' }}>{english[f.key]}</span></p>
              )}
              {f.type === 'textarea' ? (
                <textarea value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} rows={f.rows || 3} lang={lang}
                  style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.6 }} />
              ) : (
                <input value={values[f.key] || ''} onChange={e => setField(f.key, e.target.value)} lang={lang} style={inputStyle(true)} />
              )}
            </>
          )}
        </div>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <div onClick={() => setIsPublished(v => !v)} style={{ width: '32px', height: '18px', borderRadius: '9px', background: isPublished ? 'var(--green)' : 'var(--raised)', border: `1px solid ${isPublished ? 'var(--green)' : 'var(--border-hi)'}`, position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '2px', left: isPublished ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: isPublished ? 'var(--black)' : 'rgba(var(--ink),0.62)', transition: 'left 0.2s' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', color: 'rgba(var(--ink),0.85)' }}>
          Show this {langLabel} translation to readers
          <span style={{ color: 'rgba(var(--ink),0.55)' }}> — off = readers see English</span>
        </span>
      </label>

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
    border: primary ? 'none' : '1px solid rgba(231,76,60,0.4)', transition: 'all 0.15s',
  }
}
