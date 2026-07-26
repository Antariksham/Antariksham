/**
 * Pure helpers for Scientific Objectives (Phase 1, Feature 4).
 *
 * DOM-free + dependency-free, shared by the editor, API, services and
 * `node:test`. Validation is co-located (only the `FieldIssue` TYPE is imported
 * from missionValidation, which the TS-stripping test runner erases) so the
 * pure modules never import each other at runtime.
 */
import type { MissionObjectives } from '@/types/mission'
import type { FieldIssue } from './missionValidation'

/** Keys of the ordered-list fields (excludes `significance`). */
export type ObjectiveListKey = Exclude<keyof MissionObjectives, 'significance'>

/** The ordered-list fields (each reorderable in the editor). */
export const OBJECTIVE_LIST_FIELDS: ObjectiveListKey[] =
  ['secondary', 'technologyDemos', 'scientificQuestions', 'expectedDiscoveries']

export function emptyObjectives(): MissionObjectives {
  return { secondary: [], technologyDemos: [], scientificQuestions: [], expectedDiscoveries: [], significance: '' }
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  // Keep order + duplicates removed, but preserve blanks-free entries.
  const out: string[] = []
  for (const x of v) {
    if (typeof x === 'string') {
      const t = x.trim()
      if (t) out.push(t)
    }
  }
  return out
}

/** Coerce an untrusted raw value into a complete `MissionObjectives`. */
export function normalizeObjectives(raw: unknown): MissionObjectives {
  const base = emptyObjectives()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const field of OBJECTIVE_LIST_FIELDS) base[field] = strArray(obj[field])
  if (typeof obj.significance === 'string') base.significance = obj.significance.trim()
  return base
}

/** Read the objectives section out of a `details` blob (tolerant). */
export function objectivesFromDetails(details: unknown): MissionObjectives {
  if (!details || typeof details !== 'object') return emptyObjectives()
  return normalizeObjectives((details as Record<string, unknown>).objectives)
}

/** True when every objective list is empty and significance is blank. */
export function isObjectivesEmpty(o: MissionObjectives): boolean {
  return OBJECTIVE_LIST_FIELDS.every(f => o[f].length === 0) && !o.significance.trim()
}

// ── Validation ───────────────────────────────────────────────────────

const ITEM_MAX = 280
const SIGNIFICANCE_MAX = 1200

const LIST_LABELS: Record<string, string> = {
  secondary: 'Secondary Objective', technologyDemos: 'Technology Demonstration',
  scientificQuestions: 'Scientific Question', expectedDiscoveries: 'Expected Discovery',
}

/** Validate objectives — length limits only (all blocking; legacy rows have none). */
export function validateObjectives(o: MissionObjectives): FieldIssue[] {
  const issues: FieldIssue[] = []
  for (const field of OBJECTIVE_LIST_FIELDS) {
    if (o[field].some(item => item.length > ITEM_MAX))
      issues.push({ field, level: 'error', message: `Each ${LIST_LABELS[field]} must be ${ITEM_MAX} characters or fewer.` })
  }
  if (o.significance.trim().length > SIGNIFICANCE_MAX)
    issues.push({ field: 'significance', level: 'error', message: `Mission Significance must be ${SIGNIFICANCE_MAX} characters or fewer.` })
  return issues
}
