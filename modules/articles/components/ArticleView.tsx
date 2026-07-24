import { articleHref, articlesListHref, HI_SANS, type LanguageCode } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ArticleBody, type ArticleRenderModel } from './ArticleBody'
import { buildArticleJsonLd } from '../services/articleMetadata'
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

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Structured data (Article/NewsArticle JSON-LD) for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(article)) }}
      />

      {/* ── Single centered column — everything flows here ── */}
      <article
        lang={lang}
        style={{
          maxWidth:  '740px',
          margin:    '0 auto',
          padding:   'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)',
        }}
      >

        {/* Language switch — only shows when a translation exists */}
        <LanguageToggle
          current={article.language}
          available={article.availableLanguages}
          hrefFor={c => articleHref(article.slug, c)}
        />

        {/* Reading column (shared with the admin preview) */}
        <ArticleBody model={toRenderModel(article)} lang={lang} />

        {/* Back link */}
        <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
          <a href={articlesListHref(lang)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← Back to Articles
          </a>
        </div>
      </article>

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

    </div>
  )
}
