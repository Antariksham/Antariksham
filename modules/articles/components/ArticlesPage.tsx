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

function buildQuery(page: number, category: ArticleCategory | 'all') {
  const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) })
  if (category !== 'all') params.set('category', category)
  return params.toString()
}

export function ArticlesPage({ articles: initialArticles, total: initialTotal }: Props) {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all')

  // Infinite scroll seeded with the SSR'd first page; the category filter is
  // applied at the database (see /api/articles) so we only ever load matching rows.
  const [articles, setArticles] = useState<ArticleCard[]>(initialArticles)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(initialTotal)
  const [loading,  setLoading]  = useState(false)

  const loadingRef  = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const firstRender = useRef(true)
  const reachedEnd  = articles.length >= total

  // Category change → reset and load page 1 for that filter from the server.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return } // SSR already has page 1 of "all"
    let cancelled = false
    loadingRef.current = true
    setLoading(true)
    setArticles([])
    setPage(1)
    fetch(`/api/articles?${buildQuery(1, activeCategory)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return
        setArticles(data.articles || [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      })
      .finally(() => { if (!cancelled) { loadingRef.current = false; setLoading(false) } })
    return () => { cancelled = true }
  }, [activeCategory])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || articles.length >= total) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/articles?${buildQuery(page + 1, activeCategory)}`)
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
  }, [articles.length, total, page, activeCategory])

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

  const switching = loading && articles.length === 0

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      {/* Page header */}
      <header className="page-header">
        <div className="container">
          <p className="card-category" style={{ marginBottom: '0.6rem' }}>Space Intelligence</p>
          <h1 className="page-title">Articles</h1>
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
        {switching ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading…</p>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
            <p style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {activeCategory === 'all' ? 'No articles published yet.' : 'No articles in this category yet.'}
            </p>
            {activeCategory === 'all' && (
              <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                Articles published from the admin panel will appear here.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid-3">
              {articles.map(article => <GridCard key={article.id} article={article} />)}
            </div>

            {/* Infinite scroll: sentinel triggers the next page while more remain */}
            {!reachedEnd && <div ref={sentinelRef} aria-hidden style={{ height: '1px' }} />}

            {loading && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                Loading more…
              </p>
            )}
            {reachedEnd && (
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
    <a href={`/articles/${article.slug}`} className="card">
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
