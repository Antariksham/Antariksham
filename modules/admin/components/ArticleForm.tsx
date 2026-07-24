'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Save, Eye, Globe, ChevronDown, X, Plus, AlertCircle, Pencil, Columns2, Search,
} from 'lucide-react'
import { ArticleTranslationEditor } from '@/modules/admin/components/ArticleTranslationEditor'
import { ArticlePreview } from '@/modules/admin/preview/ArticlePreview'
import { ContentEditorField } from '@/modules/admin/editor/ContentEditorField'
import { FeaturedImageManager } from '@/modules/admin/media/FeaturedImageManager'
import { wordCountFromHtml } from '@/modules/admin/editor/sanitizeHtml'
import { useAutosave, AutosaveSkip } from '@/modules/admin/editor/useAutosave'
import { SaveStatus } from '@/modules/admin/editor/SaveStatus'
import { validateArticle } from '@/modules/admin/publish/validation'
import { PublishChecklist } from '@/modules/admin/publish/PublishChecklist'
import { ScoreMeter } from '@/modules/admin/publish/ScoreMeter'
import { SeoWorkspace } from '@/modules/admin/seo/SeoWorkspace'
import type { ArticleRenderModel } from '@/modules/articles/components/ArticleBody'
import type { FeaturedImageMeta } from '@/types/article'
import { TRANSLATION_LANGUAGES, type LanguageCode } from '@/lib/i18n'

// Debounce a fast-changing value so the (potentially heavy) live preview
// re-renders on a pause rather than on every keystroke — typing never stalls.
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

