'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Clock, Archive, RotateCw, Ban, Undo2, AlertTriangle } from 'lucide-react'
import type { ArticleStatus } from '@/types/article'
import { toLocalInput, fromLocalInput, scheduleView, validateSchedule } from './scheduling'

const TONE: Record<string, string> = {
  green: 'var(--green)', gold: 'var(--gold)', red: 'var(--red)', accent: 'var(--accent)', dim: 'rgba(var(--ink),0.6)',
}

/**
 * Publishing Scheduler panel (Phase 2, Feature 4) — rendered in the editor's
 * Publish sidebar. Schedule a future publish, set an auto-expiry, and run the
 * lifecycle actions (republish / unpublish / archive / restore) — with a live
 * state pill + countdown and validation. Dates are shown in the browser's local
 * time and stored as UTC. The cron endpoint performs the actual transitions.
 *
 * Hydration-safe: the local-time inputs + countdown only populate after mount
 * (server render shows empty / raw status), so SSR and CSR agree.
 */
export function PublishingScheduler({
  status, publishedAt, scheduledAt, expireAt, saving, canPublish,
  onChangeSchedule, onChangeExpire, onAction,
}: {
  status:      ArticleStatus
  publishedAt: string | null
  scheduledAt: string | null
  expireAt:    string | null
  saving:      boolean
  canPublish:  boolean
  onChangeSchedule: (iso: string | null) => void
  onChangeExpire:   (iso: string | null) => void
  onAction: (status: ArticleStatus, extra?: { republish?: boolean }) => void
}) {
  const [now, setNow] = useState(0) // 0 until mounted → keeps SSR/CSR identical
  useEffect(() => {
    setNow(Date.now())
    const iv = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(iv)
  }, [])
  const mounted = now > 0

  const view = mounted ? scheduleView({ status, publishedAt, scheduledAt, expireAt }, now) : null
  const issues = mounted
    ? validateSchedule({ status: scheduledAt ? 'scheduled' : status, scheduledAt, expireAt }, now)
    : []
  const hasErrors = issues.some(i => i.level === 'error')
  const canSchedule = mounted && !!scheduledAt && !hasErrors && canPublish && !saving

  return (
    <div className="sched">
      <div className="sched-head">
        <span className="sched-label"><CalendarClock size={13} aria-hidden /> Scheduling</span>
        {view && <span className="sched-pill" style={{ color: TONE[view.tone], borderColor: TONE[view.tone] }}>{view.label}</span>}
      </div>

      {/* Schedule a future publish */}
      <label className="sched-field">
        <span><Clock size={12} aria-hidden /> Schedule publish</span>
        <input
          type="datetime-local"
          value={mounted ? toLocalInput(scheduledAt) : ''}
          onChange={e => onChangeSchedule(fromLocalInput(e.target.value))}
        />
      </label>

      {/* Auto-expiry */}
      <label className="sched-field">
        <span><Ban size={12} aria-hidden /> Auto-expire (archive)</span>
        <input
          type="datetime-local"
          value={mounted ? toLocalInput(expireAt) : ''}
          onChange={e => onChangeExpire(fromLocalInput(e.target.value))}
        />
      </label>

      <p className="sched-tz">Times shown in your local timezone; stored as UTC.</p>

      {issues.length > 0 && (
        <ul className="sched-issues">
          {issues.map((i, k) => <li key={k}><AlertTriangle size={11} aria-hidden /> {i.message}</li>)}
        </ul>
      )}

      {/* Actions */}
      <div className="sched-actions">
        <button type="button" className="sched-btn sched-btn--primary" disabled={!canSchedule}
          onClick={() => onAction('scheduled')}
          title={!scheduledAt ? 'Pick a date & time first' : undefined}>
          <CalendarClock size={13} /> Schedule
        </button>

        {status === 'published' && (
          <button type="button" className="sched-btn" disabled={saving} onClick={() => onAction('published', { republish: true })}>
            <RotateCw size={12} /> Republish
          </button>
        )}
        {(status === 'published' || status === 'scheduled') && (
          <button type="button" className="sched-btn" disabled={saving} onClick={() => onAction('draft')}>
            <Undo2 size={12} /> {status === 'scheduled' ? 'Cancel schedule' : 'Unpublish'}
          </button>
        )}
        {status !== 'archived' && (
          <button type="button" className="sched-btn" disabled={saving} onClick={() => onAction('archived')}>
            <Archive size={12} /> Archive
          </button>
        )}
        {status === 'archived' && (
          <button type="button" className="sched-btn" disabled={saving} onClick={() => onAction('draft')}>
            <Undo2 size={12} /> Restore to draft
          </button>
        )}
      </div>
    </div>
  )
}
