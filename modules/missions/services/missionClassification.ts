/**
 * Rich Mission Classification taxonomy + mapping (Phase 1, Feature 2).
 *
 * Pure, DOM-free, dependency-free — shared by the editor, the API route, the
 * services and the `node:test` unit tests. This is the single source of truth
 * for the extended status / type / destination / agency-role vocabularies AND
 * for the mapping between the rich `details.classification` model and the
 * backward-compatible base columns (`status`, `mission_type`, `destination`).
 *
 * Design invariant: the base columns only ever receive a LEGACY value, so the
 * feature is safe whether those columns are Postgres enums or plain text.
 */
import type {
  MissionStatus, MissionType, MissionClassification,
} from '@/types/mission'

// ── Extended lifecycle status (single-select, 15 stages) ─────────────

export type StatusGroup = 'Pre-Launch' | 'In Flight' | 'Concluded'

export interface StatusOption {
  value:  string
  label:  string
  /** Hindi label — see lib/ui.ts for why chrome strings live beside their data here. */
  hi:     string
  color:  string          // theme-safe CSS token value
  group:  StatusGroup
  legacy: MissionStatus   // projection written to the base `status` column
}

export const MISSION_STATUSES: StatusOption[] = [
  { value: 'concept',            label: 'Concept', hi: 'संकल्पना',            group: 'Pre-Launch', color: 'rgba(var(--ink),0.5)', legacy: 'in-development' },
  { value: 'planning',           label: 'Planning', hi: 'नियोजन',           group: 'Pre-Launch', color: 'var(--gold)',          legacy: 'in-development' },
  { value: 'testing',            label: 'Testing', hi: 'परीक्षण',            group: 'Pre-Launch', color: 'var(--gold)',          legacy: 'in-development' },
  { value: 'awaiting-launch',    label: 'Awaiting Launch', hi: 'लॉन्च की प्रतीक्षा',    group: 'Pre-Launch', color: 'var(--accent)',        legacy: 'upcoming' },
  { value: 'launch-window-open', label: 'Launch Window Open', hi: 'लॉन्च विंडो खुली', group: 'Pre-Launch', color: 'var(--accent)',        legacy: 'upcoming' },
  { value: 'upcoming',           label: 'Upcoming', hi: 'आगामी',           group: 'Pre-Launch', color: 'var(--accent)',        legacy: 'upcoming' },
  { value: 'active',             label: 'Active', hi: 'सक्रिय',             group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'cruise',             label: 'Cruise', hi: 'परिभ्रमण',             group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'orbiting',           label: 'Orbiting', hi: 'परिक्रमारत',           group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'landing',            label: 'Landing', hi: 'अवतरण',            group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'surface-operations', label: 'Surface Operations', hi: 'सतह संचालन', group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'extended-mission',   label: 'Extended Mission', hi: 'विस्तारित मिशन',   group: 'In Flight',  color: 'var(--green)',         legacy: 'active' },
  { value: 'completed',          label: 'Completed', hi: 'पूर्ण',          group: 'Concluded',  color: 'rgba(var(--ink),0.5)', legacy: 'completed' },
  { value: 'failed',             label: 'Failed', hi: 'विफल',             group: 'Concluded',  color: 'var(--red)',           legacy: 'failed' },
  { value: 'cancelled',          label: 'Cancelled', hi: 'रद्द',          group: 'Concluded',  color: 'var(--red)',           legacy: 'cancelled' },
]

export const STATUS_GROUPS: StatusGroup[] = ['Pre-Launch', 'In Flight', 'Concluded']

// Legacy-only display meta, for rows whose stored base status predates the 15
// (e.g. 'in-development', which has no 1:1 extended value).
const LEGACY_STATUS_META: Record<MissionStatus, { label: string; hi: string; color: string }> = {
  active:           { label: 'Active', hi: 'सक्रिय',         color: 'var(--green)' },
  upcoming:         { label: 'Upcoming', hi: 'आगामी',       color: 'var(--accent)' },
  'in-development': { label: 'In Development', hi: 'विकासाधीन',  color: 'var(--gold)' },
  completed:        { label: 'Completed', hi: 'पूर्ण',      color: 'rgba(var(--ink),0.5)' },
  failed:           { label: 'Failed', hi: 'विफल',         color: 'var(--red)' },
  cancelled:        { label: 'Cancelled', hi: 'रद्द',      color: 'var(--red)' },
}

