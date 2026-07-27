/**
 * Pure helpers for Improved Launch Information (Phase 1, Feature 6).
 *
 * DOM-free + dependency-free, shared by the editor, API, services and
 * `node:test`. Owns the launch shape, normalisation, the countdown target and
 * (co-located) validation. `datetime-local` values are compared as strings —
 * their zero-padded ISO form sorts chronologically — so the logical
 * date-ordering checks need no fragile Date maths.
 */
import type { MissionLaunch, LaunchSuccess } from '@/types/mission'
import type { FieldIssue } from './missionValidation'

export const LAUNCH_SUCCESS_OPTIONS: { value: LaunchSuccess; label: string; color: string }[] = [
  { value: 'unknown', label: 'Not launched / Unknown', color: 'rgba(var(--ink),0.5)' },
  { value: 'success', label: 'Success',                 color: 'var(--green)' },
  { value: 'partial', label: 'Partial',                 color: 'var(--gold)' },
  { value: 'failure', label: 'Failure',                 color: 'var(--red)' },
]

export function launchSuccessMeta(v: string): { label: string; color: string } {
  return LAUNCH_SUCCESS_OPTIONS.find(o => o.value === v) || LAUNCH_SUCCESS_OPTIONS[0]
}

/** Keys of the scalar (string) launch fields (excludes success + countdown). */
export type LaunchTextKey = Exclude<keyof MissionLaunch, 'success' | 'countdown'>

/** Scalar (string) launch fields. */
export const LAUNCH_TEXT_FIELDS: LaunchTextKey[] = [
  'time', 'windowStart', 'windowEnd', 'site', 'pad', 'provider', 'rocket',
  'country', 'missionNumber', 'livestreamUrl',
]

const SUCCESS_VALUES = new Set<LaunchSuccess>(['unknown', 'success', 'partial', 'failure'])

export function emptyLaunch(): MissionLaunch {
  return {
    time: '', windowStart: '', windowEnd: '', site: '', pad: '', provider: '',
    rocket: '', country: '', missionNumber: '', success: 'unknown',
    livestreamUrl: '', countdown: false,
  }
}

/** Coerce an untrusted raw value into a complete `MissionLaunch`. */
export function normalizeLaunch(raw: unknown): MissionLaunch {
  const base = emptyLaunch()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const field of LAUNCH_TEXT_FIELDS) {
    const v = obj[field]
    if (typeof v === 'string') base[field] = v.trim()
  }
  if (SUCCESS_VALUES.has(obj.success as LaunchSuccess)) base.success = obj.success as LaunchSuccess
  base.countdown = Boolean(obj.countdown)
  return base
}

/** Read the launch section out of a `details` blob (tolerant). */
export function launchFromDetails(details: unknown): MissionLaunch {
  if (!details || typeof details !== 'object') return emptyLaunch()
  return normalizeLaunch((details as Record<string, unknown>).launch)
}

/** True when every launch field is at its default (nothing to store). */
export function isLaunchEmpty(l: MissionLaunch): boolean {
  return LAUNCH_TEXT_FIELDS.every(f => !l[f]) && l.success === 'unknown' && !l.countdown
}

/**
 * Best-effort target timestamp for the countdown: the launch window start if
 * set, else the base launch date combined with the launch time. Returns null
 * when nothing usable is available.
 */
export function launchTargetTimestamp(launchDate: string, launch: MissionLaunch): number | null {
  if (launch.windowStart) {
    const t = Date.parse(launch.windowStart)
    if (!Number.isNaN(t)) return t
  }
  const d = (launchDate || '').trim()
  if (!d) return null
  const time = launch.time.trim()
  const hm = time.match(/^(\d{1,2}):(\d{2})/)
  const iso = hm ? `${d}T${hm[1].padStart(2, '0')}:${hm[2]}:00` : `${d}T00:00:00`
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

// ── Validation ───────────────────────────────────────────────────────

function isHttpUrl(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return true
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}

/** Validate launch info + logical date ordering (needs the base launch date). */
export function validateLaunch(launch: MissionLaunch, launchDate: string): FieldIssue[] {
  const issues: FieldIssue[] = []

  if (!isHttpUrl(launch.livestreamUrl))
    issues.push({ field: 'livestreamUrl', level: 'error', message: 'Launch Livestream URL must be a valid URL (https://…).' })

  const { windowStart, windowEnd } = launch
  if (windowStart && windowEnd && windowStart > windowEnd)
    issues.push({ field: 'windowEnd', level: 'error', message: 'Launch window end must be on or after the window start.' })

  // datetime-local starts "YYYY-MM-DD" — compare that day part against the base
  // launch date (both zero-padded ISO days sort chronologically).
  const day = (launchDate || '').trim()
  if (day && windowStart && day < windowStart.slice(0, 10))
    issues.push({ field: 'windowStart', level: 'warning', message: 'Launch date is before the launch window opens.' })
  if (day && windowEnd && day > windowEnd.slice(0, 10))
    issues.push({ field: 'windowEnd', level: 'warning', message: 'Launch date is after the launch window closes.' })

  return issues
}
