/**
 * Pure helpers for Professional Mission Specifications (Phase 1, Feature 3).
 *
 * DOM-free + dependency-free, shared by the editor, API, services and
 * `node:test`. Owns the shape, defaults, normalisation and the small numeric
 * parsing used by validation (e.g. comparing dry mass to launch mass).
 */
import type { MissionSpecifications } from '@/types/mission'
import type { FieldIssue } from './missionValidation'

/** Keys of the scalar (string) specification fields (excludes `instruments`). */
export type SpecTextKey = Exclude<keyof MissionSpecifications, 'instruments'>

/** Scalar (string) specification fields, in display order. */
export const SPEC_TEXT_FIELDS: SpecTextKey[] = [
  'spacecraftName', 'manufacturer', 'missionFamily', 'program',
  'launchVehicle', 'orbitType',
  'launchMass', 'dryMass', 'payloadMass',
  'missionDuration', 'expectedLifetime', 'powerSource', 'powerOutput',
  'communicationSystem', 'primaryPayload', 'secondaryPayload', 'budget',
]

export function emptySpecifications(): MissionSpecifications {
  return {
    launchVehicle: '', spacecraftName: '', manufacturer: '',
    launchMass: '', dryMass: '', payloadMass: '',
    missionDuration: '', expectedLifetime: '', powerSource: '', powerOutput: '',
    communicationSystem: '', primaryPayload: '', secondaryPayload: '',
    budget: '', orbitType: '', instruments: [],
    missionFamily: '', program: '',
  }
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x === 'string') {
      const t = x.trim()
      if (t && !out.includes(t)) out.push(t)
    }
  }
  return out
}

/** Coerce an untrusted raw value into a complete `MissionSpecifications`. */
export function normalizeSpecifications(raw: unknown): MissionSpecifications {
  const base = emptySpecifications()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const key of SPEC_TEXT_FIELDS) {
    const v = obj[key]
    if (typeof v === 'string') base[key] = v.trim()
  }
  base.instruments = strArray(obj.instruments)
  return base
}

/** Read the specifications section out of a `details` blob (tolerant). */
export function specificationsFromDetails(details: unknown): MissionSpecifications {
  if (!details || typeof details !== 'object') return emptySpecifications()
  return normalizeSpecifications((details as Record<string, unknown>).specifications)
}

/** True when every specification field is blank. */
export function isSpecificationsEmpty(s: MissionSpecifications): boolean {
  return SPEC_TEXT_FIELDS.every(k => !s[k]) && s.instruments.length === 0
}

/**
 * Parse the leading numeric magnitude from a measurement string, ignoring
 * thousands separators and a trailing unit. "2,600 kg" → 2600, "5.5 t" → 5.5,
 * "heavy" → null. Used to sanity-check mass relationships.
 */
export function parseLeadingNumber(value: string): number | null {
  const m = (value || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = parseFloat(m[0])
  return Number.isFinite(n) ? n : null
}

/** Does this measurement string contain a number? (empty is allowed) */
export function looksLikeMeasurement(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return true
  return parseLeadingNumber(v) !== null
}

// ── Validation ───────────────────────────────────────────────────────
//
// Co-located here (not in missionValidation.ts) so the pure test-loaded
// modules never import each other at runtime — only the `FieldIssue` TYPE is
// imported, which the TS-stripping test runner erases. The editor + API compose
// this with `validateMission` to gate a save.

const SPEC_LABELS: Record<string, string> = {
  launchVehicle: 'Launch Vehicle', spacecraftName: 'Spacecraft Name',
  manufacturer: 'Spacecraft Manufacturer', launchMass: 'Launch Mass',
  dryMass: 'Dry Mass', payloadMass: 'Payload Mass', missionDuration: 'Mission Duration',
  expectedLifetime: 'Expected Mission Lifetime', powerSource: 'Power Source',
  powerOutput: 'Power Output', communicationSystem: 'Communication System',
  primaryPayload: 'Primary Payload', secondaryPayload: 'Secondary Payload',
  budget: 'Mission Budget', orbitType: 'Orbit Type', missionFamily: 'Mission Family',
  program: 'Program',
}

const MEASUREMENT_FIELDS: SpecTextKey[] = ['launchMass', 'dryMass', 'payloadMass', 'powerOutput']

function specLimit(field: SpecTextKey): number {
  if (field === 'budget') return 120
  if (MEASUREMENT_FIELDS.includes(field)) return 60
  return 200
}

/** Validate the specifications. Errors block save (can't affect legacy rows);
 *  mass-relationship checks are advisory warnings. */
export function validateSpecifications(s: MissionSpecifications): FieldIssue[] {
  const issues: FieldIssue[] = []

  // Measurement fields should read like a measurement when provided.
  for (const field of MEASUREMENT_FIELDS) {
    const v = s[field]
    if (v && !looksLikeMeasurement(v))
      issues.push({ field, level: 'error', message: `${SPEC_LABELS[field]} should include a number (e.g. "2,600 kg").` })
  }

  // Logical mass relationships (advisory).
  const launch = parseLeadingNumber(s.launchMass)
  const dry = parseLeadingNumber(s.dryMass)
  const payload = parseLeadingNumber(s.payloadMass)
  if (launch != null && dry != null && dry > launch)
    issues.push({ field: 'dryMass', level: 'warning', message: 'Dry mass is greater than launch mass — double-check the figures.' })
  if (launch != null && payload != null && payload > launch)
    issues.push({ field: 'payloadMass', level: 'warning', message: 'Payload mass is greater than launch mass — double-check the figures.' })

  // Character limits (blocking; legacy rows have none).
  for (const field of SPEC_TEXT_FIELDS) {
    const v = s[field]
    if (v && v.length > specLimit(field))
      issues.push({ field, level: 'error', message: `${SPEC_LABELS[field]} must be ${specLimit(field)} characters or fewer.` })
  }
  if (s.instruments.some(i => i.length > 120))
    issues.push({ field: 'instruments', level: 'error', message: 'Instrument names must be 120 characters or fewer.' })

  return issues
}
