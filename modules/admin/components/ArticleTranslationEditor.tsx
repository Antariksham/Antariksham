'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Save, Trash2, AlertCircle, Globe, Pencil, Columns2, Eye,
  Check, AlertTriangle, XCircle,
} from 'lucide-react'
import { getLanguage, HI_SERIF, type LanguageCode } from '@/lib/i18n'
import { ContentEditorField } from '@/modules/admin/editor/ContentEditorField'
import { useAutosave, AutosaveSkip } from '@/modules/admin/editor/useAutosave'
import { SaveStatus } from '@/modules/admin/editor/SaveStatus'
import { useDebouncedValue } from '@/modules/admin/editor/useDebouncedValue'
import { compareStructure } from '@/modules/admin/editor/translationChecks'
import { wordCountFromHtml } from '@/modules/admin/editor/sanitizeHtml'
import { ArticlePreview } from '@/modules/admin/preview/ArticlePreview'
import { readingTime } from '@/lib/utils'
import type { ArticleRenderModel } from '@/modules/articles/components/ArticleBody'
import type { ArticleType, FeaturedImageMeta } from '@/types/article'

interface EnglishSource {
  title:   string
  excerpt: string
  content: string
}

// Metadata shared from the English article (slug, image, taxonomy, author,
// dates are per-article, not per-language). Used so the translation's live
// preview looks exactly like the published /hi page will.
export interface SharedArticleContext {
  featuredImage:     string | null
  featuredImageMeta: FeaturedImageMeta | null
  categories:        string[]
  tags:              string[]
  authorName:        string | null
  publishedAt:       string | null
  articleType:       ArticleType
}

type ViewMode = 'editor' | 'split' | 'preview'

