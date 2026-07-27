/**
 * Mission Completeness & Validation (Phase 1, Feature 8).
 *
 * Pure, DOM-free, dependency-free — evaluates a mission against the checklist of
 * required + recommended fields and produces a live 0–100 completeness score.
 * Checks read snapshot fields directly (no runtime imports of the other pure
 * modules), so the TS-stripping test runner loads it cleanly.
 *
 * Relationship to the save gate: completeness is INFORMATIONAL. Actual save
 * blocking stays with the per-feature `validate*` functions (invalid data —
 * bad URLs, over-limits, illogical dates, missing name/slug/description). Missing
 * REQUIRED-for-completeness fields show as ✕ here and lower the score, but do
 * not block saving — preserving backward compatibility with legacy missions
 * ("warnings allow saving; critical errors do not").
 */
import type {
  MissionIdentity, MissionClassification, MissionSpecifications,
  MissionObjectives, MissionLaunch, MissionMedia, MissionTimeline,
} from '@/types/mission'

/** Everything needed to evaluate a mission's completeness (mirrors form state). */
export interface MissionSnapshot {
  name:           string
  slug:           string
  description:    string
  launchDate:     string
  agencyId:       string
  identity:       MissionIdentity
  classification: MissionClassification
  specifications: MissionSpecifications
  objectives:     MissionObjectives
  launch:         MissionLaunch
  media:          MissionMedia
  timeline:       MissionTimeline[]
}

export type CheckLevel = 'required' | 'recommended'
export type CheckStatus = 'done' | 'warning' | 'missing' // done=✓, warning=recommended-missing (⚠), missing=required-missing (✕)

export interface ChecklistItem {
  key:    string
  label:  string
  group:  string
  level:  CheckLevel
  done:   boolean
  status: CheckStatus
}

export interface CompletenessResult {
  items:            ChecklistItem[]
  score:            number   // 0–100
  requiredTotal:    number
  requiredDone:     number
  recommendedTotal: number
  recommendedDone:  number
}

interface CheckDef {
  key:   string
  label: string
  group: string
  level: CheckLevel
  check: (s: MissionSnapshot) => boolean
}

const t = (v: string | undefined) => !!(v || '').trim()

// Some specification field beyond the launch vehicle is filled in.
function hasSpecDetail(spec: MissionSpecifications): boolean {
  return t(spec.spacecraftName) || t(spec.manufacturer) || t(spec.program) ||
    t(spec.missionFamily) || t(spec.orbitType) || t(spec.powerSource) ||
    t(spec.launchMass) || spec.instruments.length > 0 || t(spec.primaryPayload)
}

function hasScientificObjectives(o: MissionObjectives): boolean {
  return o.secondary.length > 0 || o.technologyDemos.length > 0 ||
    o.scientificQuestions.length > 0 || o.expectedDiscoveries.length > 0 || t(o.significance)
}

function hasLaunchDetail(l: MissionLaunch): boolean {
  return t(l.site) || t(l.pad) || t(l.provider) || t(l.rocket) ||
    t(l.country) || t(l.missionNumber) || t(l.windowStart) || t(l.time)
}

/** The checklist definitions, in display order (required first within groups). */
export const CHECKLIST: CheckDef[] = [
  // Required
  { key: 'name',          label: 'Mission Name',        group: 'Identity',       level: 'required',    check: s => t(s.name) },
  { key: 'slug',          label: 'Slug',                group: 'Identity',       level: 'required',    check: s => t(s.slug) },
  { key: 'summary',       label: 'Mission Summary',     group: 'Identity',       level: 'required',    check: s => t(s.identity.summary) },
  { key: 'description',   label: 'Description',         group: 'Identity',       level: 'required',    check: s => t(s.description) },
  { key: 'objective',     label: 'Mission Objective',   group: 'Identity',       level: 'required',    check: s => t(s.identity.objective) },
  { key: 'status',        label: 'Status',              group: 'Classification', level: 'required',    check: s => t(s.classification.status) },
  { key: 'type',          label: 'Mission Type',        group: 'Classification', level: 'required',    check: s => s.classification.types.length > 0 },
  { key: 'destination',   label: 'Destination',         group: 'Classification', level: 'required',    check: s => s.classification.destinations.length > 0 },
  { key: 'agency',        label: 'Primary Agency',      group: 'Classification', level: 'required',    check: s => t(s.agencyId) },
  { key: 'launchVehicle', label: 'Launch Vehicle',      group: 'Specifications', level: 'required',    check: s => t(s.specifications.launchVehicle) || t(s.launch.rocket) },
  { key: 'launchDate',    label: 'Launch Date',         group: 'Launch',         level: 'required',    check: s => t(s.launchDate) },
  { key: 'heroImage',     label: 'Hero Image',          group: 'Media',          level: 'required',    check: s => t(s.media.hero.url) },
  { key: 'timeline',      label: 'Timeline',            group: 'Timeline',       level: 'required',    check: s => s.timeline.length > 0 },
  // Recommended
  { key: 'acronym',       label: 'Acronym',             group: 'Identity',       level: 'recommended', check: s => t(s.identity.acronym) },
  { key: 'subtitle',      label: 'Subtitle',            group: 'Identity',       level: 'recommended', check: s => t(s.identity.subtitle) },
  { key: 'website',       label: 'Official Website',    group: 'Identity',       level: 'recommended', check: s => t(s.identity.website) },
  { key: 'collaborators', label: 'Partner Agencies',    group: 'Classification', level: 'recommended', check: s => s.classification.agencies.partners.length > 0 || s.classification.agencies.commercial.length > 0 || s.classification.agencies.institutions.length > 0 },
  { key: 'specifications',label: 'Specifications',      group: 'Specifications', level: 'recommended', check: s => hasSpecDetail(s.specifications) },
  { key: 'objectivesRich',label: 'Scientific Objectives', group: 'Objectives',   level: 'recommended', check: s => hasScientificObjectives(s.objectives) },
  { key: 'launchInfo',    label: 'Launch Information',   group: 'Launch',        level: 'recommended', check: s => hasLaunchDetail(s.launch) },
  { key: 'patch',         label: 'Mission Patch',        group: 'Media',         level: 'recommended', check: s => t(s.media.patch.url) },
  { key: 'gallery',       label: 'Gallery',              group: 'Media',         level: 'recommended', check: s => s.media.gallery.length > 0 },
]

/** Evaluate a mission against the checklist and compute a weighted score. */
export function evaluateCompleteness(s: MissionSnapshot): CompletenessResult {
  const items: ChecklistItem[] = CHECKLIST.map(def => {
    const done = def.check(s)
    const status: CheckStatus = done ? 'done' : def.level === 'required' ? 'missing' : 'warning'
    return { key: def.key, label: def.label, group: def.group, level: def.level, done, status }
  })

  const required = items.filter(i => i.level === 'required')
  const recommended = items.filter(i => i.level === 'recommended')
  const requiredDone = required.filter(i => i.done).length
  const recommendedDone = recommended.filter(i => i.done).length

  // Required fields weigh double, so completing them moves the needle more.
  const weighted = 2 * requiredDone + recommendedDone
  const weightedTotal = 2 * required.length + recommended.length
  const score = weightedTotal === 0 ? 0 : Math.round((weighted / weightedTotal) * 100)

  return {
    items, score,
    requiredTotal: required.length, requiredDone,
    recommendedTotal: recommended.length, recommendedDone,
  }
}

/** Colour band for a score (theme-safe token). */
export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--green)'
  if (score >= 50) return 'var(--gold)'
  return 'var(--red)'
}
