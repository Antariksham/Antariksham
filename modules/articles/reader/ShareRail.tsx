'use client'

import { useEffect, useState } from 'react'
import { Link2, Check, Bookmark, BookmarkCheck, Type } from 'lucide-react'
import { useReader } from './ReaderContext'
import { buildShareTargets } from './shareLinks'
import { SHARE_ICONS } from './shareIcons'
import { sendEvent } from '../analytics/beacon'

/**
 * Sticky vertical share rail for desktop — Phase 2, Feature 2.
 * Lives in the LEFT gutter of the article's 3-track grid (mirroring the TOC
 * rail on the right) and is hidden below the layout breakpoint, where the mobile
 * dock takes over. Share intents open in a new tab; Copy Link and Bookmark are
 * local actions; the "Aa" button opens the reading-preferences panel.
 *
 * The share URL starts from the server-provided canonical (hydration-safe) and
 * upgrades to the live `location.href` after mount.
 */
export function ShareRail() {
  const { meta, bookmarked, toggleBookmark, setPrefsOpen } = useReader()
  const [url, setUrl] = useState(meta.canonicalUrl)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setUrl(window.location.href) }, [])

  const targets = buildShareTargets({ url, title: meta.title })

  const copy = () => {
    sendEvent({ articleId: meta.id, type: 'share' })
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); window.setTimeout(() => setCopied(false), 1600) },
      () => { /* clipboard blocked — ignore */ },
    )
  }

  return (
    <div className="reader-share" role="group" aria-label="Share this article">
      <span className="reader-share__label">Share</span>

      {targets.map(t => {
        const Icon = SHARE_ICONS[t.key]
        return (
          <a
            key={t.key}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="reader-share__btn"
            aria-label={t.label}
            title={t.label}
            onClick={() => sendEvent({ articleId: meta.id, type: 'share' })}
          >
            <Icon size={16} aria-hidden />
          </a>
        )
      })}

      <button
        type="button"
        className="reader-share__btn"
        onClick={copy}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
      </button>

      <button
        type="button"
        className={`reader-share__btn${bookmarked ? ' is-on' : ''}`}
        onClick={toggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this article'}
        title={bookmarked ? 'Bookmarked' : 'Bookmark'}
      >
        {bookmarked ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
      </button>

      <span className="reader-share__divider" aria-hidden />

      <button
        type="button"
        className="reader-share__btn"
        onClick={() => setPrefsOpen(true)}
        aria-label="Reading preferences"
        title="Reading preferences"
      >
        <Type size={16} aria-hidden />
      </button>
    </div>
  )
}