/** Display meta (label + color) for ANY status value, extended or legacy. */
export function statusMeta(value: string, lang?: string): { label: string; color: string } {
  const ext = MISSION_STATUSES.find(s => s.value === value)
  if (ext) return { label: lang === 'hi' ? ext.hi : ext.label, color: ext.color }
  const legacy = LEGACY_STATUS_META[value as MissionStatus]
  if (legacy) return { label: lang === 'hi' ? legacy.hi : legacy.label, color: legacy.color }
  return { label: humanize(value), color: 'rgba(var(--ink),0.5)' }
}

/** Legacy projection for the base `status` column from an extended status. */
export function legacyStatusFor(value: string): MissionStatus {
  const ext = MISSION_STATUSES.find(s => s.value === value)
  if (ext) return ext.legacy
  if (value in LEGACY_STATUS_META) return value as MissionStatus
  return 'upcoming'
}

/** Extended status to preselect when opening a legacy mission (base → extended). */
export function extendedStatusFromLegacy(status: MissionStatus): string {
  const map: Record<MissionStatus, string> = {
    active: 'active', upcoming: 'upcoming', completed: 'completed',
    failed: 'failed', cancelled: 'cancelled', 'in-development': 'planning',
  }
  return map[status] || 'upcoming'
}

// ── Mission type (multi-select, ~22 tags) ────────────────────────────

export interface TypeOption { value: string; label: string; hi: string; legacy: MissionType }

export const MISSION_TYPE_TAGS: TypeOption[] = [
  { value: 'human-spaceflight',       label: 'Human Spaceflight', hi: 'मानव अंतरिक्ष उड़ान',       legacy: 'crewed' },
  { value: 'robotic',                 label: 'Robotic', hi: 'रोबोटिक',                 legacy: 'robotic' },
  { value: 'orbiter',                 label: 'Orbiter', hi: 'ऑर्बिटर',                 legacy: 'orbiter' },
  { value: 'flyby',                   label: 'Flyby', hi: 'फ्लाईबाई',                   legacy: 'flyby' },
  { value: 'lander',                  label: 'Lander', hi: 'लैंडर',                  legacy: 'lander' },
  { value: 'rover',                   label: 'Rover', hi: 'रोवर',                   legacy: 'rover' },
  { value: 'helicopter',              label: 'Helicopter', hi: 'हेलिकॉप्टर',              legacy: 'robotic' },
  { value: 'space-telescope',         label: 'Space Telescope', hi: 'अंतरिक्ष दूरबीन',         legacy: 'telescope' },
  { value: 'space-station',           label: 'Space Station', hi: 'अंतरिक्ष स्टेशन',           legacy: 'crewed' },
  { value: 'sample-return',           label: 'Sample Return', hi: 'नमूना वापसी',           legacy: 'sample-return' },
  { value: 'cubesat',                 label: 'CubeSat', hi: 'CubeSat',                 legacy: 'robotic' },
  { value: 'cargo',                   label: 'Cargo', hi: 'कार्गो',                   legacy: 'robotic' },
  { value: 'crewed',                  label: 'Crewed', hi: 'चालक दल सहित',                  legacy: 'crewed' },
  { value: 'technology-demonstration',label: 'Technology Demonstration', hi: 'प्रौद्योगिकी प्रदर्शन',legacy: 'robotic' },
  { value: 'planetary-science',       label: 'Planetary Science', hi: 'ग्रहीय विज्ञान',       legacy: 'robotic' },
  { value: 'earth-observation',       label: 'Earth Observation', hi: 'पृथ्वी अवलोकन',       legacy: 'robotic' },
  { value: 'communications',          label: 'Communications', hi: 'संचार',          legacy: 'robotic' },
  { value: 'navigation',              label: 'Navigation', hi: 'नेविगेशन',              legacy: 'robotic' },
  { value: 'astronomy',               label: 'Astronomy', hi: 'खगोल विज्ञान',               legacy: 'telescope' },
  { value: 'deep-space',              label: 'Deep Space', hi: 'गहन अंतरिक्ष',              legacy: 'robotic' },
  { value: 'experimental',            label: 'Experimental', hi: 'प्रायोगिक',            legacy: 'robotic' },
]

