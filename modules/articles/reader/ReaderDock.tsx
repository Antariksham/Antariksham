'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, Share2, Type, X, Link2, Check } from 'lucide-react'
import { useReader } from './ReaderContext'
import { useReadingProgress } from './useReadingProgress'
import { buildShareTargets } from './shareLinks'
import { SHARE_ICONS } from './shareIcons'
import { sendEvent } from '../analytics/beacon'

/**
 * Floating action dock for touch / small screens — Phase 2, Feature 2.
 * A bottom-right stack of FABs:
 *   • Back-to-top (both desktop & mobile) — appears once the reader scrolls down.
 *   • Reading-preferences (mobile only; desktop uses the share rail's Aa button).
 *   • Share (mobile only) — uses the native Web Share API when available, else
 *     opens a fallback menu with the same channels + copy link.
 */
export function ReaderDock() {
  const { meta, setPrefsOpen } = useReader()
  const { scrollY } = useReadingProgress()
  const [url, setUrl] = useState(meta.canonicalUrl)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setUrl(window.location.href) }, [])

  const reduce = () => typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const toTop = () => window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' })

  const share = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try { await navigator.share({ title: meta.title, url }); sendEvent({ articleId: meta.id, type: 'share' }) } catch { /* dismissed */ }
      return
    }
    setMenuOpen(o => !o) // no native share → fallback menu
  }

  const copy = () => {
    sendEvent({ articleId: meta.id, type: 'share' })
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); window.setTimeout(() => setCopied(false), 1600) },
      () => {},
    )
  }

  const targets = buildShareTargets({ url, title: meta.title })
  const showTop = scrollY > 600

  return (
    <div className="reader-dock">
      {menuOpen && (
        <>
          <div className="reader-dock__scrim" onClick={() => setMenuOpen(false)} />
          <div className="reader-dock__menu" role="menu" aria-label="Share this article">
            {targets.map(t => {
              const Icon = SHARE_ICONS[t.key]
              const label = t.label.replace('Share on ', '').replace('Share via ', '')
              return (
                <a
                  key={t.key}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reader-dock__item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={16} aria-hidden /> <span>{label}</span>
                </a>
              )
            })}
            <button type="button" className="reader-dock__item" role="menuitem" onClick={copy}>
              {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          </div>
        </>
      )}

      {showTop && (
        <button
          type="button"
          className="reader-fab reader-fab--top"
          onClick={toTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp size={18} aria-hidden />
        </button>
      )}

      <button
        type="button"
        className="reader-fab reader-dock__mobile"
        onClick={() => setPrefsOpen(true)}
        aria-label="Reading preferences"
        title="Reading preferences"
      >
        <Type size={18} aria-hidden />
      </button>

      <button
        type="button"
        className="reader-fab reader-fab--primary reader-dock__mobile"
        onClick={share}
        aria-label="Share this article"
        aria-expanded={menuOpen}
        title="Share"
      >
        {menuOpen ? <X size={18} aria-hidden /> : <Share2 size={18} aria-hidden />}
      </button>
    </div>
  )
}
