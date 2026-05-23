import type { Launch, LaunchStatus, LaunchLibraryLaunch } from '@/types/launch'
import { apiConfig } from '@/config/api'

// ── Helpers ───────────────────────────────────────────────────

function mapStatus(abbrev: string): LaunchStatus {
  switch (abbrev?.toLowerCase()) {
    case 'go':  return 'go'
    case 'tbd':
    case 'tbc': return 'tbd'
    case 'success': return 'success'
    case 'failure': return 'failure'
    case 'hold':    return 'hold'
    case 'inflight':
    case 'in_flight': return 'in-flight'
    case 'partial failure': return 'partial-failure'
    default: return 'tbd'
  }
}

function mapLaunch(r: LaunchLibraryLaunch): Launch {
  return {
    id:            r.id,
    name:          r.name,
    slug:          r.id,
    rocket:        r.rocket?.configuration?.name || 'Unknown Rocket',
    launchDate:    r.net || null,
    windowStart:   r.window_start || null,
    windowEnd:     r.window_end   || null,
    status:        mapStatus(r.status?.abbrev || ''),
    launchSite:    r.pad?.location?.name || null,
    launchPad:     r.pad?.name           || null,
    livestreamUrl: r.vidURLs?.[0]?.url   || null,
    agency:        r.launch_service_provider?.name || null,
    missionId:     null,
    description:   r.mission?.description || null,
    probability:   r.probability          || null,
    weather:       null,
    updatedAt:     r.last_updated || new Date().toISOString(),
  }
}

// ── Upcoming launches ─────────────────────────────────────────

export async function getUpcomingLaunches(limit = 10): Promise<Launch[]> {
  try {
    const url = `${apiConfig.launchLibrary.upcoming}/?limit=${limit}&format=json`

    const res = await fetch(url, {
      next: { revalidate: apiConfig.cache.launches },
    })

    if (!res.ok) {
      console.error('getUpcomingLaunches failed:', res.status)
      return []
    }

    const data = await res.json()
    return (data.results || []).map(mapLaunch)
  } catch (err) {
    console.error('getUpcomingLaunches error:', err)
    return []
  }
}

// ── Recent launches ───────────────────────────────────────────

export async function getRecentLaunches(limit = 5): Promise<Launch[]> {
  try {
    const url = `${apiConfig.launchLibrary.previous}/?limit=${limit}&format=json`

    const res = await fetch(url, {
      next: { revalidate: apiConfig.cache.launches },
    })

    if (!res.ok) {
      console.error('getRecentLaunches failed:', res.status)
      return []
    }

    const data = await res.json()
    return (data.results || []).map(mapLaunch)
  } catch (err) {
    console.error('getRecentLaunches error:', err)
    return []
  }
}
