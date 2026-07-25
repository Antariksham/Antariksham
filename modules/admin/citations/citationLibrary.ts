/**
 * Reusable citation library — Phase 2, Feature 7.
 * ─────────────────────────────────────────────────────────────────
 * A browser-local library so an editor can reuse a citation across articles
 * without re-typing it. De-duplicated by citation key. (A shared, server-backed
 * team library is a natural follow-up — see MIGRATION §10.)
 */
import type { Citation } from './citationTypes'
import { citationKey } from './formatCitation'

const STORAGE_KEY = 'cosmosdaily.citation.library.v1'

export function loadLibrary(): Citation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? (arr as Citation[]).filter(c => c && typeof c.type === 'string') : []
  } catch {
    return []
  }
}

function save(list: Citation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 1000))) } catch { /* quota / disabled */ }
}

/** Insert or update by citation key; most-recent first. Returns the new list. */
export function upsertLibrary(c: Citation): Citation[] {
  const list = loadLibrary()
  const key = citationKey(c)
  const idx = list.findIndex(x => citationKey(x) === key)
  if (idx >= 0) list[idx] = c
  else list.unshift(c)
  save(list)
  return list
}

export function removeFromLibrary(id: string): Citation[] {
  const list = loadLibrary().filter(c => c.id !== id)
  save(list)
  return list
}
