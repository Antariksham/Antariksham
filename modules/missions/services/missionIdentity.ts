/**
 * Pure helpers for the Enhanced Mission Identity model (Phase 1, Feature 1).
 *
 * These functions are DOM-free and dependency-free so they can run on the
 * server (services, API route), in the browser (the editor form), and under the
 * zero-dependency `node:test` runner. They own the single source of truth for
 * how the `identity` section of `missions.details` is shaped, defaulted, read
 * and persisted — keeping the data model logic out of UI and I/O code.
 */
import type { MissionIdentity, MissionDetails } from '@/types/mission'

/** Every identity field, in display order. */
export const IDENTITY_FIELDS: (keyof MissionIdentity)[] = [
  'shortName', 'acronym', 'subtitle', 'summary', 'objective',
  'motto', 'website', 'wikipedia', 'pressKit', 'alias',
]

/** A fully-formed, empty identity (all fields `''`). */
export function emptyIdentity(): MissionIdentity {
  return {
    shortName: '', acronym: '', subtitle: '', summary: '', objective: '',
    motto: '', website: '', wikipedia: '', pressKit: '', alias: '',
  }
}

/**
 * Coerce an untrusted raw value (e.g. `details.identity` straight from JSONB,
 * or `undefined` for a legacy mission) into a complete `MissionIdentity`.
 * Non-string / missing fields become `''`, so callers never have to null-check.
 */
export function normalizeIdentity(raw: unknown): MissionIdentity {
  const base = emptyIdentity()
  if (!raw || typeof raw !== 'object') return base
  const obj = raw as Record<string, unknown>
  for (const key of IDENTITY_FIELDS) {
    const v = obj[key]
    if (typeof v === 'string') base[key] = v
  }
  return base
}

/** Read the identity section out of a `details` JSONB blob (tolerant). */
export function identityFromDetails(details: unknown): MissionIdentity {
  if (!details || typeof details !== 'object') return emptyIdentity()
  return normalizeIdentity((details as Record<string, unknown>).identity)
}

/** A copy with every field trimmed. */
export function trimIdentity(identity: MissionIdentity): MissionIdentity {
  const out = emptyIdentity()
  for (const key of IDENTITY_FIELDS) out[key] = (identity[key] || '').trim()
  return out
}

/** True when every identity field is blank after trimming. */
export function isIdentityEmpty(identity: MissionIdentity): boolean {
  return IDENTITY_FIELDS.every(key => !(identity[key] || '').trim())
}

/**
 * Build the `details` blob to persist for a mission. Returns `null` when there
 * is nothing to store, so we never write an empty object over a legacy NULL row
 * (keeps writes idempotent and the column clean).
 *
 * Future Phase-1 features extend this signature with their own sections
 * (classification, specifications, …); each one merges into the same blob.
 */
export function buildMissionDetails(
  identity: MissionIdentity,
  existing?: MissionDetails | null,
): MissionDetails | null {
  const next: MissionDetails = { ...(existing || {}) }
  const trimmed = trimIdentity(identity)
  if (isIdentityEmpty(trimmed)) delete next.identity
  else next.identity = trimmed
  return Object.keys(next).length ? next : null
}