// Editor for ONE non-English translation of an article. Feature-parity with the
// English editor where it makes sense: rich block editor (Devanagari-aware),
// live device preview via the shared production renderer, autosave with draft
// recovery, and a translation pre-flight that enforces the "same HTML tags,
// different words" rule by comparing structure against the English body.
// Shared fields (slug, author, categories, image, publish date) are NOT here —
// they live on the English article and apply to every language.
export function ArticleTranslationEditor({
  articleId, lang, english, shared,
}: {
  articleId: string
  lang:      LanguageCode
  english:   EnglishSource
  shared?:   SharedArticleContext
}) {
  const langLabel = getLanguage(lang).native
  const apiUrl = `/api/admin/articles/translations?articleId=${articleId}&lang=${lang}`

  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,   setError]     = useState('')
  const [success, setSuccess]   = useState('')
  const [exists,  setExists]    = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('editor')

  const [title,       setTitle]       = useState('')
  const [excerpt,     setExcerpt]     = useState('')
  const [content,     setContent]     = useState('')
  const [isPublished, setIsPublished] = useState(false)

  // Load the existing translation for this language.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch(apiUrl)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, lang])

  // ── Autosave ────────────────────────────────────────────────
  const snapshot = useMemo(
    () => ({ title, excerpt, content, isPublished }),
    [title, excerpt, content, isPublished],
  )

  // Server autosave only once the translation exists (created via the manual
  // button); before that we keep a local backup only — mirroring how the
  // English editor treats a not-yet-created article.
  const serverSave = useMemo(() => {
    if (!exists) return undefined
    return async (d: typeof snapshot) => {
      if (!d.title.trim() || !d.content.trim()) throw new AutosaveSkip()
      const res = await fetch(apiUrl, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(d),
      })
      if (!res.ok) throw new Error('save failed')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exists, articleId, lang])

  const autosave = useAutosave({
    storageKey: `antariksham:draft:article:${articleId}:${lang}`,
    data:       snapshot,
    save:       serverSave,
    enabled:    !loading,   // don't record churn while the initial fetch populates state
  })

  function handleRestoreDraft() {
    const restored = autosave.restore() as typeof snapshot | null
    if (!restored) return
    setTitle(restored.title || '')
    setExcerpt(restored.excerpt || '')
    setContent(restored.content || '')
    setIsPublished(Boolean(restored.isPublished))
  }

  // ── Live preview model (shared metadata + translated text) ──
  const debouncedContent = useDebouncedValue(content, 180)

  const previewModel: ArticleRenderModel = useMemo(() => ({
    title:             title,
    excerpt:           excerpt,
    content:           debouncedContent,
    featuredImage:     shared?.featuredImage ?? null,
    featuredImageMeta: shared?.featuredImageMeta ?? null,
    categories:        shared?.categories ?? [],
    tags:              shared?.tags ?? [],
    author:            shared?.authorName ? { name: shared.authorName, avatar: null } : null,
    publishedAt:       shared?.publishedAt ?? null,
    readingTime:       readingTime(debouncedContent),
    views:             null,
    articleType:       shared?.articleType ?? 'explainer',
  }), [title, excerpt, debouncedContent, shared])

  // ── Translation pre-flight ──────────────────────────────────
  const structure = useMemo(
    () => compareStructure(english.content, debouncedContent),
    [english.content, debouncedContent],
  )
  const words   = wordCountFromHtml(debouncedContent)
  const enWords = wordCountFromHtml(english.content)
  const ratioOk = enWords === 0 || words === 0 || (words / enWords >= 0.4 && words / enWords <= 2.5)

  const checks: { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail?: string }[] = [
    { id: 'title',   label: `Title (${langLabel})`,   status: title.trim() ? 'pass' : 'fail' },
    { id: 'content', label: `Content (${langLabel})`, status: words > 0 ? 'pass' : 'fail' },
  ]
  if (words > 0 && structure.comparable) {
    checks.push(structure.match
      ? { id: 'structure', label: 'HTML structure matches English', status: 'pass',
          detail: `${structure.trTags} blocks, tag-for-tag` }
      : { id: 'structure', label: 'HTML structure differs from English', status: 'warn',
          detail: `${structure.diffs} difference(s) — first at block ${structure.first!.index + 1}: EN <${structure.first!.english ?? '∅'}> vs ${lang.toUpperCase()} <${structure.first!.translated ?? '∅'}>. Keep the same tags; translate only the words.` })
    checks.push(ratioOk
      ? { id: 'length', label: 'Length in line with English', status: 'pass',
          detail: `${words} words (EN ${enWords})` }
      : { id: 'length', label: 'Length far from English', status: 'warn',
          detail: `${words} words vs EN ${enWords} — a section may be missing or duplicated` })
  }

  // ── Save / delete ───────────────────────────────────────────
  async function handleSave() {
    if (!title.trim())   { setError('Title is required.');   return }
    if (!content.trim()) { setError('Content is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(apiUrl, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, excerpt, content, isPublished }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save translation.'); return }
      setExists(true)
      autosave.markSaved()
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
      const res = await fetch(apiUrl, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to delete translation.'); return }
      setExists(false)
      setTitle(''); setExcerpt(''); setContent(''); setIsPublished(false)
      autosave.markSaved()
      setSuccess(`${langLabel} translation removed.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────

  if (loading) {
    return <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', padding: '24px 0' }}>Loading {langLabel} translation…</p>
  }

  const showEditor  = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'split'  || viewMode === 'preview'

  const editorColumn = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
      {/* Title */}
      <Field label={`Title (${langLabel})`} english={english.title}>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setError('') }}
          placeholder={`${langLabel} title…`}
          lang={lang}
          style={{ ...inputStyle(true), fontFamily: lang === 'hi' ? HI_SERIF : 'var(--font-serif)' }}
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

      {/* Content — same rich block editor as English, Devanagari-aware */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <label style={labelStyle}>Content ({langLabel})</label>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', color: 'rgba(var(--ink),0.78)' }}>
            {words} words · {readingTime(content)} min read
          </span>
        </div>
        <ContentEditorField value={content} onChange={setContent} lang={lang} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', margin: '6px 0 0', letterSpacing: '0.04em' }}>
          Keep the same blocks/HTML tags as the English version — translate only the words. The pre-flight below verifies this.
        </p>
      </div>
    </div>
  )

  return (
    <div>

      {/* Context banner */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', marginBottom: '16px', background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid rgba(var(--accent-rgb),0.2)', borderRadius: '8px' }}>
        <Globe size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, color: 'rgba(var(--ink),0.8)' }}>
          You&rsquo;re writing the <strong>{langLabel}</strong> version of this article. The slug, author, categories, tags,
          image, view count and publish date are shared from the English article — only the text below changes per language.
        </span>
      </div>

      {/* Draft recovery */}
      {autosave.restorable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '10px 14px', marginBottom: '16px', background: 'rgba(var(--gold-rgb),0.08)', border: '1px solid rgba(var(--gold-rgb),0.3)', borderRadius: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.04em' }}>
            Unsaved {langLabel} changes from a previous session were found.
          </span>
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            <button type="button" onClick={handleRestoreDraft} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: 'var(--gold)', color: 'var(--black)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Restore
            </button>
            <button type="button" onClick={autosave.dismissRestore} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'rgba(var(--ink),0.72)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Multi-tab conflict warning */}
      {autosave.conflict && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(var(--gold-rgb),0.06)', border: '1px solid rgba(var(--gold-rgb),0.25)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.04em' }}>
          This translation is open in another tab — saving here may overwrite changes made there.
        </div>
      )}

      {/* Error / success */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '16px', background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.25)', borderRadius: '7px' }}>
          <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(var(--green-rgb),0.08)', border: '1px solid rgba(var(--green-rgb),0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)' }}>
          ✓ {success}
        </div>
      )}

      {/* View-mode toggle + save state */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <SaveStatus state={autosave.state} lastSavedAt={autosave.lastSavedAt} />
        <div role="group" aria-label="Translation view mode" style={{ display: 'inline-flex', gap: '2px', background: 'rgba(var(--ink),0.04)', border: '1px solid var(--border)', padding: '3px', borderRadius: '8px' }}>
          {([
            { value: 'editor',  label: 'Editor',  icon: Pencil },
            { value: 'split',   label: 'Split',   icon: Columns2 },
            { value: 'preview', label: 'Preview', icon: Eye },
          ] as { value: ViewMode; label: string; icon: typeof Eye }[]).map(o => {
            const active = viewMode === o.value
            const Icon = o.icon
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setViewMode(o.value)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: 'none',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--black)' : 'rgba(var(--ink),0.72)',
                  fontFamily: 'var(--font-mono)', fontSize: '12px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} /> {o.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mode content ── */}
      {viewMode === 'editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px', alignItems: 'start' }}>
          {/* English reference, rendered exactly as it reads */}
          <div style={{ position: 'sticky', top: '24px', minWidth: 0 }}>
            <p style={refHintStyle}>English (reference)</p>
            <div
              className="article-body"
              style={{
                border: '1px solid var(--border)', borderRadius: '7px',
                padding: '20px 22px', maxHeight: '640px', overflowY: 'auto',
                background: 'rgba(var(--ink),0.02)',
                fontFamily: 'var(--font-serif)', fontSize: '15px',
                lineHeight: 1.75, color: 'rgba(var(--ink),0.8)',
              }}
              dangerouslySetInnerHTML={{ __html: english.content || '<p style="opacity:.5">The English article is empty.</p>' }}
            />
          </div>
          {editorColumn}
        </div>
      )}

      {viewMode === 'split' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px', alignItems: 'start' }}>
          {editorColumn}
          <div style={{ minWidth: 0, position: 'sticky', top: '24px' }}>
            <ArticlePreview model={previewModel} lang={lang} />
          </div>
        </div>
      )}

      {viewMode === 'preview' && (
        <ArticlePreview model={previewModel} lang={lang} />
      )}

      {/* ── Translation pre-flight ── */}
      <div style={{ marginTop: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
            Translation pre-flight
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: '12px 14px' }}>
          {checks.map(c => (
            <li key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '3px 0' }}>
              <span style={{ flexShrink: 0, marginTop: '2px' }}>
                {c.status === 'pass' ? <Check size={12} style={{ color: 'var(--green)' }} />
                  : c.status === 'warn' ? <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />
                  : <XCircle size={12} style={{ color: 'var(--red)' }} />}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: c.status === 'pass' ? 'rgba(var(--ink),0.7)' : 'var(--white)' }}>
                  {c.label}
                </span>
                {c.detail && (
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', marginTop: '1px' }}>
                    {c.detail}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Publish toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '20px' }}>
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
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '16px' }}>
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
    border: primary ? 'none' : '1px solid rgba(var(--red-rgb),0.4)',
    transition: 'all 0.15s',
  }
}
