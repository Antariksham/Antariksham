// Persistent mission analytics for the lunar simulator (no backend).
//
// One small session object in localStorage tracks how often the C++
// flight software beats the stochastic missions it is dealt. All access
// is guarded: SSR, private-mode quota errors and corrupted payloads all
// degrade to in-memory zeros. Consumers must only read after mount
// (hydration-safe — see MIGRATION.md §5).

export interface MissionStats {
  total_attempts: number
  safe_landings: number
  crashes: number
}

const STORAGE_KEY = 'cosmosdaily.lunar-sim.stats.v1'

export const EMPTY_STATS: MissionStats = {
  total_attempts: 0,
  safe_landings: 0,
  crashes: 0,
}

function sanitizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

export function readMissionStats(): MissionStats {
  if (typeof window === 'undefined') return { ...EMPTY_STATS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_STATS }
    const parsed = JSON.parse(raw) as Partial<MissionStats>
    const safe_landings = sanitizeCount(parsed.safe_landings)
    const crashes = sanitizeCount(parsed.crashes)
    // Attempts can never be fewer than the outcomes it counts.
    const total_attempts = Math.max(
      sanitizeCount(parsed.total_attempts),
      safe_landings + crashes,
    )
    return { total_attempts, safe_landings, crashes }
  } catch {
    return { ...EMPTY_STATS }
  }
}

function writeMissionStats(stats: MissionStats): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Quota/private mode: analytics silently stay in memory for this view.
  }
}

/** Record one completed run and return the updated tallies. */
export function recordMissionOutcome(safeLanding: boolean): MissionStats {
  const stats = readMissionStats()
  stats.total_attempts += 1
  if (safeLanding) stats.safe_landings += 1
  else stats.crashes += 1
  writeMissionStats(stats)
  return stats
}

/** Wipe the scoreboard (user-triggered). */
export function resetMissionStats(): MissionStats {
  const empty = { ...EMPTY_STATS }
  writeMissionStats(empty)
  return empty
}

export function successRatePct(stats: MissionStats): number {
  return stats.total_attempts > 0
    ? (stats.safe_landings / stats.total_attempts) * 100
    : 0
}
