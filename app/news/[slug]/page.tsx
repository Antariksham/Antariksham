import { getArticleBySlug, getAllArticleSlugs, getRelatedArticles } from '@/modules/news/services/getArticles'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import Image from 'next/image'

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
  NASA: '#3b9eff', SpaceX: '#9f7aea', ISRO: '#f97316',
  ESA: '#34d897', JAXA: '#c9a96e', Astronomy: '#3b9eff',
  Discoveries: '#34d897', Technology: '#9f7aea',
  Missions: '#c9a96e', Science: '#f0f4fa',
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
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#07090c', background: '#f05a5a', padding: '3px 8px', borderRadius: '3px', marginBottom: '20px' }}>
            Breaking
          </span>
        )}

        {/* Categories */}
        {article.categories.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {article.categories.map(cat => (
              <a key={cat} href="/news" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[cat] || '#3b9eff', textDecoration: 'none' }}>
                {cat}
              </a>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily:  'var(--font-serif)',
          fontSize:    'clamp(28px, 4.5vw, 48px)',
          fontWeight:  400,
          color:       '#f0f4fa',
          lineHeight:  1.12,
          margin:      '0 0 20px',
          letterSpacing: '-0.01em',
        }}>
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p style={{
            fontFamily:  'var(--font-sans)',
            fontSize:    'clamp(16px, 2vw, 19px)',
            color:       'rgba(240,244,250,0.65)',
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
          fontSize:      '11px',
          color:         'rgba(240,244,250,0.4)',
          paddingBottom: '28px',
          borderBottom:  '1px solid rgba(255,255,255,0.08)',
          marginBottom:  '36px',
        }}>
          {article.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {article.author.avatar && (
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={28}
                  height={28}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ color: 'rgba(240,244,250,0.7)' }}>{article.author.name}</span>
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
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 800px) 100vw, 800px"
            />
          </div>
        )}

        {/* Article body */}
        <div style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    'clamp(16px, 1.8vw, 18px)',
          lineHeight:  1.9,
          color:       'rgba(240,244,250,0.72)',
          letterSpacing: '0.01em',
        }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginTop: '56px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.3)', marginRight: '4px' }}>
              Tags
            </span>
            {article.tags.map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 10px' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <a href="/news" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3b9eff', textDecoration: 'none' }}>
            ← Back to News
          </a>
        </div>
      </article>

      {/* Related articles — full width section below article */}
      {related.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', display: 'block', marginBottom: '28px' }}>
              Related Stories
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
              {related.map(r => (
                <a key={r.id} href={`/news/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', height: '100%', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    
                  >
                    {r.categories[0] && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[r.categories[0]] || '#3b9eff', display: 'block', marginBottom: '10px' }}>
                        {r.categories[0]}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 400, color: '#f0f4fa', lineHeight: 1.3, margin: '0 0 14px' }}>
                      {r.title}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.35)', letterSpacing: '0.1em' }}>
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
