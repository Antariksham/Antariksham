'use client'

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import { slugify, readingTime }  from '@/lib/utils'
import type {
  ArticleStatus, ArticleType, ArticleCategory,
} from '@/types/article'
import type {
  AdminArticleFull,
  CategoryOption,
  TagOption,
  AuthorOption,
} from '@/modules/admin/services/adminArticles'
import {
  Save, Eye, Globe, ChevronDown, X, Plus, AlertCircle,
} from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'

// ── Constants ─────────────────────────────────────────────────

const ARTICLE_TYPES: { value: ArticleType; label: string }[] = [
  { value: 'breaking-news',      label: 'Breaking News'      },
  { value: 'analysis',           label: 'Analysis'           },
  { value: 'editorial',          label: 'Editorial'          },
  { value: 'mission-update',     label: 'Mission Update'     },
  { value: 'research-breakdown', label: 'Research Breakdown' },
  { value: 'explainer',          label: 'Explainer'          },
  { value: 'guide',              label: 'Guide'              },
]

// ── Types ─────────────────────────────────────────────────────

interface FormState {
  title:              string
  slug:               string
  excerpt:            string
  content:            string
  featuredImage:      string
  authorId:           string
  status:             ArticleStatus
  articleType:        ArticleType
  featured:           boolean
  categoryIds:        string[]
  tagIds:             string[]
  _showMediaPicker:   boolean
}

interface Props {
  mode:       'new' | 'edit'
  article?:   AdminArticleFull
  categories: CategoryOption[]
  tags:       TagOption[]
  authors:    AuthorOption[]
}

// ── Component ─────────────────────────────────────────────────

