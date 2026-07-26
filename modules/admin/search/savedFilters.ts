/**
 * Saved search presets (Phase 2, Feature 8).
 * Browser-local named filter presets so editors can re-run a common query
 * (e.g. "Drafts over 1k views", "NASA, this month") in one click. Generic over
 * the filter shape so it survived the move to server-side querying.
 */
const STORAGE_KEY = 'cosmosdaily.article.filters.v2'

export interface SavedFilter<F = unknown> { id: string; name: string; filters: F }

export function loadSavedFilters<F = unknown>(): SavedFilter<F>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? (arr as SavedFilter<F>[]).filter(f => f && f.name && f.filters) : []
  } catch {
    return []
  }
}

function persist<F>(list: SavedFilter<F>[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100))) } catch { /* ignore */ }
}

export function saveFilter<F>(name: string, filters: F): SavedFilter<F>[] {
  const list = loadSavedFilters<F>()
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const idx = list.findIndex(f => f.name.toLowerCase() === name.trim().toLowerCase())
  const entry: SavedFilter<F> = { id: idx >= 0 ? list[idx].id : id, name: name.trim(), filters }
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  persist(list)
  return list
}

export function removeSavedFilter<F>(id: string): SavedFilter<F>[] {
  const list = loadSavedFilters<F>().filter(f => f.id !== id)
  persist(list)
  return list
}
