/**
 * Advanced Timeline taxonomy + logic (Phase 1, Feature 5).
 *
 * Pure, DOM-free, dependency-free — shared by the editor, API, services and
 * `node:test`. Owns the status / importance / event-type vocabularies, the
 * normalisation that keeps `completed` and `status` in sync (backward compat),
 * date parsing + sorting, duplicate-date detection, and (co-located) validation.
 * Only the `FieldIssue` TYPE crosses module lines, so nothing is imported at
 * runtime by the test-loaded pure modules.
 */
import type { MissionTimeline, TimelineStatus, TimelineImportance } from '@/types/mission'
import type { FieldIssue } from './missionValidation'

// ── Status ───────────────────────────────────────────────────────────

export const TIMELINE_STATUSES: { value: TimelineStatus; label: string; color: string }[] = [
  { value: 'completed',   label: 'Completed',   color: 'var(--green)' },
  { value: 'in-progress', label: 'In Progress', color: 'var(--accent)' },
  { value: 'upcoming',    label: 'Upcoming',    color: 'rgba(var(--ink),0.4)' },
  { value: 'delayed',     label: 'Delayed',     color: 'var(--gold)' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'var(--red)' },
]

export function timelineStatusMeta(v: string): { label: string; color: string } {
  return TIMELINE_STATUSES.find(s => s.value === v) || { label: 'Upcoming', color: 'rgba(var(--ink),0.4)' }
}

// ── Importance ───────────────────────────────────────────────────────

export const TIMELINE_IMPORTANCE: { value: TimelineImportance; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'var(--red)' },
  { value: 'major',    label: 'Major',    color: 'var(--gold)' },
  { value: 'normal',   label: 'Normal',   color: 'var(--accent)' },
  { value: 'minor',    label: 'Minor',    color: 'rgba(var(--ink),0.4)' },
]

export function timelineImportanceMeta(v: string): { label: string; color: string } {
  return TIMELINE_IMPORTANCE.find(i => i.value === v) || { label: 'Normal', color: 'var(--accent)' }
}

// ── Event types (18 suggested; custom values allowed) ────────────────

export const TIMELINE_EVENT_TYPES: string[] = [
  'Announcement', 'Approval', 'Construction', 'Testing', 'Launch Window',
  'Launch', 'Stage Separation', 'Orbit Insertion', 'Flyby', 'Landing',
  'Surface Operations', 'Sample Collection', 'Experiment', 'Docking',
  'Undocking', 'Mission Extension', 'Mission Complete',
]

// ── Normalisation ────────────────────────────────────────────────────

