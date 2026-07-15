import { getArticleBySlug, getAllArticleSlugs, getRelatedArticles } from '@/modules/news/services/getArticles'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)
  if (!article) return { title: 'Article Not Found' }
  return {
    title:       article.title,
    description: article.excerpt,
    openGraph: {
      title:         article.title,
      description:   article.excerpt,
      images:        article.featuredImage ? [article.featuredImage] : [],
      type:          'article',
      publishedTime: article.publishedAt || undefined,
    },
  }
}

const CAT_COLORS: Record<string, string> = {
  NASA: '#4f8ef7', SpaceX: '#4f8ef7', ISRO: '#f39c12',
  ESA: '#2ecc71', JAXA: '#f39c12', Astronomy: '#4f8ef7',
  Discoveries: '#2ecc71', Technology: '#4f8ef7',
  Missions: '#f39c12', Science: 'var(--white)',
}

export default async function ArticlePage(
  { params }: { params: { slug: string } }
) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()

  const related = await getRelatedArticles(article.id, 3)

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* ── Single centered column — everything flows here ── */}
      <article style={{
        maxWidth:  '740px',
        margin:    '0 auto',
        padding:   'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)',
      }}>

        {/* Breaking badge */}
        {article.articleType === 'breaking-news' && (
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--black)', background: '#e74c3c', padding: '3px 8px', borderRadius: '3px', marginBottom: '20px' }}>
            Breaking
          </span>
        )}

        {/* Categories */}
        {article.categories.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {article.categories.map(cat => (
              <a key={cat} href="/news" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[cat] || '#4f8ef7', textDecoration: 'none' }}>
                {cat}
              </a>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    'clamp(28px, 4.5vw, 48px)',
          fontWeight:  800,
          color:       'var(--white)',
          lineHeight:  1.12,
          margin:      '0 0 20px',
          letterSpacing: '-0.01em',
        }}>
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p style={{
            fontFamily:  'var(--font-serif)',
            fontSize:    'clamp(16px, 2vw, 19px)',
            color:       'rgba(var(--ink),0.9)',
            lineHeight:  1.6,
            margin:      '0 0 28px',
            fontWeight:  400,
          }}>
            {article.excerpt}
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
          {article.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {article.author.avatar && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  loading="lazy"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ color: 'rgba(var(--ink),0.7)' }}>{article.author.name}</span>
            </div>
          )}
          {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          <span>{article.readingTime} min read</span>
          <span>{article.views} views</span>
        </div>

        {/* Hero image — proper aspect ratio, rounded, contained */}
        {article.featuredImage && (
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
              src={article.featuredImage}
              alt={article.title}
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Article body */}
        <div style={{
          fontFamily:  'var(--font-serif)',
          fontSize:    'clamp(16px, 1.8vw, 18px)',
          lineHeight:  1.9,
          color:       'rgba(var(--ink),0.9)',
          letterSpacing: '0.01em',
        }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginTop: '56px', paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', marginRight: '4px' }}>
              Tags
            </span>
            {article.tags.map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', border: '1px solid rgba(var(--ink),0.1)', borderRadius: '4px', padding: '3px 10px' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
          <a href="/news" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← Back to News
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
                <a key={r.id} href={`/news/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ background: 'var(--panel)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '12px', padding: '24px', height: '100%', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    
                  >
                    {r.categories[0] && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[r.categories[0]] || '#4f8ef7', display: 'block', marginBottom: '10px' }}>
                        {r.categories[0]}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, margin: '0 0 14px' }}>
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
