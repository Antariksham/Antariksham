'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { LanguageCode } from '@/lib/i18n'
import {
  DEFAULT_PREFS, PREFS_STORAGE_KEY, BOOKMARKS_STORAGE_KEY, READER_VAR_NAMES,
  normalizePrefs, prefsToVars, type ReaderPrefs,
} from './readerPrefs'

/**
 * Reader experience context — Phase 2, Feature 2.
 * ─────────────────────────────────────────────────────────────────
 * Owns the cross-cutting reading state shared by the chrome that surrounds the
 * article (the sticky share rail, the mobile action dock, the preferences panel
 * and the resume-reading banner): reading preferences (applied as CSS custom
 * properties + persisted), the bookmark toggle, the article's share metadata,
 * and whether the preferences panel is open.
 *
 * It deliberately does NOT track scroll progress — the progress bar, the resume
 * saver and the live "% complete" readout each own a small passive rAF scroll
 * listener, so a fast scroll never re-renders the whole reading chrome.
 */

export interface ReaderMeta {
  title:       string
  slug:        string
  /** Canonical/site URL; overridden at click-time by the live location. */
  canonicalUrl: string
  lang:        LanguageCode
  words:       number
  readingTime: number
  views:       number | null
  publishedAt: string | null
  updatedAt:   string
}

interface ReaderContextValue {
  meta:        ReaderMeta
  prefs:       ReaderPrefs
  setPref:     <K extends keyof ReaderPrefs>(key: K, value: ReaderPrefs[K]) => void
  resetPrefs:  () => void
  bookmarked:  boolean
  toggleBookmark: () => void
  prefsOpen:   boolean
  setPrefsOpen: (open: boolean) => void
}

const ReaderContext = createContext<ReaderContextValue | null>(null)

/** Access the reading context. Throws if used outside <ReaderProvider>. */
export function useReader(): ReaderContextValue {
  const ctx = useContext(ReaderContext)
  if (!ctx) throw new Error('useReader must be used within <ReaderProvider>')
  return ctx
}

export function ReaderProvider({ meta, children }: { meta: ReaderMeta; children: ReactNode }) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS)
  const [bookmarked, setBookmarked] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  // Guards persisting default prefs over stored ones before the initial load runs.
  const loadedRef = useRef(false)

  // ── Load saved preferences + bookmark state (after mount → hydration-safe) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY)
      if (raw) setPrefs(normalizePrefs(JSON.parse(raw)))
    } catch { /* ignore corrupt storage */ }
    setBookmarked(readBookmarks().some(b => b.slug === meta.slug))
    loadedRef.current = true
  }, [meta.slug])

  // ── Apply preferences as CSS custom properties on <html>; clean up on leave ──
  useEffect(() => {
    const root = document.documentElement
    const vars = prefsToVars(prefs)
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    return () => { for (const name of READER_VAR_NAMES) root.style.removeProperty(name) }
  }, [prefs])

  const setPref = useCallback<ReaderContextValue['setPref']>((key, value) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS)
    try { localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(DEFAULT_PREFS)) } catch { /* ignore */ }
  }, [])

  const toggleBookmark = useCallback(() => {
    const list = readBookmarks()
    const exists = list.some(b => b.slug === meta.slug)
    const next = exists
      ? list.filter(b => b.slug !== meta.slug)
      : [{ slug: meta.slug, title: meta.title, savedAt: new Date().toISOString() }, ...list].slice(0, 500)
    try { localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setBookmarked(!exists)
  }, [meta.slug, meta.title])

  const value = useMemo<ReaderContextValue>(() => ({
    meta, prefs, setPref, resetPrefs, bookmarked, toggleBookmark, prefsOpen, setPrefsOpen,
  }), [meta, prefs, setPref, resetPrefs, bookmarked, toggleBookmark, prefsOpen])

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
}

// ── Bookmark storage helpers ───────────────────────────────────
export interface Bookmark { slug: string; title: string; savedAt: string }

function readBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(b => b && typeof b.slug === 'string') : []
  } catch {
    return []
  }
}