let _idSeq = 0
/** A short, unique-enough id for reorder keys + duplicate. Not rendered. */
export function genEventId(): string {
  _idSeq = (_idSeq + 1) % 1e6
  return `evt-${Date.now().toString(36)}-${_idSeq.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const STATUS_VALUES = new Set(TIMELINE_STATUSES.map(s => s.value))
const IMPORTANCE_VALUES = new Set(TIMELINE_IMPORTANCE.map(i => i.value))

/**
 * Coerce one raw event into a full `MissionTimeline`, keeping `completed` and
 * `status` in sync so old (completed-only) and new (status) consumers agree:
 *   - if a valid `status` is present, `completed = status === 'completed'`
 *   - else `status` is derived from `completed`.
 */
export function normalizeTimelineEvent(raw: unknown): MissionTimeline {
  const e = (raw && typeof raw === 'object') ? raw as Record<string, any> : {}
  const str = (v: unknown) => (typeof v === 'string' ? v : '')

  let status: TimelineStatus | undefined = STATUS_VALUES.has(e.status) ? e.status : undefined
  let completed = Boolean(e.completed)
  if (status) completed = status === 'completed'
  else status = completed ? 'completed' : 'upcoming'

  const importance: TimelineImportance | undefined = IMPORTANCE_VALUES.has(e.importance) ? e.importance : undefined

  return {
    id:                  str(e.id) || genEventId(),
    date:                str(e.date).trim(),
    title:               str(e.title).trim(),
    description:         str(e.description).trim(),
    completed,
    status,
    detailedDescription: str(e.detailedDescription).trim(),
    time:                str(e.time).trim(),
    timezone:            str(e.timezone).trim(),
    location:            str(e.location).trim(),
    importance:          importance || 'normal',
    eventType:           str(e.eventType).trim(),
    sourceUrl:           str(e.sourceUrl).trim(),
    image:               str(e.image).trim(),
    videoUrl:            str(e.videoUrl).trim(),
    notes:               str(e.notes).trim(),
  }
}

export function normalizeTimeline(raw: unknown): MissionTimeline[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeTimelineEvent)
}

// ── Dates: parsing, sorting, duplicates ──────────────────────────────

/** Tolerant parse of a free-text event date to a sortable timestamp, or null. */
export function parseEventDate(date: string): number | null {
  const s = (date || '').trim()
  if (!s) return null
  const t = Date.parse(s)
  if (!Number.isNaN(t)) return t
  const year = s.match(/\b(19|20)\d{2}\b/)
  if (year) return Date.parse(`${year[0]}-01-01T00:00:00Z`)
  return null
}

/** Stable sort ascending by parsed date; unparseable/empty dates keep their
 *  relative order at the end. Returns a new array. */
export function sortTimelineByDate(events: MissionTimeline[]): MissionTimeline[] {
  return events
    .map((e, i) => ({ e, i, t: parseEventDate(e.date) }))
    .sort((a, b) => {
      if (a.t == null && b.t == null) return a.i - b.i
      if (a.t == null) return 1
      if (b.t == null) return -1
      return a.t - b.t || a.i - b.i
    })
    .map(x => x.e)
}

/**
 * Indexes of events whose (non-empty) date text matches another event's,
 * case-insensitively. Used for the duplicate-date warning.
 */
export function duplicateDateIndexes(events: MissionTimeline[]): number[] {
  const byKey = new Map<string, number[]>()
  events.forEach((e, i) => {
    const key = e.date.trim().toLowerCase()
    if (!key) return
    const arr = byKey.get(key)
    if (arr) arr.push(i)
    else byKey.set(key, [i])
  })
  const dupes: number[] = []
  Array.from(byKey.values()).forEach(idxs => { if (idxs.length > 1) dupes.push(...idxs) })
  return dupes.sort((a, b) => a - b)
}

/** The distinct duplicated date strings (for a human-readable warning). */
export function duplicateDateValues(events: MissionTimeline[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const i of duplicateDateIndexes(events)) {
    const d = events[i].date.trim()
    const k = d.toLowerCase()
    if (!seen.has(k)) { seen.add(k); out.push(d) }
  }
  return out
}

// ── Validation (co-located) ──────────────────────────────────────────

const TITLE_MAX = 160
const SHORT_MAX = 300
const DETAIL_MAX = 4000
const NOTES_MAX = 2000

function isHttpUrl(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return true
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

/** Validate a timeline. Duplicate dates warn; bad URLs + over-limits block. */
export function validateTimeline(events: MissionTimeline[]): FieldIssue[] {
  const issues: FieldIssue[] = []

  events.forEach((e, i) => {
    const n = i + 1
    if (!e.title.trim() && (e.date.trim() || e.description.trim()))
      issues.push({ field: `timeline.${i}.title`, level: 'warning', message: `Timeline event ${n} has no title.` })
    if (e.title.length > TITLE_MAX)
      issues.push({ field: `timeline.${i}.title`, level: 'error', message: `Timeline event ${n}: title must be ${TITLE_MAX} characters or fewer.` })
    if ((e.description || '').length > SHORT_MAX)
      issues.push({ field: `timeline.${i}.description`, level: 'error', message: `Timeline event ${n}: short description must be ${SHORT_MAX} characters or fewer.` })
    if ((e.detailedDescription || '').length > DETAIL_MAX)
      issues.push({ field: `timeline.${i}.detailedDescription`, level: 'error', message: `Timeline event ${n}: detailed description is too long.` })
    if ((e.notes || '').length > NOTES_MAX)
      issues.push({ field: `timeline.${i}.notes`, level: 'error', message: `Timeline event ${n}: notes are too long.` })
    for (const [key, label] of [['sourceUrl', 'Source URL'], ['image', 'Image URL'], ['videoUrl', 'Video URL']] as const) {
      if (!isHttpUrl(e[key] || ''))
        issues.push({ field: `timeline.${i}.${key}`, level: 'error', message: `Timeline event ${n}: ${label} must be a valid URL (https://…).` })
    }
  })

  const dupes = duplicateDateValues(events)
  if (dupes.length)
    issues.push({ field: 'timeline', level: 'warning', message: `Multiple timeline events share the same date (${dupes.join(', ')}).` })

  return issues
}