type ViewMode = 'editor' | 'split' | 'preview' | 'seo'

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
  featuredImageMeta:  FeaturedImageMeta
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
    featuredImageMeta: article?.featuredImageMeta || {},
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
  // Which language pane is showing. English = the article itself; other codes
  // edit a translation (only once the article exists, i.e. edit mode).
  const [activeLang, setActiveLang] = useState<LanguageCode>('en')
  // Editor / Split / Preview / SEO — the live preview shares the production renderer.
  const [viewMode, setViewMode] = useState<ViewMode>('editor')
  // Session-only SEO focus keyword (drives keyword analysis + the checklist).
  const [focusKeyword, setFocusKeyword] = useState('')

  // The body HTML can be large, so debounce it into the preview; every other
  // (cheap) field flows through live for instant feedback.
  const debouncedContent = useDebouncedValue(form.content, 180)

  // Live publish/SEO validation. Uses the debounced body so parsing huge docs
  // never stalls typing.
  const validation = useMemo(() => validateArticle({
    title:            form.title,
    slug:             form.slug,
    excerpt:          form.excerpt,
    content:          debouncedContent,
    featuredImage:    form.featuredImage || null,
    featuredImageAlt: form.featuredImageMeta.alt,
    categoryIds:      form.categoryIds,
    authorId:         form.authorId || null,
    focusKeyword,
  }), [
    form.title, form.slug, form.excerpt, debouncedContent, form.featuredImage,
    form.featuredImageMeta, form.categoryIds, form.authorId, focusKeyword,
  ])

  const previewModel: ArticleRenderModel = useMemo(() => {
    const author = authors.find(a => a.id === form.authorId)
    return {
      title:         form.title,
      excerpt:       form.excerpt,
      content:       debouncedContent,
      featuredImage: form.featuredImage || null,
      featuredImageMeta: form.featuredImageMeta,
      categories:    form.categoryIds
        .map(id => categories.find(c => c.id === id)?.name)
        .filter((n): n is string => Boolean(n)),
      tags:          form.tagIds
        .map(id => tags.find(t => t.id === id)?.name)
        .filter((n): n is string => Boolean(n)),
      author:        author ? { name: author.name, avatar: null } : null,
      publishedAt:   article?.publishedAt ?? null,
      readingTime:   readingTime(debouncedContent),
      views:         null,
      articleType:   form.articleType,
    }
  }, [
    form.title, form.excerpt, debouncedContent, form.featuredImage, form.featuredImageMeta,
    form.categoryIds, form.tagIds, form.authorId, form.articleType,
    categories, tags, authors, article,
  ])

  // ── Autosave ──────────────────────────────────────────────────
  // The serialisable snapshot that gets backed up + persisted.
  const snapshot = useMemo(() => ({
    title:         form.title,
    slug:          form.slug,
    excerpt:       form.excerpt,
    content:       form.content,
    featuredImage: form.featuredImage,
    featuredImageMeta: form.featuredImageMeta,
    authorId:      form.authorId,
    status:        form.status,
    articleType:   form.articleType,
    featured:      form.featured,
    categoryIds:   form.categoryIds,
    tagIds:        form.tagIds,
  }), [
    form.title, form.slug, form.excerpt, form.content, form.featuredImage, form.featuredImageMeta,
    form.authorId, form.status, form.articleType, form.featured,
    form.categoryIds, form.tagIds,
  ])

  const draftKey = `antariksham:draft:article:${mode === 'edit' && article ? article.id : 'new'}`

  // Server persistence only in edit mode; a new article keeps a local backup
  // until its first manual save. Autosave never changes the publish state — it
  // sends the article's current status, and the API preserves published_at.
  const serverSave = useMemo(() => {
    if (mode !== 'edit' || !article) return undefined
    return async (data: typeof snapshot) => {
      if (!data.title.trim() || !data.slug.trim() || !data.content.trim()) throw new AutosaveSkip()
      const res = await fetch(`/api/admin/articles?id=${article.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, featuredImage: data.featuredImage || null, authorId: data.authorId || null }),
      })
      if (!res.ok) throw new Error('save failed')
    }
  }, [mode, article])

  const autosave = useAutosave({ storageKey: draftKey, data: snapshot, save: serverSave })

  function handleRestoreDraft() {
    const restored = autosave.restore()
    if (restored) setForm(f => ({ ...f, ...restored }))
  }

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
      autosave.markSaved()

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

  const wordCount = wordCountFromHtml(form.content)
  const rt        = readingTime(form.content)

  const showEditor  = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'split'  || viewMode === 'preview'
  const showSeo     = viewMode === 'seo'
  const gridCols    = viewMode === 'split'
    ? 'minmax(0, 1fr) minmax(0, 1fr) 280px'
    : 'minmax(0, 1fr) 280px'

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>

      {/* ── Language tabs ─────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <LangTab active={activeLang === 'en'} onClick={() => setActiveLang('en')}>
          English
        </LangTab>
        {TRANSLATION_LANGUAGES.map(l => (
          <LangTab
            key={l.code}
            active={activeLang === l.code}
            disabled={mode === 'new'}
            title={mode === 'new' ? 'Save the article first, then add translations' : undefined}
            onClick={() => { if (mode !== 'new') setActiveLang(l.code) }}
          >
            {l.native}
          </LangTab>
        ))}
      </div>

      {/* ── English pane (the article itself) ─────── */}
      <div style={{ display: activeLang === 'en' ? 'block' : 'none' }}>

      {/* Draft recovery — restore unsaved changes from a crash / reload */}
      {autosave.restorable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '10px 14px', marginBottom: '16px', background: 'rgba(var(--gold-rgb),0.08)', border: '1px solid rgba(var(--gold-rgb),0.3)', borderRadius: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.04em' }}>
            Unsaved changes from a previous session were found.
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
          This article is open in another tab — saving here may overwrite changes made there.
        </div>
      )}

      {/* View-mode toggle — Editor / Split / Preview (shared production renderer) */}
      <ViewModeTabs mode={viewMode} onChange={setViewMode} />

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '24px', alignItems: 'start' }}>

      {/* ── Left: main content ────────────────────── */}
      <div style={{ display: showEditor ? 'flex' : 'none', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

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
          <FieldLabel hint={`/articles/${form.slug || '…'}`}>Slug</FieldLabel>
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

        {/* Featured image — newsroom-grade manager (validation, focal point,
            attribution & licensing metadata) */}
        <div>
          <FieldLabel hint="Drag/drop, paste, or Browse — set focal point + alt text">Featured Image</FieldLabel>
          <FeaturedImageManager
            url={form.featuredImage}
            meta={form.featuredImageMeta}
            onUrl={v => set('featuredImage', v)}
            onMeta={v => set('featuredImageMeta', v)}
          />
        </div>

        {/* Content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <FieldLabel>Content</FieldLabel>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', color: 'rgba(var(--ink),0.78)' }}>
              {wordCount} words · {rt} min read
            </span>
          </div>
          <ContentEditorField value={form.content} onChange={html => set('content', html)} />
        </div>

      </div>

      {/* ── Live preview column (shares the production ArticleBody) ── */}
      {showPreview && (
        <div style={{ minWidth: 0, position: 'sticky', top: '24px' }}>
          <ArticlePreview model={previewModel} />
        </div>
      )}

      {/* ── SEO workspace column ──────────────────── */}
      {showSeo && (
        <div style={{ minWidth: 0 }}>
          <SeoWorkspace
            title={form.title}
            excerpt={form.excerpt}
            content={form.content}
            slug={form.slug}
            featuredImage={form.featuredImage || null}
            authorName={authors.find(a => a.id === form.authorId)?.name || null}
            publishedAt={article?.publishedAt ?? null}
            articleType={form.articleType}
            focusKeyword={focusKeyword}
            onFocusKeyword={setFocusKeyword}
            onTitle={v => set('title', v)}
            onExcerpt={v => set('excerpt', v)}
            report={validation}
          />
        </div>
      )}

      {/* ── Right: sidebar controls ───────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

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

        {/* Publish actions */}
        <SidePanel label="Publish">
          <div style={{ marginBottom: '10px' }}>
            <SaveStatus state={autosave.state} lastSavedAt={autosave.lastSavedAt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => handleSave('published')}
              disabled={saving || !validation.canPublish}
              title={!validation.canPublish ? `Resolve ${validation.failCount} required check${validation.failCount === 1 ? '' : 's'} first` : undefined}
              style={btnStyle({ primary: true, disabled: saving || !validation.canPublish })}
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
                href={`/articles/${article.slug}`}
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.78)' }}>
              Current status:
            </span>
            <span style={{
              marginLeft: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: form.status === 'published' ? 'var(--green)'
                   : form.status === 'draft'     ? 'var(--gold)'
                   : 'rgba(var(--ink),0.62)',
            }}>
              {form.status}
            </span>
          </div>
        </SidePanel>

        {/* Pre-flight — live scores + publish checklist */}
        <SidePanel label="Pre-flight">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <ScoreMeter compact label="SEO"     value={validation.scores.seo} />
            <ScoreMeter compact label="Read"    value={validation.scores.readability} />
            <ScoreMeter compact label="Content" value={validation.scores.content} />
          </div>
          <PublishChecklist report={validation} />
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
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.82)', pointerEvents: 'none' }} />
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
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.82)', pointerEvents: 'none' }} />
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
                background: form.featured ? 'var(--black)' : 'rgba(var(--ink),0.62)',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
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
                    fontFamily: 'var(--font-mono)', fontSize: '13px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: active ? 'rgba(79,142,247,0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(79,142,247,0.5)' : 'var(--border)'}`,
                    color: active ? 'var(--accent)' : 'rgba(var(--ink),0.72)',
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
                    fontFamily: 'var(--font-mono)', fontSize: '13px',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: active ? 'rgba(243,156,18,0.12)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(243,156,18,0.4)' : 'var(--border)'}`,
                    color: active ? 'var(--gold)' : 'rgba(var(--ink),0.62)',
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
      </div>
      {/* ── /English pane ─────────────────────────── */}

      {/* ── Translation panes — mounted in edit mode, kept alive so unsaved
             edits survive tab switches; only the active one is visible. ── */}
      {mode === 'edit' && article && TRANSLATION_LANGUAGES.map(l => (
        <div key={l.code} style={{ display: activeLang === l.code ? 'block' : 'none' }}>
          <ArticleTranslationEditor
            articleId={article.id}
            lang={l.code}
            english={{ title: form.title, excerpt: form.excerpt, content: form.content }}
          />
        </div>
      ))}

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function LangTab({
  active, disabled, title, onClick, children,
}: {
  active: boolean; disabled?: boolean; title?: string
  onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '13px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding:       '9px 16px',
        background:    'transparent',
        border:        'none',
        borderBottom:  `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        color:         active ? 'var(--accent)' : disabled ? 'rgba(var(--ink),0.35)' : 'rgba(var(--ink),0.7)',
        cursor:        disabled ? 'not-allowed' : 'pointer',
        marginBottom:  '-1px',
        transition:    'color 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function ViewModeTabs({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const opts: { value: ViewMode; label: string; icon: typeof Eye }[] = [
    { value: 'editor',  label: 'Editor',  icon: Pencil },
    { value: 'split',   label: 'Split',   icon: Columns2 },
    { value: 'preview', label: 'Preview', icon: Eye },
    { value: 'seo',     label: 'SEO',     icon: Search },
  ]
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
      <div role="group" aria-label="Editor view mode" style={{ display: 'inline-flex', gap: '2px', background: 'rgba(var(--ink),0.04)', border: '1px solid var(--border)', padding: '3px', borderRadius: '8px' }}>
        {opts.map(o => {
          const active = mode === o.value
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
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
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
        {children}
      </label>
      {hint && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.04em' }}>
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
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
    fontSize: '14px',
    letterSpacing:  '0.1em',
    textTransform:  'uppercase' as const,
    fontWeight:     primary ? 700 : 400,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    opacity:        disabled ? 0.6 : 1,
    background:     primary ? 'var(--accent)' : 'var(--surface)',
    color:          primary ? 'var(--black)' : 'rgba(var(--ink),0.9)',
    border:         primary ? 'none' : '1px solid var(--border-hi)',
    transition:     'all 0.15s',
  }
}
