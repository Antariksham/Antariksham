'use client'

import { useEffect, useState } from 'react'

/**
 * Track how far the reader has scrolled through the article — Phase 2, Feature 2.
 * Returns `progress` (0–1 through the `.article-body`) and the current `scrollY`.
 * A single passive, rAF-throttled scroll/resize listener keeps it cheap. Runs on
 * the production reading page only (main window), so it uses the globals
 * directly. Consumers mount it where they need it (progress bar, return-to-top
 * threshold, live "% complete", resume saver).
 */
export function useReadingProgress(): { progress: number; scrollY: number } {
  const [state, setState] = useState({ progress: 0, scrollY: 0 })

  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const doc = document.documentElement
      const scrollY = window.scrollY || doc.scrollTop || 0
      const body = document.querySelector<HTMLElement>('.article-body')
      let progress: number
      if (body) {
        const rect = body.getBoundingClientRect()
        const vh = doc.clientHeight || window.innerHeight || 1
        const total = rect.height - vh
        progress = total > 0 ? -rect.top / total : rect.top <= 0 ? 1 : 0
      } else {
        const total = doc.scrollHeight - doc.clientHeight
        progress = total > 0 ? scrollY / total : 0
      }
      setState({ progress: Math.max(0, Math.min(1, progress)), scrollY })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return state
}
