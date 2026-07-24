'use client'

import { useMemo, useState } from 'react'
import { Wand2, Copy, Check as CheckIcon, AlertTriangle, XCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ScoreMeter } from '@/modules/admin/publish/ScoreMeter'
import type { ValidationReport, Check as CheckType } from '@/modules/admin/publish/validation'
import {
  canonicalFor, suggestSeoTitle, generateMetaDescription, buildArticleJsonLd, cleanJsonLd,
} from './seoHelpers'

interface Props {
  title:         string
  excerpt:       string
  content:       string
  slug:          string
  featuredImage: string | null
  authorName:    string | null
  publishedAt:   string | null
  articleType:   string
  focusKeyword:  string
  onFocusKeyword: (v: string) => void
  onTitle:       (v: string) => void
  onExcerpt:     (v: string) => void
  report:        ValidationReport
}

// The article's SEO title = its title, meta description = its excerpt — exactly
// how the shipped metadata is built (articleMetadata.ts). Editing here writes to
// those real fields, so the previews below are always what actually ships.
export function SeoWorkspace(p: Props) {
  const canonical = canonicalFor(p.slug)
  const jsonLd = useMemo(
    () => cleanJsonLd(buildArticleJsonLd({
      title: p.title, excerpt: p.excerpt, slug: p.slug, featuredImage: p.featuredImage,
      authorName: p.authorName, publishedAt: p.publishedAt, articleType: p.articleType,
    })),
    [p.title, p.excerpt, p.slug, p.featuredImage, p.authorName, p.publishedAt, p.articleType],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

      {/* Live scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <ScoreMeter label="SEO"         value={p.report.scores.seo} />
        <ScoreMeter label="Readability" value={p.report.scores.readability} />
        <ScoreMeter label="Content"     value={p.report.scores.content} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '20px' }}>

        {/* ── Left: editable SEO fields ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="SEO Title" hint="= article title" counter={<Counter len={p.title.length} lo={30} hi={60} />}
                 action={{ label: 'Optimise', onClick: () => p.onTitle(suggestSeoTitle(p.title)) }}>
            <input value={p.title} onChange={e => p.onTitle(e.target.value)} placeholder="Article title…" style={inputStyle} />
          </Field>

          <Field label="Meta Description" hint="= article excerpt" counter={<Counter len={p.excerpt.length} lo={120} hi={160} />}
                 action={{ label: 'Generate', onClick: () => p.onExcerpt(generateMetaDescription(p.excerpt, p.content)) }}>
            <textarea value={p.excerpt} onChange={e => p.onExcerpt(e.target.value)} rows={3} placeholder="Search snippet…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </Field>

          <Field label="Focus Keyword" hint="Drives keyword analysis">
            <input value={p.focusKeyword} onChange={e => p.onFocusKeyword(e.target.value)} placeholder="e.g. James Webb Telescope" style={inputStyle} />
          </Field>

          <Field label="Canonical URL" hint="Derived from the slug">
            <input value={canonical} readOnly style={{ ...inputStyle, color: 'rgba(var(--ink),0.6)', cursor: 'default' }} />
          </Field>
        </div>

        {/* ── Right: previews ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PreviewCard title="Google">
            <GooglePreview title={p.title} description={p.excerpt} url={canonical} />
          </PreviewCard>
          <PreviewCard title="X / Twitter">
            <SocialPreview title={p.title} description={p.excerpt} image={p.featuredImage} twitter />
          </PreviewCard>
          <PreviewCard title="Facebook / LinkedIn">
            <SocialPreview title={p.title} description={p.excerpt} image={p.featuredImage} />
          </PreviewCard>
        </div>
      </div>

      {/* SEO analysis */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--white)', margin: '0 0 12px', letterSpacing: '0.02em' }}>
          SEO analysis
        </h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px 20px' }}>
          {p.report.seo.map(c => <AnalysisRow key={c.id} c={c} />)}
        </ul>
      </div>

      {/* JSON-LD */}
      <JsonLdBlock data={jsonLd} />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function AnalysisRow({ c }: { c: CheckType }) {
  const icon = c.status === 'pass' ? <CheckIcon size={12} style={{ color: 'var(--green)' }} />
    : c.status === 'warn' ? <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />
    : <XCircle size={12} style={{ color: 'var(--red)' }} />
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '2px 0' }}>
      <span style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.82)' }}>
        {c.label}{c.detail ? <span style={{ color: 'rgba(var(--ink),0.5)' }}> — {c.detail}</span> : ''}
      </span>
    </li>
  )
}

function Field({ label, hint, counter, action, children }: {
  label: string; hint?: string; counter?: React.ReactNode
  action?: { label: string; onClick: () => void }; children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {counter}
          {action && (
            <button type="button" onClick={action.onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Wand2 size={11} /> {action.label}
            </button>
          )}
        </div>
      </div>
      {children}
      {hint && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', margin: '4px 0 0', letterSpacing: '0.04em' }}>{hint}</p>}
    </div>
  )
}

function Counter({ len, lo, hi }: { len: number; lo: number; hi: number }) {
  const color = len > hi ? 'var(--red)' : len < lo ? 'var(--gold)' : 'var(--green)'
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color }}>{len} · {lo}–{hi}</span>
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', margin: '0 0 6px' }}>{title}</p>
      {children}
    </div>
  )
}

// Google SERP — brand-accurate colours (intentional exception, like SEOCenter).
function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#202124', opacity: 0.75, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {url.replace(/^https?:\/\//, '').replace(/\//g, ' › ')}
      </div>
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#1a0dab', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title || 'Article title'}
      </div>
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#4d5156', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
        {description || 'The meta description shows here…'}
      </div>
    </div>
  )
}

function SocialPreview({ title, description, image, twitter }: { title: string; description: string; image: string | null; twitter?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e1e8ed', borderRadius: twitter ? '14px' : '8px', overflow: 'hidden' }}>
      <div style={{ aspectRatio: '1.91/1', background: '#e1e8ed', position: 'relative' }}>
        {image
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8899a6', fontFamily: 'Arial', fontSize: '12px' }}>No image</div>}
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#8899a6', textTransform: twitter ? 'none' : 'uppercase', marginBottom: '2px' }}>
          {siteConfig.domain}
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', fontWeight: 700, color: '#0f1419', lineHeight: 1.3, marginBottom: '3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
          {title || 'Article title'}
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#536471', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
          {description || 'The description shows here…'}
        </div>
      </div>
    </div>
  )
}

function JsonLdBlock({ data }: { data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)
  function copy() {
    navigator.clipboard?.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
          Structured data (JSON-LD)
        </h3>
        <button type="button" onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', color: 'rgba(var(--ink),0.8)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em' }}>
          {copied ? <CheckIcon size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.5, color: 'var(--dim)' }}>
        {json}
      </pre>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--black)',
  border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--white)',
  fontFamily: 'var(--font-sans)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}
