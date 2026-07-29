'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GalleryImage, GallerySearchResult } from '../services/nasaImages'
import { FALLBACK_IMAGES } from '../services/fallbackImages'
import { Lightbox } from './Lightbox'

// Topic chips → library search queries. "Featured" is the curated set — it
// renders with zero network (SSR fallback per §4) and doubles as the graceful
// state when the live API is unreachable.
const TOPICS = [
  { id: 'featured',   label: 'Featured',   query: null },
  { id: 'nebulae',    label: 'Nebulae',    query: 'nebula' },
  { id: 'galaxies',   label: 'Galaxies',   query: 'galaxy' },
  { id: 'webb',       label: 'Webb',       query: 'james webb space telescope' },
  { id: 'mars',       label: 'Mars',       query: 'mars surface' },
  { id: 'moon',       label: 'Moon',       query: 'apollo lunar surface' },
  { id: 'earth',      label: 'Earth',      query: 'earth from space' },
  { id: 'launches',   label: 'Launches',   query: 'rocket launch' },
  { id: 'astronauts', label: 'Astronauts', query: 'astronaut spacewalk' },
  { id: 'saturn',     label: 'Saturn',     query: 'saturn cassini' },
] as const

type Status = 'idle' | 'loading' | 'error'

export function GalleryPage() {
  const [images, setImages]       = useState<GalleryImage[]>(FALLBACK_IMAGES)
  const [topic, setTopic]         = useState<string>('featured')
  const [query, setQuery]         = useState('')        // active fetch query ('' = featured)
  const [searchText, setSearchText] = useState('')      // controlled input
  const [page, setPage]           = useState(1)
  const [totalHits, setTotalHits] = useState(FALLBACK_IMAGES.length)
  const [status, setStatus]       = useState<Status>('idle')
  const [lightbox, setLightbox]   = useState<number | null>(null)

  const fetchImages = useCallback(async (q: string, nextPage: number, append: boolean) => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/gallery?q=${encodeURIComponent(q)}&page=${nextPage}`)
      const data: GallerySearchResult | { error: string } = await res.json()
      if (!res.ok || !('images' in data)) throw new Error('unavailable')
      setImages(prev => {
        if (!append) return data.images
        const seen = new Set(prev.map(i => i.id))
        return [...prev, ...data.images.filter(i => !seen.has(i.id))]
      })
      setTotalHits(data.totalHits)
      setPage(nextPage)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }, [])

  // Deep link: /gallery?q=… runs that search on arrival (topic hubs link
  // here). Read from `location` rather than `useSearchParams` so the route
  // stays statically renderable; running after mount keeps SSR/hydration
  // byte-identical to the curated Featured set.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')?.trim()
    if (!q) return
    setTopic('search')
    setSearchText(q)
    setQuery(q)
    fetchImages(q, 1, false)
  }, [fetchImages])

  const showFeatured = () => {
    setTopic('featured'); setQuery(''); setPage(1)
    setImages(FALLBACK_IMAGES); setTotalHits(FALLBACK_IMAGES.length); setStatus('idle')
  }

  const selectTopic = (id: string) => {
    const t = TOPICS.find(t => t.id === id)
    if (!t || t.query === null) { showFeatured(); return }
    setTopic(id); setQuery(t.query)
    fetchImages(t.query, 1, false)
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchText.trim()
    if (!q) { showFeatured(); return }
    setTopic('search'); setQuery(q)
    fetchImages(q, 1, false)
  }

  const canLoadMore = query !== '' && images.length < totalHits && status !== 'loading'

  return (
    <div>
      {/* Search + topic rail */}
      <form className="gallery-search" onSubmit={submitSearch} role="search">
        <input
          type="search"
          className="gallery-search-input"
          placeholder="Search the NASA image library — “aurora”, “Titan”, “Artemis”…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          aria-label="Search the NASA image library"
        />
        <button type="submit" className="btn btn-primary press">Search</button>
      </form>

      <div className="orrery-rail" role="tablist" aria-label="Gallery topics">
        {TOPICS.map(t => (
          <button key={t.id} type="button" role="tab"
            aria-selected={topic === t.id}
            data-active={topic === t.id}
            className="orrery-chip press"
            onClick={() => selectTopic(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <p className="sky-error" role="alert" style={{ margin: '10px 0' }}>
          The image library is unreachable right now — showing what’s loaded.
          Try again in a minute.
        </p>
      )}

      <p className="gallery-count" aria-live="polite">
        {topic === 'featured'
          ? 'Curated highlights from the NASA Image and Video Library'
          : `${totalHits.toLocaleString('en-US')} images · showing ${images.length}`}
        {status === 'loading' && ' · loading…'}
      </p>

      {/* Masonry grid (CSS columns) */}
      <div className="gallery-grid">
        {images.map((img, i) => (
          <button key={img.id} type="button" className="gallery-item press"
            onClick={() => setLightbox(i)} aria-label={`Open ${img.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumb} alt={img.title} loading="lazy" decoding="async"
              className="gallery-img"
              onError={e => { (e.currentTarget.closest('.gallery-item') as HTMLElement)?.style.setProperty('display', 'none') }} />
            <span className="gallery-item-title">{img.title}</span>
          </button>
        ))}
      </div>

      {canLoadMore && (
        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <button type="button" className="btn btn-outline press"
            onClick={() => fetchImages(query, page + 1, true)}>
            Load more
          </button>
        </div>
      )}

      {lightbox !== null && (
        <Lightbox images={images} index={lightbox}
          onClose={() => setLightbox(null)} onMove={setLightbox} />
      )}
    </div>
  )
}
