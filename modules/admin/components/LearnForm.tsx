'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import { LearnThumb } from '@/modules/learn/components/LearnThumb'
import type { AdminKnowledgeFull } from '@/modules/admin/services/adminKnowledge'
import type { DifficultyLevel } from '@/types/knowledge'
import { Save } from 'lucide-react'

const LEVELS: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
]

interface Props {
  mode:    'new' | 'edit'
  article?: AdminKnowledgeFull
}

interface FormState {
  title:           string
  slug:            string
  excerpt:         string
  content:         string
  difficultyLevel: DifficultyLevel
  icon:            string
  thumbnail:       string
  relatedTopics:   string
  featured:        boolean
  _showMediaPicker: boolean
}

export function LearnForm({ mode, article }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    title:           article?.title           || '',
    slug:            article?.slug            || '',
    excerpt:         article?.excerpt         || '',
    content:         article?.content         || '',
    difficultyLevel: article?.difficultyLevel || 'beginner',
    icon:            article?.icon            || '🔭',
    thumbnail:       article?.thumbnail       || '',
    relatedTopics:   (article?.relatedTopics || []).join(', '),
    featured:        article?.featured        || false,
    _showMediaPicker: false,
  })

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  function handleTitle(val: string) {
    setForm(f => ({ ...f, title: val, slug: slugEdited ? f.slug : slugify(val) }))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.slug.trim())  { setError('Slug is required.');  return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title:           form.title.trim(),
        slug:            form.slug.trim(),
        excerpt:         form.excerpt.trim(),
        content:         form.content.trim(),
        difficultyLevel: form.difficultyLevel,
        icon:            form.icon.trim() || '🔭',
        thumbnail:       form.thumbnail.trim() || null,
        relatedTopics:   form.relatedTopics.split(',').map(t => t.trim()).filter(Boolean),
        featured:        form.featured,
      }

      const url = mode === 'new'
        ? '/api/admin/learn'
        : `/api/admin/learn?id=${article!.id}`

      const res = await fetch(url, {
        method:  mode === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Save failed — please try again.')
        return
      }

      router.push('/admin/learn')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Title */}
      <Field label="Title">
        <input value={form.title} onChange={e => handleTitle(e.target.value)} placeholder="Orbital Mechanics — The Mathematics of Spaceflight" style={inputStyle} />
      </Field>

      {/* Slug */}
      <Field label="Slug" hint={`/learn/${form.slug || '…'}`}>
        <input value={form.slug} onChange={e => { setSlugEdited(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')) }} placeholder="orbital-mechanics" style={inputStyle} />
      </Field>

      {/* Difficulty + icon + featured */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '14px' }}>
        <Field label="Difficulty">
          <select value={form.difficultyLevel} onChange={e => set('difficultyLevel', e.target.value as DifficultyLevel)} style={inputStyle}>
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </Field>
        <Field label="Icon (emoji)">
          <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🚀" maxLength={4} style={{ ...inputStyle, textAlign: 'center', fontSize: '18px' }} />
        </Field>
      </div>

      {/* Excerpt */}
      <Field label="Excerpt" hint="Shown on the card, 1–2 sentences">
        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} maxLength={300} placeholder="Kepler's laws, escape velocity, Hohmann transfers…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
      </Field>

      {/* Thumbnail */}
      <Field label="Thumbnail" hint="Upload/pick an image, or leave empty for a generated cover">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="https://… or pick from Media Library →" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => set('_showMediaPicker', !form._showMediaPicker)} style={{ flexShrink: 0, padding: '0 14px', background: form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.05)', border: '1px solid', borderColor: form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.12)', borderRadius: '6px', color: form._showMediaPicker ? 'var(--black)' : 'rgba(var(--ink),0.9)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {form._showMediaPicker ? '✕ Close' : '📁 Browse'}
          </button>
        </div>

        {form._showMediaPicker && (
          <div style={{ marginTop: '12px', padding: '20px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <MediaLibrary
              pickerMode
              defaultBucket="article-images"
              onPick={(url: string) => { set('thumbnail', url); set('_showMediaPicker', false) }}
            />
          </div>
        )}

        {/* Live card cover preview (real image, or generated fallback) */}
        {!form._showMediaPicker && (
          <div style={{ marginTop: '12px', maxWidth: '280px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <LearnThumb icon={form.icon} seed={form.slug || form.title || 'preview'} image={form.thumbnail || null} height="150px" />
          </div>
        )}
      </Field>

      {/* Related topics */}
      <Field label="Related topics" hint="Comma-separated (e.g. Kepler, Delta-V, Orbits)">
        <input value={form.relatedTopics} onChange={e => set('relatedTopics', e.target.value)} placeholder="Kepler, Delta-V, Orbits" style={inputStyle} />
      </Field>

      {/* Content */}
      <Field label="Content" hint="Full article body (Markdown / HTML supported by the reader)">
        <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={12} placeholder="Write the lesson…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
      </Field>

      {/* Featured */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.9)', letterSpacing: '0.04em' }}>Feature this topic</span>
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', background: 'var(--accent)', color: 'var(--black)', border: 'none', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          <Save size={13} />
          {saving ? 'Saving…' : mode === 'new' ? 'Create topic' : 'Save changes'}
        </button>
        <button onClick={() => router.push('/admin/learn')} disabled={saving} style={{ padding: '11px 22px', background: 'transparent', color: 'rgba(var(--ink),0.82)', border: '1px solid var(--border)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  color: 'var(--white)',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  outline: 'none',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '7px', gap: '10px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.78)' }}>{label}</span>
        {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.78)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}