export function ArticleForm({ mode, article, categories, tags, authors }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    title:         article?.title         || '',
    slug:          article?.slug          || '',
    excerpt:       article?.excerpt       || '',
    content:       article?.content       || '',
    featuredImage: article?.featuredImage || '',
    authorId:      article?.authorId      || '',
    status:        article?.status        || 'draft',
    articleType:   article?.articleType   || 'explainer',
    featured:      article?.featured      || false,
    _showMediaPicker: false,
    categoryIds:   article?.categoryIds   || [],
    tagIds:        article?.tagIds        || [],
  })

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')

  // Auto-generate slug from title
  function handleTitleChange(val: string) {
    setForm(f => ({
      ...f,
      title: val,
      slug:  slugEdited ? f.slug : slugify(val),
    }))
  }

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  function toggleCategory(id: string) {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }))
  }

  function toggleTag(id: string) {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id)
        ? f.tagIds.filter(t => t !== id)
        : [...f.tagIds, id],
    }))
  }

  // ── Save ─────────────────────────────────────────────────────

  async function handleSave(saveStatus: ArticleStatus) {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.slug.trim())  { setError('Slug is required.');  return }
    if (!form.content.trim()) { setError('Content is required.'); return }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      ...form,
      status:       saveStatus,
      readingTime:  readingTime(form.content),
      featuredImage: form.featuredImage || null,
      authorId:      form.authorId || null,
    }

    try {
      const url    = mode === 'edit' ? `/api/admin/articles?id=${article!.id}` : '/api/admin/articles'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save article.')
        return
      }

      setSuccess(saveStatus === 'published' ? 'Published!' : 'Saved as draft.')

      if (mode === 'new') {
        // Redirect to edit page after create
        router.push(`/admin/articles/${data.id}`)
      } else {
        router.refresh()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length
  const rt        = readingTime(form.content)

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

      {/* ── Left: main content ────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Title */}
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Article title…"
            style={inputStyle({ large: true })}
          />
        </div>

        {/* Slug */}
        <div>
          <FieldLabel hint={`/news/${form.slug || '…'}`}>Slug</FieldLabel>
          <input
            value={form.slug}
            onChange={e => { setSlugEdited(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')) }}
            placeholder="url-friendly-slug"
            style={inputStyle({})}
          />
        </div>

        {/* Excerpt */}
        <div>
          <FieldLabel hint={`${form.excerpt.length}/300 chars`}>Excerpt</FieldLabel>
          <textarea
            value={form.excerpt}
            onChange={e => set('excerpt', e.target.value)}
            placeholder="Short summary shown in article cards…"
            rows={3}
            maxLength={300}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Featured image */}
        <div>
          <FieldLabel hint="Upload via Media Library or paste a URL directly">Featured Image</FieldLabel>

          {/* URL input + Media Library picker toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <input
              value={form.featuredImage}
              onChange={e => set('featuredImage', e.target.value)}
              placeholder="https://… or pick from Media Library →"
              style={{ ...inputStyle({}), flex: 1 }}
            />
            <button
              type="button"
              onClick={() => set('_showMediaPicker', !form._showMediaPicker)}
              style={{
                flexShrink:    0,
                padding:       '0 14px',
                background:    form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.05)',
                border:        '1px solid',
                borderColor:   form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.12)',
                borderRadius:  '6px',
                color:         form._showMediaPicker ? 'var(--black)' : 'rgba(var(--ink),0.7)',
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                whiteSpace:    'nowrap',
                transition:    'all 0.15s',
              }}
            >
              {form._showMediaPicker ? '✕ Close' : '📁 Browse'}
            </button>
          </div>

          {/* Inline media picker */}
          {form._showMediaPicker && (
            <div style={{ marginTop: '12px', padding: '20px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <MediaLibrary
                pickerMode
                defaultBucket="article-images"
                onPick={url => {
                  set('featuredImage', url)
                  set('_showMediaPicker', false)
                }}
              />
            </div>
          )}

          {/* Image preview */}
          {form.featuredImage && !form._showMediaPicker && (
            <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/5', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <img
                src={form.featuredImage}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <FieldLabel>Content (HTML)</FieldLabel>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(var(--ink),0.3)' }}>
              {wordCount} words · {rt} min read
            </span>
          </div>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder={'<p>Start writing your article…</p>\n\n<p>Use standard HTML for formatting. Paragraphs, headings, bold, links.</p>'}
            rows={22}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(var(--ink),0.3)', margin: '6px 0 0', letterSpacing: '0.06em' }}>
            Content is rendered as HTML. Use &lt;p&gt;, &lt;h2&gt;–&lt;h4&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a href=""&gt;, &lt;ul&gt;&lt;li&gt;, &lt;blockquote&gt;.
          </p>
        </div>

      </div>

      {/* ── Right: sidebar controls ───────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

        {/* Error / success */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px' }}>
            <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)' }}>
            ✓ {success}
          </div>
        )}

        {/* Publish actions */}
        <SidePanel label="Publish">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              style={btnStyle({ primary: true, disabled: saving })}
            >
              <Globe size={12} />
              {saving ? 'Publishing…' : 'Publish'}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={btnStyle({ disabled: saving })}
            >
              <Save size={12} />
              Save as Draft
            </button>
            {mode === 'edit' && article?.slug && (
              <a
                href={`/news/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnStyle({}), textDecoration: 'none', textAlign: 'center' as const, justifyContent: 'center' }}
              >
                <Eye size={12} />
                View Article
              </a>
            )}
          </div>

          {/* Current status indicator */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.3)' }}>
              Current status:
            </span>
            <span style={{
              marginLeft: '6px', fontFamily: 'var(--font-mono)', fontSize: '9px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: form.status === 'published' ? 'var(--green)'
                   : form.status === 'draft'     ? 'var(--gold)'
                   : 'rgba(var(--ink),0.4)',
            }}>
              {form.status}
            </span>
          </div>
        </SidePanel>

        {/* Article type */}
        <SidePanel label="Article Type">
          <div style={{ position: 'relative' }}>
            <select
              value={form.articleType}
              onChange={e => set('articleType', e.target.value as ArticleType)}
              style={{ ...inputStyle({}), paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
            >
              {ARTICLE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.4)', pointerEvents: 'none' }} />
          </div>
        </SidePanel>

        {/* Author */}
        <SidePanel label="Author">
          <div style={{ position: 'relative' }}>
            <select
              value={form.authorId}
              onChange={e => set('authorId', e.target.value)}
              style={{ ...inputStyle({}), paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">— No author —</option>
              {authors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.4)', pointerEvents: 'none' }} />
          </div>
        </SidePanel>

        {/* Featured toggle */}
        <SidePanel label="Options">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => set('featured', !form.featured)}
              style={{
                width: '32px', height: '18px', borderRadius: '9px',
                background: form.featured ? 'var(--accent)' : 'var(--raised)',
                border: `1px solid ${form.featured ? 'var(--accent)' : 'var(--border-hi)'}`,
                position: 'relative', transition: 'all 0.2s', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: '2px',
                left: form.featured ? '14px' : '2px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: form.featured ? 'var(--black)' : 'rgba(var(--ink),0.4)',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>
              Featured article
            </span>
          </label>
        </SidePanel>

        {/* Categories */}
        <SidePanel label={`Categories ${form.categoryIds.length > 0 ? `(${form.categoryIds.length})` : ''}`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map(cat => {
              const active = form.categoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: active ? 'rgba(79,142,247,0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(79,142,247,0.5)' : 'var(--border)'}`,
                    color: active ? 'var(--accent)' : 'rgba(var(--ink),0.5)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </SidePanel>

        {/* Tags */}
        <SidePanel label={`Tags ${form.tagIds.length > 0 ? `(${form.tagIds.length})` : ''}`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
            {tags.map(tag => {
              const active = form.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: '3px 9px', borderRadius: '4px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: active ? 'rgba(243,156,18,0.12)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(243,156,18,0.4)' : 'var(--border)'}`,
                    color: active ? 'var(--gold)' : 'rgba(var(--ink),0.4)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </SidePanel>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)' }}>
        {children}
      </label>
      {hint && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(var(--ink),0.3)', letterSpacing: '0.04em' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.4)' }}>
          {label}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────

function inputStyle({ large }: { large?: boolean }) {
  return {
    width:        '100%',
    padding:      large ? '12px 14px' : '9px 12px',
    background:   'var(--black)',
    border:       '1px solid var(--border)',
    borderRadius: '7px',
    color:        'var(--white)',
    fontFamily:   large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize:     large ? '20px' : '13px',
    outline:      'none',
    boxSizing:    'border-box' as const,
    display:      'block',
    transition:   'border-color 0.2s',
  }
}

function btnStyle({ primary, disabled }: { primary?: boolean; disabled?: boolean }) {
  return {
    display:        'inline-flex' as const,
    alignItems:     'center' as const,
    justifyContent: 'center' as const,
    gap:            '6px',
    width:          '100%',
    padding:        '9px 14px',
    borderRadius:   '6px',
    fontFamily:     'var(--font-mono)' as const,
    fontSize:       '11px',
    letterSpacing:  '0.1em',
    textTransform:  'uppercase' as const,
    fontWeight:     primary ? 700 : 400,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    opacity:        disabled ? 0.6 : 1,
    background:     primary ? 'var(--accent)' : 'var(--surface)',
    color:          primary ? 'var(--black)' : 'rgba(var(--ink),0.7)',
    border:         primary ? 'none' : '1px solid var(--border-hi)',
    transition:     'all 0.15s',
  }
}