export function typeLabel(value: string, lang?: string): string {
  const tag = MISSION_TYPE_TAGS.find(t => t.value === value)
  if (!tag) return humanize(value)
  return lang === 'hi' ? tag.hi : tag.label
}

/** Legacy projection for the base `mission_type` column from an extended type. */
export function legacyTypeFor(value: string): MissionType {
  return MISSION_TYPE_TAGS.find(t => t.value === value)?.legacy || 'robotic'
}

/** Extended type tag to seed the editor from a legacy `mission_type`. */
export function extendedTypeFromLegacy(t: MissionType): string {
  const map: Record<MissionType, string> = {
    crewed: 'crewed', robotic: 'robotic', flyby: 'flyby', orbiter: 'orbiter',
    lander: 'lander', rover: 'rover', 'sample-return': 'sample-return', telescope: 'space-telescope',
  }
  return map[t] || 'robotic'
}

// ── Destinations (multi-select, searchable, free-form allowed) ───────

export const DESTINATION_SUGGESTIONS: string[] = [
  'Moon', 'Mars', 'Venus', 'Mercury', 'Europa', 'Titan', 'Enceladus',
  'Jupiter', 'Saturn', 'Sun', 'ISS', 'Low Earth Orbit', 'Medium Earth Orbit',
  'Geostationary Orbit', 'Lagrange Point', 'Asteroid', 'Comet', 'Deep Space',
]

// ── Classification value helpers ─────────────────────────────────────

export function emptyClassification(): MissionClassification {
  return { status: 'upcoming', types: [], destinations: [], agencies: { partners: [], commercial: [], institutions: [] } }
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x === 'string') {
      const t = x.trim()
      if (t && !out.includes(t)) out.push(t)  // trim + de-dupe, preserve order
    }
  }
  return out
}

/**
 * The EFFECTIVE classification for a mission: prefer `details.classification`,
 * falling back to the base columns for legacy missions (so a pre-Feature-2
 * mission still classifies correctly with no stored classification).
 */
export function effectiveClassification(
  raw: unknown,
  base: { status: MissionStatus; missionType: MissionType; destination: string },
): MissionClassification {
  const r = (raw && typeof raw === 'object') ? raw as Record<string, any> : null
  const agencies = (r?.agencies && typeof r.agencies === 'object') ? r.agencies as Record<string, unknown> : {}

  const types = r ? strArray(r.types) : []
  const destinations = r ? strArray(r.destinations) : []

  return {
    status: (r && typeof r.status === 'string' && r.status)
      ? r.status
      : extendedStatusFromLegacy(base.status),
    types: types.length ? types : [extendedTypeFromLegacy(base.missionType)],
    destinations: destinations.length ? destinations : (base.destination ? [base.destination] : []),
    agencies: {
      partners:     strArray(agencies.partners),
      commercial:   strArray(agencies.commercial),
      institutions: strArray(agencies.institutions),
    },
  }
}

/** Normalise a classification coming from the editor for storage (trim/dedupe). */
export function normalizeClassification(c: MissionClassification): MissionClassification {
  return {
    status: (c.status || 'upcoming').trim() || 'upcoming',
    types: strArray(c.types),
    destinations: strArray(c.destinations),
    agencies: {
      partners:     strArray(c.agencies?.partners),
      commercial:   strArray(c.agencies?.commercial),
      institutions: strArray(c.agencies?.institutions),
    },
  }
}

/** Derive the backward-compatible base-column values from a classification. */
export function classificationToBaseColumns(c: MissionClassification): {
  status: MissionStatus; missionType: MissionType; destination: string
} {
  const n = normalizeClassification(c)
  return {
    status:      legacyStatusFor(n.status),
    missionType: legacyTypeFor(n.types[0] || ''),
    destination: n.destinations[0] || '',
  }
}

/** Every agency id referenced by the classification's role arrays (de-duped). */
export function classificationAgencyIds(c: MissionClassification): string[] {
  const n = normalizeClassification(c)
  return Array.from(new Set([...n.agencies.partners, ...n.agencies.commercial, ...n.agencies.institutions]))
}

// ── util ─────────────────────────────────────────────────────────────

/** Turn a slug/token into a human label ("deep-space" → "Deep Space"). */
export function humanize(value: string): string {
  return (value || '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}
