/**
 * Saved search presets (Phase 2, Feature 8).
 * Browser-local named filter presets so editors can re-run a common query
 * (e.g. "Drafts over 1k views", "NASA, this month") in one click.
 */
import type { SearchFilters } from './articleSearch'

const STORAGE_KEY = 'cosmosdaily.article.filters.v1'

export interface SavedFilter { id: string; name: string; filters: SearchFilters }

export function loadSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? (arr as SavedFilter[]).filter(f => f && f.name && f.filters) : []
  } catch {
    return []
  }
}

function persist(list: SavedFilter[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100))) } catch { /* ignore */ }
}

export function saveFilter(name: string, filters: SearchFilters): SavedFilter[] {
  const list = loadSavedFilters()
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const idx = list.findIndex(f => f.name.toLowerCase() === name.trim().toLowerCase())
  const entry: SavedFilter = { id: idx >= 0 ? list[idx].id : id, name: name.trim(), filters }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  persist(list)
  return list
}

export function removeSavedFilter(id: string): SavedFilter[] {
  const list = loadSavedFilters().filter(f => f.id !== id)
  persist(list)
  return list
}
