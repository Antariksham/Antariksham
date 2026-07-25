/**
 * Publishing Scheduler — pure core (Phase 2, Feature 4).
 * ─────────────────────────────────────────────────────────────────
 * DOM-free scheduling logic: convert between stored UTC ISO and the browser's
 * `datetime-local` inputs, derive a human status/countdown for an article, whom
 * to publish/expire now (for the cron job), and validate a schedule. Kept pure
 * so it is reusable and unit-testable.
 */
import type { ArticleStatus } from '@/types/article'

export interface ScheduleFields {
  status:      ArticleStatus
  publishedAt: string | null
  scheduledAt: string | null
  expireAt:    string | null
}

export type ScheduleState = 'draft' | 'scheduled' | 'live' | 'expired' | 'archived'

const pad = (n: number) => String(n).padStart(2, '0')

/** UTC ISO → a value for `<input type="datetime-local">` (in local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `datetime-local` value (local time) → UTC ISO for storage. */
export function fromLocalInput(local: string): string | null {
  if (!local) return null
  const d = new Date(local) // no offset ⇒ parsed as local time
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Compact human duration, e.g. "2d 3h" / "5m". Two most-significant units. */
export function humanizeMs(ms: number): string {
  if (ms <= 0) return 'now'
  let s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400); s -= d * 86400
  const h = Math.floor(s / 3600);  s -= h * 3600
  const m = Math.floor(s / 60);    s -= m * 60
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (parts.length === 0) parts.push(`${s}s`)
  return parts.slice(0, 2).join(' ')
}

export interface ScheduleView {
  state:       ScheduleState
  label:       string
  tone:        'green' | 'gold' | 'red' | 'dim' | 'accent'
  countdownMs: number | null   // to publish (scheduled) or to expiry (live)
}

/** Derive the display state + countdown for an article's scheduling. */
export function scheduleView(f: ScheduleFields, now: number = Date.now()): ScheduleView {
  const sched = f.scheduledAt ? Date.parse(f.scheduledAt) : null
  const exp   = f.expireAt ? Date.parse(f.expireAt) : null

  if (f.status === 'archived') return { state: 'archived', label: 'Archived', tone: 'dim', countdownMs: null }

  if (f.status === 'scheduled') {
    if (sched && sched > now) return { state: 'scheduled', label: `Publishes in ${humanizeMs(sched - now)}`, tone: 'accent', countdownMs: sched - now }
    return { state: 'scheduled', label: 'Publishing due…', tone: 'accent', countdownMs: 0 }
  }

  if (f.status === 'published') {
    if (exp && exp <= now) return { state: 'expired', label: 'Expired', tone: 'red', countdownMs: null }
    if (exp && exp > now)  return { state: 'live', label: `Expires in ${humanizeMs(exp - now)}`, tone: 'gold', countdownMs: exp - now }
    return { state: 'live', label: 'Live', tone: 'green', countdownMs: null }
  }

  return { state: 'draft', label: 'Draft', tone: 'gold', countdownMs: null }
}

export interface ScheduleIssue { level: 'error' | 'warning'; message: string }

/** Validate a schedule before saving. */
export function validateSchedule(
  f: { status: ArticleStatus; scheduledAt: string | null; expireAt: string | null },
  now: number = Date.now(),
): ScheduleIssue[] {
  const issues: ScheduleIssue[] = []
  const sched = f.scheduledAt ? Date.parse(f.scheduledAt) : null
  const exp   = f.expireAt ? Date.parse(f.expireAt) : null

  if (f.status === 'scheduled') {
    if (!sched) issues.push({ level: 'error', message: 'Pick a date & time to schedule.' })
    else if (sched <= now) issues.push({ level: 'error', message: 'Scheduled time is in the past.' })
  }
  if (exp != null) {
    const base = sched ?? now
    if (exp <= base) issues.push({ level: 'error', message: 'Expiry must be after the publish time.' })
  }
  return issues
}

// ── Cron helpers (which rows need a transition now) ────────────
export interface SchedRow { id: string; status: ArticleStatus; scheduledAt: string | null; expireAt: string | null }

/** Scheduled articles whose time has arrived → publish. */
export function dueForPublish(rows: SchedRow[], now: number = Date.now()): string[] {
  return rows.filter(r => r.status === 'scheduled' && r.scheduledAt && Date.parse(r.scheduledAt) <= now).map(r => r.id)
}

/** Published articles past their expiry → archive. */
export function dueForExpiry(rows: SchedRow[], now: number = Date.now()): string[] {
  return rows.filter(r => r.status === 'published' && r.expireAt && Date.parse(r.expireAt) <= now).map(r => r.id)
}
