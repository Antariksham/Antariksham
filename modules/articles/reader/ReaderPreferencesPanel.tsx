'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Sun, Moon, RotateCcw, Type, AlignLeft, MoveHorizontal, Clock, Eye, BookOpen } from 'lucide-react'
import { formatDate, timeAgo, formatNumber } from '@/lib/utils'
import { useReader } from './ReaderContext'
import { useReadingProgress } from './useReadingProgress'
import {
  FONT_LABELS, LINE_LABELS, WIDTH_LABELS, minutesLeft,
  type FontSize, type LineHeight, type ReadingWidth,
} from './readerPrefs'

/**
 * Reading-preferences panel — Phase 2, Feature 2.
 * A modal sheet with font-size / reading-width / line-height / theme controls
 * (persisted via the reader context) plus a live reading-statistics block
 * (word count, reading time, views, publish + updated dates, and a continuously
 * updating "% complete · min left"). Opened from the desktop share rail or the
 * mobile dock; closes on overlay click or Escape, and restores focus to the
 * element that opened it.
 *
 * Split so the inner panel (which runs the scroll-progress hook) only mounts
 * while open — no scroll work happens when the panel is closed.
 */
export function ReaderPreferencesPanel() {
  const { prefsOpen } = useReader()
  if (!prefsOpen) return null
  return <PanelInner />
}

function PanelInner() {
  const { meta, prefs, setPref, resetPrefs, setPrefsOpen } = useReader()
  const { progress } = useReadingProgress()
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<Element | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Focus the panel on open, remember the opener, restore focus on close.
  useEffect(() => {
    openerRef.current = document.activeElement
    setTheme((document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPrefsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus()
    }
  }, [setPrefsOpen])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch { /* ignore */ }
    setTheme(next)
  }

  const pct = Math.round(progress * 100)
  const left = minutesLeft(meta.readingTime, progress)

  return (
    <div className="reader-prefs" role="dialog" aria-modal="true" aria-label="Reading preferences">
      <div className="reader-prefs__scrim" onClick={() => setPrefsOpen(false)} />
      <div className="reader-prefs__panel">
        <div className="reader-prefs__head">
          <span className="reader-prefs__title"><Type size={15} aria-hidden /> Reading preferences</span>
          <button ref={closeRef} type="button" className="reader-prefs__close" onClick={() => setPrefsOpen(false)} aria-label="Close">
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="reader-prefs__body">
          <Segment<FontSize>
            icon={<Type size={13} aria-hidden />} label="Text size"
            value={prefs.font} onChange={v => setPref('font', v)}
            options={(['sm', 'base', 'lg', 'xl'] as FontSize[]).map(v => ({ value: v, label: FONT_LABELS[v] }))}
          />
          <Segment<ReadingWidth>
            icon={<MoveHorizontal size={13} aria-hidden />} label="Reading width"
            value={prefs.width} onChange={v => setPref('width', v)}
            options={(['narrow', 'default', 'wide'] as ReadingWidth[]).map(v => ({ value: v, label: WIDTH_LABELS[v] }))}
          />
          <Segment<LineHeight>
            icon={<AlignLeft size={13} aria-hidden />} label="Line spacing"
            value={prefs.line} onChange={v => setPref('line', v)}
            options={(['tight', 'normal', 'relaxed'] as LineHeight[]).map(v => ({ value: v, label: LINE_LABELS[v] }))}
          />

          <div className="reader-prefs__field">
            <span className="reader-prefs__field-label">{theme === 'dark' ? <Moon size={13} aria-hidden /> : <Sun size={13} aria-hidden />} Theme</span>
            <div className="reader-seg" role="group" aria-label="Theme">
              <button type="button" className={`reader-seg__opt${theme === 'light' ? ' is-active' : ''}`} aria-pressed={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}>Light</button>
              <button type="button" className={`reader-seg__opt${theme === 'dark' ? ' is-active' : ''}`} aria-pressed={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}>Dark</button>
            </div>
          </div>

          <button type="button" className="reader-prefs__reset" onClick={resetPrefs}>
            <RotateCcw size={13} aria-hidden /> Reset to defaults
          </button>

          {/* ── Reading statistics ── */}
          <div className="reader-prefs__stats">
            <span className="reader-prefs__stats-title">This article</span>
            <div className="reader-prefs__completion" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Completed">
              <span className="reader-prefs__completion-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="reader-prefs__completion-text">{pct}% complete · {left === 0 ? 'finishing up' : `~${left} min left`}</p>
            <dl className="reader-prefs__grid">
              <Stat icon={<BookOpen size={13} aria-hidden />} label="Words" value={formatNumber(meta.words)} />
              <Stat icon={<Clock size={13} aria-hidden />} label="Read time" value={`${meta.readingTime} min`} />
              {meta.views != null && <Stat icon={<Eye size={13} aria-hidden />} label="Views" value={formatNumber(meta.views)} />}
              {meta.publishedAt && <Stat label="Published" value={formatDate(meta.publishedAt)} />}
              <Stat label="Updated" value={timeAgo(meta.updatedAt)} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Segmented control ───────────────────────────────────────────
function Segment<T extends string>({
  icon, label, value, onChange, options,
}: {
  icon: React.ReactNode
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="reader-prefs__field">
      <span className="reader-prefs__field-label">{icon} {label}</span>
      <div className="reader-seg" role="group" aria-label={label}>
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className={`reader-seg__opt${o.value === value ? ' is-active' : ''}`}
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── One reading-stat row ────────────────────────────────────────
function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="reader-prefs__stat">
      <dt>{icon} {label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
