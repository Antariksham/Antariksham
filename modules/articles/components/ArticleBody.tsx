import { formatDate } from '@/lib/utils'
import { articlesListHref, HI_SANS, HI_SERIF, type LanguageCode } from '@/lib/i18n'
import type { ArticleType } from '@/types/article'

// ── Shared render model ───────────────────────────────────────
// The single shape both the production reader and the admin live-preview feed
// into `ArticleBody`. Keeping one model + one component guarantees the editor
// preview is byte-identical to what ships — never a second renderer to drift.
export interface ArticleRenderModel {
  title:         string
  excerpt:       string
  content:       string          // trusted HTML (semantic, uses .article-body classes)
  featuredImage: string | null
  categories:    string[]        // display names
  tags:          string[]
  author:        { name: string; avatar: string | null; slug?: string | null } | null
  publishedAt:   string | null
  readingTime:   number
  views:         number | null   // null → hide the views chip (preview / unpublished)
  articleType:   ArticleType
}

const CAT_COLORS: Record<string, string> = {
  NASA: '#4f8ef7', SpaceX: '#4f8ef7', ISRO: '#f39c12',
  ESA: '#2ecc71', JAXA: '#f39c12', Astronomy: '#4f8ef7',
  Discoveries: '#2ecc71', Technology: '#4f8ef7',
  Missions: '#f39c12', Science: 'var(--white)',
}

/** Word count from trusted HTML — strips tags, collapses whitespace. */
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}

// The reading column — categories, title, excerpt, meta, hero, body, tags.
// Rendered identically by `ArticleView` (production) and `ArticlePreview` (admin).
// `preview` swaps the live nav-away anchors for spans and shows a word-count /
// estimated-date meta line for drafts that have no published date yet.
export function ArticleBody({
  model, lang, preview = false,
}: {
  model:    ArticleRenderModel
  lang:     LanguageCode
  preview?: boolean
}) {
  const isHi      = lang === 'hi'
  const sansFont  = isHi ? HI_SANS  : 'var(--font-sans)'
  const serifFont = isHi ? HI_SERIF : 'var(--font-serif)'

  const CatTag = preview ? 'span' : 'a'

  return (
    <>
      {/* Breaking badge */}
      {model.articleType === 'breaking-news' && (
        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--black)', background: '#e74c3c', padding: '3px 8px', borderRadius: '3px', marginBottom: '20px', width: 'fit-content' }}>
          Breaking
        </span>
      )}

      {/* Categories */}
      {model.categories.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {model.categories.map(cat => (
            <CatTag
              key={cat}
              {...(preview ? {} : { href: articlesListHref(lang) })}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[cat] || '#4f8ef7', textDecoration: 'none' }}
            >
              {cat}
            </CatTag>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 style={{
        fontFamily:  sansFont,
        fontSize:    'clamp(28px, 4.5vw, 48px)',
        fontWeight:  800,
        color:       'var(--white)',
        lineHeight:  1.12,
        margin:      '0 0 20px',
        letterSpacing: '-0.01em',
      }}>
        {model.title || (preview ? 'Untitled article' : '')}
      </h1>

      {/* Excerpt */}
      {model.excerpt && (
        <p style={{
          fontFamily:  serifFont,
          fontSize:    'clamp(16px, 2vw, 19px)',
          color:       'rgba(var(--ink),0.9)',
          lineHeight:  1.6,
          margin:      '0 0 28px',
          fontWeight:  400,
        }}>
          {model.excerpt}
        </p>
      )}

      {/* Meta row */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '20px',
        flexWrap:      'wrap',
        fontFamily:    'var(--font-mono)',
        fontSize: '12px',
        color:         'rgba(var(--ink),0.6)',
        paddingBottom: '28px',
        borderBottom:  '1px solid rgba(var(--ink),0.08)',
        marginBottom:  '36px',
      }}>
        {model.author && (!preview && model.author.slug ? (
          <a href={`/authors/${model.author.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {model.author.avatar && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={model.author.avatar} alt={model.author.name} loading="lazy"
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            )}
            <span style={{ color: 'var(--accent)' }}>{model.author.name}</span>
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {model.author.avatar && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={model.author.avatar} alt={model.author.name} loading="lazy"
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            )}
            <span style={{ color: 'rgba(var(--ink),0.7)' }}>{model.author.name}</span>
          </div>
        ))}
        {model.publishedAt
          ? <span>{formatDate(model.publishedAt)}</span>
          : preview && <span title="Estimated — article is not published yet">{formatDate(new Date().toISOString())} · est.</span>}
        <span>{model.readingTime} min read</span>
        {preview
          ? <span>{countWords(model.content)} words</span>
          : model.views != null && <span>{model.views} views</span>}
      </div>

      {/* Hero image — proper aspect ratio, rounded, contained */}
      {model.featuredImage && (
        <div style={{
          width:        '100%',
          aspectRatio:  '16 / 9',
          borderRadius: '12px',
          overflow:     'hidden',
          marginBottom: '44px',
          background:   'var(--surface)',
          position:     'relative',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={model.featuredImage}
            alt={model.title}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Article body — .article-body carries the shared rich-content styling
          (headings, lists, quotes, callouts, tables, code, figures, …) so
          preview and production render every block identically. */}
      <div
        className="article-body"
        style={{
          fontFamily:  serifFont,
          fontSize:    'clamp(16px, 1.8vw, 18px)',
          lineHeight:  1.9,
          color:       'rgba(var(--ink),0.9)',
          letterSpacing: '0.01em',
        }}
        dangerouslySetInnerHTML={{ __html: model.content || (preview ? '<p style="opacity:.5">Start writing to see your article take shape…</p>' : '') }}
      />

      {/* Tags */}
      {model.tags && model.tags.length > 0 && (
        <div style={{ marginTop: '56px', paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', marginRight: '4px' }}>
            Tags
          </span>
          {model.tags.map(tag => (
            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', border: '1px solid rgba(var(--ink),0.1)', borderRadius: '4px', padding: '3px 10px' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
