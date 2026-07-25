'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { useReader } from './ReaderContext'
import { POSITION_STORAGE_KEY } from './readerPrefs'

/**
 * Remember & resume the reader's last position — Phase 2, Feature 2.
 * Persists the scroll offset per article slug and, on a fresh load near the top,
 * offers a one-tap "Resume where you left off" pill. The saved entry is cleared
 * once the reader finishes (>92%), and the pill auto-dismisses as soon as the
 * reader starts scrolling on their own.
 */
interface Position { y: number; pct: number; at: string }
type PositionMap = Record<string, Position>

const OFFER_MIN = 0.05
const OFFER_MAX = 0.92
const WRITE_INTERVAL_MS = 1000

export function ResumeReading() {
  const { meta } = useReader()
  const slug = meta.slug
  const [resumeY, setResumeY] = useState<number | null>(null)
  const lastWrite = useRef(0)

  useEffect(() => {
    // Offer to resume only on a top-of-page load with no explicit anchor target.
    const saved = readMap()[slug]
    if (
      saved && saved.pct >= OFFER_MIN && saved.pct <= OFFER_MAX &&
      !window.location.hash && window.scrollY < 80
    ) {
      setResumeY(saved.y)
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        // Dismiss the pill once the reader moves on their own.
        if (y > 240) setResumeY(cur => (cur != null ? null : cur))

        const now = Date.now()
        if (now - lastWrite.current < WRITE_INTERVAL_MS) return
        lastWrite.current = now

        const doc = document.documentElement
        const total = doc.scrollHeight - doc.clientHeight
        const pct = total > 0 ? y / total : 0
        const map = readMap()
        if (pct >= OFFER_MAX) delete map[slug]
        else map[slug] = { y, pct, at: new Date().toISOString() }
        writeMap(map)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [slug])

  if (resumeY == null) return null

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const resume = () => {
    window.scrollTo({ top: resumeY, behavior: reduce ? 'auto' : 'smooth' })
    setResumeY(null)
  }

  return (
    <div className="reader-resume" role="status">
      <BookOpen size={15} aria-hidden />
      <span>Resume where you left off</span>
      <button type="button" className="reader-resume__go" onClick={resume}>Resume</button>
      <button type="button" className="reader-resume__x" onClick={() => setResumeY(null)} aria-label="Dismiss">
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}

function readMap(): PositionMap {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed as PositionMap : {}
  } catch {
    return {}
  }
}

function writeMap(map: PositionMap) {
  try {
    // Cap the history so the store can't grow unbounded (keep 50 most recent).
    const entries = Object.entries(map)
    if (entries.length > 50) {
      entries.sort((a, b) => (a[1].at < b[1].at ? 1 : -1))
      map = Object.fromEntries(entries.slice(0, 50))
    }
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(map))
  } catch { /* ignore quota / disabled storage */ }
}
