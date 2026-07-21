'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ArticleCard, ArticleCategory } from '@/types/article'
import { timeAgo } from '@/lib/utils'

const CATEGORIES: ArticleCategory[] = [
  'NASA', 'SpaceX', 'ISRO', 'ESA', 'JAXA',
  'Astronomy', 'Discoveries', 'Technology', 'Missions', 'Science',
]

const PER_PAGE = 12

interface Props {
  articles: ArticleCard[]
  featured: ArticleCard[]
  total:    number
}

export function NewsPage({ articles: initialArticles, total: initialTotal }: Props) {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all')

  // Infinite scroll: seed with the SSR'd first page, then append as we scroll.
  const [articles, setArticles] = useState<ArticleCard[]>(initialArticles)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(initialTotal)
  const [loading,  setLoading]  = useState(false)

  const loadingRef  = useRef(false)               // guards against double-fires
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const reachedEnd  = articles.length >= total

  const loadMore = useCallback(async () => {
    if (loadingRef.current || articles.length >= total) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/articles?page=${page + 1}&perPage=${PER_PAGE}`)
      if (res.ok) {
        const data = await res.json()
        const incoming: ArticleCard[] = data.articles || []
        setArticles(prev => {
          const seen = new Set(prev.map(a => a.id))
          return [...prev, ...incoming.filter(a => !seen.has(a.id))]
        })
        setPage(p => p + 1)
        if (typeof data.total === 'number') setTotal(data.total)
      }
    } catch {
      /* transient — the sentinel stays and we retry on the next scroll */
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [articles.length, total, page])

  // Fire loadMore a little before the sentinel is visible (rootMargin) so new
  // cards are ready by the time the reader reaches the bottom.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

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
        {articles.length === 0 && reachedEnd ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
            <p style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>No articles published yet.</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
              Articles published from the admin panel will appear here.
            </p>
          </div>
        ) : (
          <>
            {gridItems.length > 0 && (
              <div className="grid-3">
                {gridItems.map(article => <GridCard key={article.id} article={article} />)}
              </div>
            )}

            {/* Active category matched nothing in what's loaded, and nothing more to load */}
            {gridItems.length === 0 && reachedEnd && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No articles in this category yet.</p>
            )}

            {/* Infinite scroll: sentinel triggers the next page while more remain */}
            {!reachedEnd && <div ref={sentinelRef} aria-hidden style={{ height: '1px' }} />}

            {loading && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                Loading more…
              </p>
            )}
            {reachedEnd && gridItems.length > 0 && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                You&rsquo;ve reached the end · {total} article{total !== 1 ? 's' : ''}
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
