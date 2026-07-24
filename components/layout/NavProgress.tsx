'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Site-wide navigation progress bar.
 *
 * Next.js 14 App Router gives no built-in signal that a `<Link>` click has
 * started a (possibly slow, `force-dynamic`) server render — the page just sits
 * there. This component fills that gap with zero dependencies:
 *
 *  - START:  a capture-phase click listener detects clicks on any internal
 *            anchor (covers `<Link>`, `.card`, nav links, plain `<a>`) plus
 *            browser back/forward via `popstate`.
 *  - FINISH: the bar completes when `usePathname()`/`useSearchParams()` change,
 *            i.e. the transition actually committed. A safety timer guarantees
 *            it never hangs if a navigation is cancelled.
 *
 * The visual lives in `.nav-progress` (styles/globals.css). Rerunning the
 * animation from 0 is done by bumping `runId`, which remounts the bar element.
 */
export function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [runId, setRunId] = useState(0)

  const firstRender = useRef(true)
  const doneTimer = useRef<ReturnType<typeof setTimeout>>()
  const safetyTimer = useRef<ReturnType<typeof setTimeout>>()

  const finish = useCallback(() => {
    clearTimeout(safetyTimer.current)
    setPhase((p) => (p === 'loading' ? 'done' : p))
    clearTimeout(doneTimer.current)
    doneTimer.current = setTimeout(() => setPhase('idle'), 400)
  }, [])

  const start = useCallback(() => {
    clearTimeout(doneTimer.current)
    clearTimeout(safetyTimer.current)
    setRunId((id) => id + 1) // remount → restart the CSS creep from 0
    setPhase('loading')
    // If the navigation is cancelled (e.g. same page, or a prefetch-only
    // resolution), don't leave the bar stranded.
    safetyTimer.current = setTimeout(finish, 12000)
  }, [finish])

  // Complete the bar whenever the committed route changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    finish()
  }, [pathname, searchParams, finish])

  // Start the bar on any qualifying internal navigation click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return
      if (anchor.hasAttribute('download')) return

      const target = anchor.getAttribute('target')
      if (target && target !== '_self') return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }

      // Skip external links and pure in-page hash/anchor jumps.
      if (url.origin !== window.location.origin) return
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return
      }

      start()
    }

    // popstate covers browser back/forward, which can also hit slow routes.
    function onPopState() {
      start()
    }

    document.addEventListener('click', onClick, { capture: true })
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      window.removeEventListener('popstate', onPopState)
    }
  }, [start])

  // Clear any pending timers on unmount.
  useEffect(
    () => () => {
      clearTimeout(doneTimer.current)
      clearTimeout(safetyTimer.current)
    },
    [],
  )

  const cls =
    phase === 'loading'
      ? 'nav-progress loading'
      : phase === 'done'
        ? 'nav-progress done'
        : 'nav-progress'

  return <div key={runId} className={cls} aria-hidden="true" />
}
