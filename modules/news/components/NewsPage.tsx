'use client'

import { useState } from 'react'
import type { ArticleCard, ArticleCategory } from '@/types/article'
import { timeAgo } from '@/lib/utils'

const CATEGORIES: ArticleCategory[] = [
  'NASA', 'SpaceX', 'ISRO', 'ESA', 'JAXA',
  'Astronomy', 'Discoveries', 'Technology', 'Missions', 'Science',
]

interface Props {
  articles: ArticleCard[]
  featured: ArticleCard[]
  total:    number
}

export function NewsPage({ articles, total }: Props) {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all')

  const gridItems = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.categories.includes(activeCategory))

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      {/* Page header */}
      <header className="page-header">
        <div className="container">
          <p className="card-category" style={{ marginBottom: '0.6rem' }}>Space Intelligence</p>
          <h1 className="page-title">Latest News</h1>
          <p className="page-lede">
            Scientific journalism, mission updates, and discoveries from across the space industry.
          </p>

          {/* Category filter */}
          <div className="tags-row" style={{ marginTop: '1.25rem' }}>
            <button className={`tag ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`tag ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container section">
        {articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
            <p style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>No articles published yet.</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
              Articles published from the admin panel will appear here.
            </p>
          </div>
        ) : gridItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No articles in this category yet.</p>
        ) : (
          <>
            <div className="grid-3">
              {gridItems.map(article => <GridCard key={article.id} article={article} />)}
            </div>
            {total > articles.length && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                Showing {articles.length} of {total} articles
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────
function GridCard({ article }: { article: ArticleCard }) {
  return (
    <a href={`/news/${article.slug}`} className="card">
      {article.featuredImage
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img className="card-image" src={article.featuredImage} alt={article.title} loading="lazy" />
        : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🪐</div>}
      <div className="card-body">
        {article.articleType === 'breaking-news' && (
          <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white)', background: 'var(--red)', padding: '2px 8px', borderRadius: '3px', marginBottom: '0.5rem' }}>
            Breaking
          </span>
        )}
        <p className="card-category">{article.categories[0] || 'Space'}</p>
        <h3 className="card-title">{article.title}</h3>
        {article.excerpt && <p className="card-excerpt">{article.excerpt}</p>}
        <div className="card-meta">
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
          {article.readingTime ? <span>{article.readingTime} min read</span> : null}
        </div>
      </div>
    </a>
  )
}
