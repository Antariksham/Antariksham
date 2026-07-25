'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link2, Check, List, ChevronDown } from 'lucide-react'
import { tocIds, type TocItem } from '@/modules/articles/services/toc'
import { HI_SANS, type LanguageCode } from '@/lib/i18n'

/**
 * Automatic Table of Contents — Phase 2, Feature 1.
 * ─────────────────────────────────────────────────────────────────
 * Renders the nested heading tree produced by `buildToc`. Two visual variants
 * share ALL behaviour:
 *   • `rail`   — a sticky sidebar for desktop (hidden below the layout breakpoint).
 *   • `inline` — a collapsible <details> panel for mobile AND the admin live
 *                preview (so editors watch the TOC update as they type).
 *
 * IFRAME-SAFE: the admin preview portals the article into an <iframe>, so this
 * component's code runs in the PARENT window while its DOM lives in the iframe.
 * Every scroll/measure therefore resolves the working document + window from the
 * nav element's `ownerDocument` / `defaultView` — never the globals — so
 * scroll-spy, the progress meter and smooth-scroll are correct in both the real
 * reader and the preview.
 *
 * HYDRATION-SAFE: the full list renders on the server; interactive state
 * (active heading, progress, copied) starts empty and only updates after mount.
 *
 * ACCESSIBILITY: a labelled <nav> landmark, real list semantics, `aria-current`
 * on the active link, keyboard-reachable copy buttons, focus moved to the target
 * heading on navigation, and `prefers-reduced-motion` honoured.
 */

export type TocVariant = 'rail' | 'inline'

