'use client'

import { useState } from 'react'
import type { ArticleCard, ArticleCategory } from '@/types/article'
import { timeAgo } from '@/lib/utils'

const CATEGORIES: ArticleCategory[] = [
  'NASA', 'SpaceX', 'ISRO', 'ESA', 'JAXA',
  'Astronomy', 'Discoveries', 'Technology', 'Missions', 'Science',
]

const CAT_COLORS: Record<string, string> = {
  NASA: '#3b9eff', SpaceX: '#9f7aea', ISRO: '#f97316',
  ESA: '#34d897', JAXA: '#c9a96e', Astronomy: '#3b9eff',
  Discoveries: '#34d897', Technology: '#9f7aea',
  Missions: '#c9a96e', Science: '#f0f4fa',
}

interface Props {
  articles: ArticleCard[]
  featured: ArticleCard[]
  total:    number
}

export function NewsPage({ articles, featured, total }: Props) {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | null>(null)

  const lead      = (featured.length > 0 ? featured[0] : articles[0]) || null
  const gridItems = activeCategory
    ? articles.filter(a => a.categories.includes(activeCategory))
    : articles.filter(a => a.id !== lead?.id)

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* ── Page Header ────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px) 28px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', display: 'block', marginBottom: '12px' }}>
            Space Intelligence
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, color: '#f0f4fa', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Latest News
          </h1>
          <p style={{ color: 'rgba(240,244,250,0.6)', fontSize: 'clamp(14px,1.5vw,16px)', margin: '0 0 28px', maxWidth: '540px' }}>
            Scientific journalism, mission updates, and discoveries from across the space industry.
          </p>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <FilterBtn active={activeCategory === null} onClick={() => setActiveCategory(null)} color="#3b9eff">All</FilterBtn>
            {CATEGORIES.map(cat => (
              <FilterBtn
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                color={CAT_COLORS[cat]}
              >
                {cat}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px)' }}>

        {/* Empty state */}
        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)' }}>
              No articles published yet
            </p>
            <p style={{ color: 'rgba(240,244,250,0.3)', marginTop: '8px', fontSize: '14px' }}>
              Articles published from the admin panel will appear here.
            </p>
          </div>
        )}

        {/* ── Featured article — full width hero card ─── */}
        {lead && !activeCategory && (
          <a href={`/news/${lead.slug}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 'clamp(24px,4vw,40px)' }}>
            <div
              style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              {/* Hero image — fixed height, object-cover */}
              {lead.featuredImage ? (
                <div style={{ width: '100%', height: 'clamp(220px,35vw,440px)', overflow: 'hidden' }}>
                  <img
                    src={lead.featuredImage}
                    alt={lead.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: '100%', height: '280px', background: 'linear-gradient(135deg, #0b0e13 0%, #151c26 100%)' }} />
              )}

              {/* Content overlay */}
              <div style={{ padding: 'clamp(20px,3vw,36px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {lead.articleType === 'breaking-news' && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#07090c', background: '#f05a5a', padding: '3px 8px', borderRadius: '3px' }}>
                      Breaking
                    </span>
                  )}
                  {lead.categories[0] && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[lead.categories[0]] || '#3b9eff' }}>
                      {lead.categories[0]}
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.35)', letterSpacing: '0.05em' }}>
                    Featured
                  </span>
                </div>

                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 400, color: '#f0f4fa', lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-0.01em', maxWidth: '800px' }}>
                  {lead.title}
                </h2>

                {lead.excerpt && (
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(14px,1.5vw,16px)', color: 'rgba(240,244,250,0.6)', lineHeight: 1.65, margin: '0 0 20px', maxWidth: '680px' }}>
                    {lead.excerpt}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.35)' }}>
                  {lead.author && <span style={{ color: 'rgba(240,244,250,0.55)' }}>{lead.author.name}</span>}
                  {lead.publishedAt && <span>{timeAgo(lead.publishedAt)}</span>}
                  <span>{lead.readingTime} min read</span>
                </div>
              </div>
            </div>
          </a>
        )}

        {/* ── Grid section label ─────────────────────── */}
        {gridItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)' }}>
              {activeCategory ? activeCategory : 'All Stories'}
            </span>
          </div>
        )}

        {/* ── Responsive grid ────────────────────────── */}
        {/* Mobile: 1 col | Tablet: 2 col | Desktop: 3 col */}
        {gridItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 'clamp(16px,2vw,28px)',
          }}>
            {gridItems.map(article => (
              <GridCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {total > 12 && (
          <p style={{ textAlign: 'center', marginTop: '48px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.1em' }}>
            Showing 12 of {total} articles
          </p>
        )}
      </div>
    </div>
  )
}

// ── Filter button ─────────────────────────────────────────────
function FilterBtn({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', padding: '6px 14px', borderRadius: '4px',
        border: '1px solid', cursor: 'pointer',
        background: active ? color : 'transparent',
        borderColor: active ? color : 'rgba(255,255,255,0.1)',
        color: active ? '#07090c' : 'rgba(240,244,250,0.5)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Grid card ─────────────────────────────────────────────────
function GridCard({ article }: { article: ArticleCard }) {
  return (
    <a href={`/news/${article.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: '#10151c', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', overflow: 'hidden', height: '100%',
          display: 'flex', flexDirection: 'column',
          cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Card image — fixed height, object-cover */}
        {article.featuredImage ? (
          <div style={{ width: '100%', height: '190px', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={article.featuredImage}
              alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg, #0b0e13 0%, #151c26 100%)', flexShrink: 0 }} />
        )}

        {/* Card content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Breaking badge */}
          {article.articleType === 'breaking-news' && (
            <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#07090c', background: '#f05a5a', padding: '2px 7px', borderRadius: '3px', width: 'fit-content' }}>
              Breaking
            </span>
          )}

          {/* Category */}
          {article.categories[0] && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CAT_COLORS[article.categories[0]] || '#3b9eff' }}>
              {article.categories[0]}
            </span>
          )}

          {/* Title */}
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px,1.8vw,19px)', fontWeight: 400, color: '#f0f4fa', lineHeight: 1.3, margin: 0, flex: 1 }}>
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'rgba(240,244,250,0.5)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)', marginTop: 'auto', paddingTop: '8px' }}>
            {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
            <span>{article.readingTime} min read</span>
          </div>
        </div>
      </div>
    </a>
  )
}
