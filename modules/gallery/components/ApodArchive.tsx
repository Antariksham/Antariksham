'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  APOD_EPOCH, olderWindow, windowEndingAt, mergeApodPages,
  type ApodItem, type ApodWindow,
} from '@/modules/nasa/services/apodArchive'
import { Lightbox } from './Lightbox'

interface Props {
  /** First page, fetched on the server so the archive is indexable. */
  initialItems: ApodItem[]
  /** Newest available APOD date (bounds the date picker). */
  latestDate: string
  /** True when the server could not reach NASA (missing key, outage). */
  initialError?: boolean
}

export function ApodArchive({ initialItems, latestDate, initialError }: Props) {
  const [items, setItems]     = useState<ApodItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(initialError ? 'unavailable' : '')
  const [done, setDone]       = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [jumpDate, setJumpDate] = useState('')

  const load = useCallback(async (win: ApodWindow, replace: boolean) => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ start: win.start })
      if (win.end) qs.set('end', win.end)
      const res = await fetch(`/api/apod?${qs}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || !Array.isArray(data.items)) {
        throw new Error(data?.error || 'The APOD archive is unavailable right now.')
      }
      setItems(prev => (replace ? data.items : mergeApodPages(prev, data.items)))
      if (!replace && data.items.length === 0) setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Deep link: /gallery/apod?date=YYYY-MM-DD opens the archive at that date.
  // Read after mount (not useSearchParams) so the route stays statically
  // renderable and SSR output is unchanged.
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('date')
    if (!d) return
    setJumpDate(d)
    setDone(false)
    load(windowEndingAt(d, latestDate), true)
  }, [load, latestDate])

  const oldest = items.length ? items[items.length - 1].date : latestDate
  const nextWindow = olderWindow(oldest)
  const atEpoch = nextWindow === null

  const jump = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jumpDate) return
    setDone(false)
    load(windowEndingAt(jumpDate, latestDate), true)
  }

  return (
    <div>
      <form className="apod-controls" onSubmit={jump}>
        <label className="apod-jump">
          <span className="apod-jump-label">Jump to date</span>
          <input
            type="date"
            className="gallery-search-input apod-date-input"
            value={jumpDate}
            min={APOD_EPOCH}
            max={latestDate}
            onChange={e => setJumpDate(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary press" disabled={!jumpDate || loading}>
          Go
        </button>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-outline press"
            onClick={() => { setJumpDate(''); setDone(false); load(windowEndingAt(latestDate, latestDate), true) }}
            disabled={loading}
          >
            Latest
          </button>
        )}
      </form>

      <p className="gallery-count" aria-live="polite">
        {items.length > 0
          ? `Showing ${items.length} · ${items[items.length - 1].date} to ${items[0].date}`
          : 'Astronomy Picture of the Day archive'}
        {loading && ' · loading…'}
      </p>

      {error && (
        <p className="sky-error" role="alert" style={{ margin: '10px 0' }}>
          {error === 'unavailable'
            ? 'The APOD archive is unavailable right now — NASA’s feed could not be reached.'
            : error}
        </p>
      )}

      <div className="gallery-grid">
        {items.map((item, i) => (
          <button key={item.date} type="button" className="gallery-item press"
            onClick={() => setLightbox(i)} aria-label={`Open ${item.title}, ${item.date}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumb} alt={item.title} loading="lazy" decoding="async"
              className="gallery-img"
              onError={e => { (e.currentTarget.closest('.gallery-item') as HTMLElement)?.style.setProperty('display', 'none') }} />
            <span className="apod-date-chip">{item.date}</span>
            {item.mediaType === 'video' && <span className="apod-video-chip">▶ Video</span>}
            <span className="gallery-item-title">{item.title}</span>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 26 }}>
        {atEpoch ? (
          <p className="sky-note">
            That’s the beginning — {APOD_EPOCH} was the first Astronomy Picture of the Day.
          </p>
        ) : done ? (
          <p className="sky-note">No more entries in that direction.</p>
        ) : (
          items.length > 0 && (
            <button type="button" className="btn btn-outline press" disabled={loading}
              onClick={() => load(nextWindow!, false)}>
              {loading ? 'Loading…' : 'Load earlier pictures'}
            </button>
          )
        )}
      </div>

      <p className="sky-note" style={{ marginTop: 18 }}>
        Every entry links to its original page on apod.nasa.gov. See{' '}
        <Link href="/live/apod" className="body-link">today’s picture</Link> or{' '}
        <Link href="/gallery" className="body-link">search the wider NASA image library</Link>.
      </p>

      {lightbox !== null && (
        <Lightbox images={items} index={lightbox}
          onClose={() => setLightbox(null)} onMove={setLightbox} />
      )}
    </div>
  )
}
