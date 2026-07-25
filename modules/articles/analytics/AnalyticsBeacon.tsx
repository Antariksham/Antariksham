'use client'

import { useEffect } from 'react'
import { sendEvent } from './beacon'

/**
 * Records a `view` on mount and a `read` (max scroll depth + dwell time) when
 * the reader leaves — on tab-hide, page unload, or client-side navigation away.
 * Rendered once per article page. Never throws; analytics must not break reading.
 */
export function AnalyticsBeacon({ articleId, path }: { articleId: string; path: string }) {
  useEffect(() => {
    if (!articleId) return
    sendEvent({ articleId, type: 'view', path })

    const start = Date.now()
    let maxScroll = 0
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      const pct = total > 0 ? Math.round((doc.scrollTop / total) * 100) : 0
      if (pct > maxScroll) maxScroll = Math.min(100, pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let sent = false
    const flush = () => {
      if (sent) return
      sent = true
      sendEvent({ articleId, type: 'read', scrollPct: maxScroll, dwellMs: Date.now() - start, path })
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush() // SPA navigation away from the article
    }
  }, [articleId, path])

  return null
}
