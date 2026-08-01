import { articleHref, articlesListHref, HI_SANS, type LanguageCode } from '@/lib/i18n'
import { ArticleBody, countWords, type ArticleRenderModel } from './ArticleBody'
import { TableOfContents } from './TableOfContents'
import { buildToc, tocCount } from '../services/toc'
import { buildArticleJsonLd } from '../services/articleMetadata'
import { buildBreadcrumbs, buildFaqJsonLd } from '@/modules/seo/jsonLd'
import { ReaderProvider, type ReaderMeta } from '../reader/ReaderContext'
import { ArticleEnhancer } from '../blocks/ArticleEnhancer'
import { AnalyticsBeacon } from '../analytics/AnalyticsBeacon'
import { ReadingProgressBar } from '../reader/ReadingProgressBar'
import { ShareRail } from '../reader/ShareRail'
import { ReaderDock } from '../reader/ReaderDock'
import { ReaderPreferencesPanel } from '../reader/ReaderPreferencesPanel'
import { ResumeReading } from '../reader/ResumeReading'
import { siteConfig } from '@/config/site'
import type { Article, ArticleCard } from '@/types/article'

const CAT_COLORS: Record<string, string> = {
  NASA: '#4f8ef7', SpaceX: '#4f8ef7', ISRO: '#f39c12',
  ESA: '#2ecc71', JAXA: '#f39c12', Astronomy: '#4f8ef7',
  Discoveries: '#2ecc71', Technology: '#4f8ef7',
  Missions: '#f39c12', Science: 'var(--white)',
}

// Map the full DB article onto the shared render model consumed by ArticleBody.
export function toRenderModel(article: Article): ArticleRenderModel {
  return {
    title:         article.title,
    excerpt:       article.excerpt,
    content:       article.content,
    featuredImage: article.featuredImage,
    featuredImageMeta: article.featuredImageMeta,
    categories:    article.categories,
    categoryColors: article.categoryColors,
    tags:          article.tags,
    author:        article.author
      ? { name: article.author.name, avatar: article.author.avatar, slug: article.author.slug }
      : null,
    publishedAt:   article.publishedAt,
    readingTime:   article.readingTime,
    views:         article.views,
    articleType:   article.articleType,
  }
}

// Shared renderer for an article in ANY language. The English route and the
// /hi route both render this; `lang` drives the reading fonts, the language
// toggle, and the internal link prefixes so a reader stays in their language.
// The reading column itself lives in ArticleBody — the same component the admin
// live-preview renders, so the editor preview is always identical to production.
export function ArticleView({
  article, related, lang,
}: {
  article: Article
  related: ArticleCard[]
  lang:    LanguageCode
}) {
  const isHi     = lang === 'hi'
  const sansFont = isHi ? HI_SANS : 'var(--font-sans)'

  // Desktop Table-of-Contents rail (mobile uses the inline panel inside
  // ArticleBody). Computed from the same buildToc as the reader, so the rail's
  // anchors match the ids injected into the body.
  const toc     = buildToc(article.content)
  const showToc = tocCount(toc.items) >= 2

  // Metadata shared with the reader chrome (share rail, dock, preferences,
  // resume). The canonical URL is a sensible SSR default; the client upgrades
  // it to the live location for share/copy.
  const meta: ReaderMeta = {
    id:           article.id,
    title:        article.title,
    slug:         article.slug,
    canonicalUrl: `${siteConfig.url}${articleHref(article.slug, lang)}`,
    lang,
    words:        countWords(article.content),
    readingTime:  article.readingTime,
    views:        article.views,
    publishedAt:  article.publishedAt,
    updatedAt:    article.updatedAt,
  }

  return (
    <ReaderProvider meta={meta}>
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Thin reading-progress bar pinned under the nav (Feature 2) */}
      <ReadingProgressBar />

      {/* Structured data: the Article itself, its breadcrumb trail, and — when the
          author used the editor's FAQ block — an FAQPage built from that same
          visible content, so the markup and the page always agree. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          buildArticleJsonLd(article),
          buildBreadcrumbs([
            { name: 'Articles', path: '/articles' },
            { name: article.title, path: `/article/${article.slug}` },
          ], siteConfig),
          buildFaqJsonLd(article.content || ''),
        ].filter(Boolean)) }}
      />

      {/* ── Reading column + sticky TOC rail ──
          On desktop this is a 3-track grid: the article sits in the centred
          middle track and the TOC rail floats in the right gutter (so the
          reading measure stays perfectly centred). Below the breakpoint it
          collapses to the original single centred column and the rail is
          hidden — the inline TOC inside ArticleBody takes over. */}
      <div className="article-layout">
        <article
          lang={lang}
          className="article-layout__main"
          style={{
            maxWidth:  'var(--reader-measure, 740px)',
            margin:    '0 auto',
            padding:   'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)',
          }}
        >

          {/* Reading column (shared with the admin preview) */}
          <ArticleBody model={toRenderModel(article)} lang={lang} />

          {/* Back link */}
          <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
            <a href={articlesListHref(lang)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
              ← Back to Articles
            </a>
          </div>
        </article>

        {/* Desktop sticky Table of Contents (right gutter) */}
        {showToc && (
          <aside className="article-toc-rail">
            <TableOfContents items={toc.items} variant="rail" lang={lang} />
          </aside>
        )}

        {/* Desktop sticky share rail (left gutter) */}
        <aside className="article-share-rail">
          <ShareRail />
        </aside>
      </div>

      {/* Related articles — full width section below article */}
      {related.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(var(--ink),0.08)', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '28px' }}>
              Related Stories
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
              {related.map(r => (
                <a key={r.id} href={articleHref(r.slug, lang)} style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{ padding: '24px', height: '100%', cursor: 'pointer', alignItems: 'flex-start' }}
                  >
                    {r.categories[0] && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[r.categories[0]] || '#4f8ef7', display: 'block', marginBottom: '10px' }}>
                        {r.categories[0]}
                      </span>
                    )}
                    <h3 lang={lang} style={{ fontFamily: sansFont, fontSize: '18px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, margin: '0 0 14px' }}>
                      {r.title}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.1em' }}>
                      {r.readingTime} min read
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics: record view + read (scroll depth / dwell) — Feature 5 */}
      <AnalyticsBeacon articleId={article.id} path={articleHref(article.slug, lang)} />

      {/* Progressive enhancement for advanced article components (Feature 3):
          code highlight/copy, countdown, carousel, lightbox, sortable tables,
          embedded PDF, KaTeX math. Degrades gracefully with JS off. */}
      <ArticleEnhancer />

      {/* Reader chrome — mobile action dock, preferences panel, resume pill */}
      <ReaderDock />
      <ReaderPreferencesPanel />
      <ResumeReading />

    </div>
    </ReaderProvider>
  )
}