export function TableOfContents({
  items,
  variant = 'rail',
  lang = 'en',
  /** Keep the inline panel visible at every width (used by the admin preview). */
  forceVisible = false,
}: {
  items: TocItem[]
  variant?: TocVariant
  lang?: LanguageCode
  forceVisible?: boolean
}) {
  const navRef = useRef<HTMLElement>(null)
  const ids = useMemo(() => tocIds(items), [items])
  const hasNesting = useMemo(() => items.some(i => i.children.length > 0), [items])

  const [activeId, setActiveId] = useState('')
  const [progress, setProgress] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [open, setOpen] = useState(false) // inline <details> open state (mobile)
  const [copiedId, setCopiedId] = useState('')

  const sansFont = lang === 'hi' ? HI_SANS : 'var(--font-sans)'

  // ── Scroll-spy + reading progress ────────────────────────────
  // One rAF-throttled handler on the correct window (parent or iframe) drives
  // both the active-heading highlight and the progress meter.
  useEffect(() => {
    const navEl = navRef.current
    if (!navEl || ids.length === 0) return
    const doc = navEl.ownerDocument
    const win = doc.defaultView
    if (!win) return

    // Nav clearance for the "which heading is at the top" test.
    const navOffset = (() => {
      const raw = getComputedStyle(doc.documentElement).getPropertyValue('--nav-height')
      const n = parseInt(raw, 10)
      return Number.isFinite(n) ? n : 64
    })() + 24

    let raf = 0
    const measure = () => {
      raf = 0
      const headings = ids
        .map(id => doc.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
      if (headings.length === 0) return

      // Active = last heading whose top has scrolled past the clearance line.
      let current = headings[0].id
      for (const h of headings) {
        if (h.getBoundingClientRect().top - navOffset <= 1) current = h.id
        else break
      }
      setActiveId(current)

      // Progress = how far through the article body we've scrolled.
      const body = doc.querySelector<HTMLElement>('.article-body')
      if (body) {
        const rect = body.getBoundingClientRect()
        const viewH = doc.documentElement.clientHeight || win.innerHeight || 1
        const scrollable = rect.height - viewH
        const pct = scrollable > 0 ? (-rect.top) / scrollable : (rect.top <= 0 ? 1 : 0)
        setProgress(Math.max(0, Math.min(1, pct)))
      }
    }

    const onScroll = () => { if (!raf) raf = win.requestAnimationFrame(measure) }

    measure()
    win.addEventListener('scroll', onScroll, { passive: true })
    win.addEventListener('resize', onScroll, { passive: true })
    return () => {
      win.removeEventListener('scroll', onScroll)
      win.removeEventListener('resize', onScroll)
      if (raf) win.cancelAnimationFrame(raf)
    }
  }, [ids])

  // ── Smooth scroll + deep-link + a11y focus ───────────────────
  const goTo = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const navEl = navRef.current
    const doc = navEl?.ownerDocument ?? document
    const win = doc.defaultView ?? window
    const target = doc.getElementById(id)
    if (!target) return
    const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    // Update the address bar so the section is a shareable deep link.
    try { win.history.replaceState(null, '', `#${id}`) } catch { /* ignore */ }
    // Move focus to the heading for keyboard/screen-reader users.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    setActiveId(id)
    setOpen(false) // collapse the mobile panel after choosing
  }, [])

  // ── Copy a section deep-link to the clipboard ────────────────
  const copyLink = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const navEl = navRef.current
    const win = navEl?.ownerDocument?.defaultView ?? window
    const base = `${win.location.origin}${win.location.pathname}`
    const url = `${base}#${id}`
    const clip = win.navigator?.clipboard ?? navigator.clipboard
    clip?.writeText(url).then(
      () => {
        setCopiedId(id)
        win.setTimeout(() => setCopiedId(c => (c === id ? '' : c)), 1600)
      },
      () => { /* clipboard blocked (e.g. preview about:blank) — ignore */ },
    )
  }, [])

  if (ids.length < 2) return null // a single heading isn't a useful TOC

  const list = (
    <TocList
      items={items}
      activeId={activeId}
      expanded={expanded}
      copiedId={copiedId}
      onNavigate={goTo}
      onCopy={copyLink}
      sansFont={sansFont}
      lang={lang}
    />
  )

  const header = (
    <div className="article-toc__head">
      <span className="article-toc__label" style={{ fontFamily: sansFont }}>
        <List size={13} aria-hidden /> On this page
      </span>
      {hasNesting && (
        <button
          type="button"
          className="article-toc__toggle"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  )

  const progressBar = (
    <div
      className="article-toc__progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <span className="article-toc__progress-fill" style={{ height: `${progress * 100}%` }} />
    </div>
  )

  if (variant === 'inline') {
    return (
      <details
        className={`article-toc article-toc--inline${forceVisible ? ' article-toc--force' : ''}`}
        open={open}
        onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="article-toc__summary" style={{ fontFamily: sansFont }}>
          <span><List size={14} aria-hidden /> Table of contents</span>
          <ChevronDown size={16} aria-hidden className="article-toc__chevron" />
        </summary>
        <nav ref={navRef} aria-label="Table of contents" className="article-toc__body">
          {hasNesting && (
            <div className="article-toc__head article-toc__head--inline">
              <button
                type="button"
                className="article-toc__toggle"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
              >
                {expanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}
          {list}
        </nav>
      </details>
    )
  }

  // Desktop sticky rail
  return (
    <nav
      ref={navRef}
      aria-label="Table of contents"
      className="article-toc article-toc--rail"
    >
      {header}
      <div className="article-toc__scroll">
        {progressBar}
        {list}
      </div>
    </nav>
  )
}

// ── Recursive list renderer ────────────────────────────────────
function TocList({
  items, activeId, expanded, copiedId, onNavigate, onCopy, sansFont, lang, depth = 0,
}: {
  items: TocItem[]
  activeId: string
  expanded: boolean
  copiedId: string
  onNavigate: (e: React.MouseEvent, id: string) => void
  onCopy: (e: React.MouseEvent, id: string) => void
  sansFont: string
  lang: LanguageCode
  depth?: number
}) {
  return (
    <ul className="article-toc__list" data-depth={depth}>
      {items.map(item => {
        const active = item.id === activeId
        return (
          <li key={item.id} className="article-toc__item" data-level={item.level}>
            <span className={`article-toc__row${active ? ' is-active' : ''}`}>
              <a
                href={`#${item.id}`}
                className="article-toc__link"
                aria-current={active ? 'location' : undefined}
                onClick={e => onNavigate(e, item.id)}
                style={{ fontFamily: sansFont }}
                lang={lang}
              >
                {item.text}
              </a>
              <button
                type="button"
                className="article-toc__copy"
                onClick={e => onCopy(e, item.id)}
                aria-label={`Copy link to “${item.text}”`}
                title="Copy link to section"
              >
                {copiedId === item.id ? <Check size={12} aria-hidden /> : <Link2 size={12} aria-hidden />}
              </button>
            </span>
            {item.children.length > 0 && expanded && (
              <TocList
                items={item.children}
                activeId={activeId}
                expanded={expanded}
                copiedId={copiedId}
                onNavigate={onNavigate}
                onCopy={onCopy}
                sansFont={sansFont}
                lang={lang}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
