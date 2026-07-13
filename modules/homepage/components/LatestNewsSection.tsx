'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { ArticleCard } from '@/types/article'

const CATEGORY_COLORS: Record<string, string> = {
  'NASA':        '#4f8ef7',
  'SpaceX':      '#4f8ef7',
  'ISRO':        '#f39c12',
  'ESA':         '#4f8ef7',
  'JAXA':        '#2ecc71',
  'Astronomy':   '#2ecc71',
  'Discoveries': '#2ecc71',
  'Technology':  '#f39c12',
  'Missions':    '#4f8ef7',
  'Science':     '#2ecc71',
}

function getCategoryColor(categories: string[] | undefined): string {
  if (!categories?.length) return '#4f8ef7'
  return CATEGORY_COLORS[categories[0]] || '#4f8ef7'
}

function ArticleTag({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    'breaking-news':     { label: 'Breaking',  color: '#e74c3c', bg: 'rgba(231,76,60,0.15)'   },
    analysis:            { label: 'Analysis',  color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)'  },
    editorial:           { label: 'Editorial', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
    'research-breakdown':{ label: 'Research',  color: '#2ecc71', bg: 'rgba(46,204,113,0.12)'  },
    explainer:           { label: 'Explainer', color: '#f39c12', bg: 'rgba(249,115,22,0.12)'  },
    guide:               { label: 'Guide',     color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
    'mission-update':    { label: 'Mission',   color: '#f39c12', bg: 'rgba(243,156,18,0.12)' },
  }
  const t = map[type] || { label: 'News', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' }
  return (
    <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', background: t.bg, color: t.color }}>
      {t.label}
    </span>
  )
}

interface Props { articles: ArticleCard[] }

export function LatestNewsSection({ articles }: Props) {
  const lead      = articles[0] || null
  const secondary = articles.slice(1, 3)
  const compact   = articles.slice(3, 7)

  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '8px' }}>Editorial</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Space Intelligence & Journalism</div>
          </div>
          <Link href="/news" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', whiteSpace: 'nowrap', paddingTop: '4px' }}>
            All articles →
          </Link>
        </div>

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>No articles published yet</p>
          </div>
        )}

        {/* Lead card */}
        {lead && (
          <Link href={`/news/${lead.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div
              style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {lead.featuredImage && (
                <div style={{ width: '100%', height: 'clamp(180px,25vw,280px)', overflow: 'hidden' }}>
                  <img src={lead.featuredImage} alt={lead.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <div style={{ padding: '28px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: getCategoryColor(lead.categories), marginBottom: '14px' }}>
                  {lead.categories?.[0] || 'Space'}
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 400, lineHeight: 1.2, color: '#ffffff', marginBottom: '14px' }}>{lead.title}</h2>
                {lead.excerpt && (
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>{lead.excerpt}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  <span>{lead.author?.name ? `By ${lead.author.name}` : 'Antariksham Editorial'}{lead.readingTime ? ` · ${lead.readingTime} min read` : ''}</span>
                  <ArticleTag type={lead.articleType || 'news'} />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Secondary row */}
        {secondary.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {secondary.map(a => (
              <Link key={a.id} href={`/news/${a.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div
                  style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: getCategoryColor(a.categories), marginBottom: '12px' }}>{a.categories?.[0] || 'Space'}</div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px' }}>{a.title}</h3>
                    {a.excerpt && (
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,0.9)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    <span>{a.readingTime ? `${a.readingTime} min read` : timeAgo(a.publishedAt || '')}</span>
                    <ArticleTag type={a.articleType || 'news'} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Compact row */}
        {compact.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {compact.map(a => (
              <Link key={a.id} href={`/news/${a.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div
                  style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '22px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: getCategoryColor(a.categories), marginBottom: '10px' }}>{a.categories?.[0] || 'Space'}</div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff' }}>{a.title}</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '14px' }}>
                    <span>{a.readingTime ? `${a.readingTime} min` : timeAgo(a.publishedAt || '')}</span>
                    <ArticleTag type={a.articleType || 'news'} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
