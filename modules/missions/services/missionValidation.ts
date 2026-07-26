/**
 * Pure validation for missions (Phase 1). DOM-free, dependency-free — shared by
 * the editor form (live inline feedback), the API route (server enforcement),
 * and the `node:test` unit tests. Business rules live here, never in the UI.
 *
 * Two severities, following the master-prompt rule "warnings should allow
 * saving; critical errors should not":
 *   - `error`   → blocks Save. Only fields that CANNOT exist on a legacy mission
 *                 (a bad URL, an over-limit string) or that every legacy mission
 *                 already satisfies (name / slug / description) — so enforcing
 *                 them is fully backward compatible.
 *   - `warning` → advisory only (e.g. a missing summary/objective). Surfaced in
 *                 the form and returned by the API, but never blocks a save.
 *
 * The formal completeness score + any stricter save-gating policy are the job of
 * Feature 8 (Mission Completeness & Validation); this module is its foundation.
 */
import type { MissionIdentity } from '@/types/mission'

export type IssueLevel = 'error' | 'warning'

export interface FieldIssue {
  /** Field key the issue attaches to (e.g. 'name', 'website'). */
  field:   string
  level:   IssueLevel
  message: string
}

/** Character limits, applied where a bound keeps data tidy. */
export const MISSION_LIMITS = {
  name:      160,
  shortName:  60,
  acronym:    24,
  subtitle:  160,
  summary:   500,
  objective: 600,
  motto:     140,
  alias:     140,
  url:       500,
} as const

const URL_FIELDS: (keyof MissionIdentity)[] = ['website', 'wikipedia', 'pressKit']

const FIELD_LABELS: Record<string, string> = {
  name:      'Mission Name',
  slug:      'Slug',
  description:'Description',
  shortName: 'Short Name',
  acronym:   'Acronym',
  subtitle:  'Subtitle',
  summary:   'Summary',
  objective: 'Objective',
  motto:     'Motto',
  alias:     'Alias',
  website:   'Official Website',
  wikipedia: 'Wikipedia URL',
  pressKit:  'Press Kit URL',
}

/** Text fields (in identity) that carry a character limit. */
const LIMITED_TEXT_FIELDS: (keyof MissionIdentity)[] =
  ['shortName', 'acronym', 'subtitle', 'summary', 'objective', 'motto', 'alias']

/**
 * A URL is valid when it is empty (the field is optional) OR an absolute
 * http(s) URL. Anything else (a bare word, a `javascript:` scheme) is invalid.
 */
export function isValidUrl(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return true
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Make a user-typed value into a usable URL: prefix `https://` when they typed a
 * bare domain ("nasa.gov"), leave an already-schemed value alone, and leave
 * empty as empty. Used by the form on blur so editors don't have to type the
 * scheme. Never turns an unschemed value into a non-http scheme.
 */
export function coerceUrl(value: string): string {
  const v = (value || '').trim()
  if (!v) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return v // already has a scheme
  return `https://${v}`
}

/** Human label for a field key (falls back to the key itself). */
export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] || field
}

/**
 * Validate the always-present core fields. Every legacy mission satisfies the
 * required rules, so enforcing them cannot break editing existing data.
 */
export function validateMissionCore(core: {
  name: string; slug: string; description: string
}): FieldIssue[] {
  const issues: FieldIssue[] = []
  const name = (core.name || '').trim()
  const slug = (core.slug || '').trim()
  const description = (core.description || '').trim()

  if (!name) issues.push({ field: 'name', level: 'error', message: 'Mission Name is required.' })
  else if (name.length > MISSION_LIMITS.name)
    issues.push({ field: 'name', level: 'error', message: `Mission Name must be ${MISSION_LIMITS.name} characters or fewer.` })

  if (!slug) {
    issues.push({ field: 'slug', level: 'error', message: 'Slug is required.' })
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    // Advisory only — legacy slugs must stay editable, so this never blocks.
    issues.push({ field: 'slug', level: 'warning', message: 'Slug should use lowercase letters, numbers and single hyphens.' })
  }

  if (!description) issues.push({ field: 'description', level: 'error', message: 'Description is required.' })

  return issues
}

/** Validate the enhanced identity fields (all optional, but format-checked). */
export function validateIdentity(identity: MissionIdentity): FieldIssue[] {
  const issues: FieldIssue[] = []

  // URL format — only when a value is present (blocking; can't affect legacy).
  for (const field of URL_FIELDS) {
    const val = (identity[field] || '').trim()
    if (val && !isValidUrl(val))
      issues.push({ field, level: 'error', message: `${fieldLabel(field)} must be a valid URL (https://…).` })
    else if (val.length > MISSION_LIMITS.url)
      issues.push({ field, level: 'error', message: `${fieldLabel(field)} is too long.` })
  }

  // Character limits on text fields (blocking; can't affect legacy).
  for (const field of LIMITED_TEXT_FIELDS) {
    const max = (MISSION_LIMITS as Record<string, number>)[field]
    const len = (identity[field] || '').trim().length
    if (max && len > max)
      issues.push({ field, level: 'error', message: `${fieldLabel(field)} must be ${max} characters or fewer.` })
  }

  // Recommended fields — advisory, never blocking (backward compatible).
  if (!identity.summary.trim())
    issues.push({ field: 'summary', level: 'warning', message: 'Mission Summary is recommended — it powers cards and the mission hero.' })
  if (!identity.objective.trim())
    issues.push({ field: 'objective', level: 'warning', message: 'Mission Objective is recommended.' })

  return issues
}

/** Full validation (core + identity). */
export function validateMission(input: {
  name: string; slug: string; description: string; identity: MissionIdentity
}): FieldIssue[] {
  return [...validateMissionCore(input), ...validateIdentity(input.identity)]
}

export function errorsOnly(issues: FieldIssue[]): FieldIssue[] {
  return issues.filter(i => i.level === 'error')
}

export function warningsOnly(issues: FieldIssue[]): FieldIssue[] {
  return issues.filter(i => i.level === 'warning')
}

/** True when any issue would block a save. */
export function hasBlockingErrors(issues: FieldIssue[]): boolean {
  return issues.some(i => i.level === 'error')
}

/** The first issue attached to a field (for inline field messages). */
export function issueForField(issues: FieldIssue[], field: string): FieldIssue | undefined {
  return issues.find(i => i.field === field)
}
