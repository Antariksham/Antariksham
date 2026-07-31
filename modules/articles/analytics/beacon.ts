/**
 * Analytics beacon (Phase 2, Feature 5) — client collection helper.
 * Sends privacy-friendly page events to /api/analytics/collect. The visitor id
 * is an opaque random token in localStorage (no PII, no fingerprinting); the
 * session id lives in sessionStorage. Uses `navigator.sendBeacon` so events
 * still fire as the page unloads.
 */
export type BeaconType = 'view' | 'read' | 'share' | 'bookmark'

const VID_KEY = 'antariksham.analytics.vid'
const SID_KEY = 'antariksham.analytics.sid'

const rand = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function stored(storage: Storage | undefined, key: string): string {
  try {
    if (!storage) return ''
    let v = storage.getItem(key)
    if (!v) { v = rand(); storage.setItem(key, v) }
    return v
  } catch {
    return ''
  }
}

export function visitorId(): string {
  return stored(typeof window !== 'undefined' ? window.localStorage : undefined, VID_KEY)
}
export function sessionId(): string {
  return stored(typeof window !== 'undefined' ? window.sessionStorage : undefined, SID_KEY)
}

export function sendEvent(payload: {
  articleId: string
  type:      BeaconType
  scrollPct?: number
  dwellMs?:   number
  path?:      string
}): void {
  if (typeof window === 'undefined' || !payload.articleId) return
  try {
    const body = JSON.stringify({
      visitor:  visitorId(),
      session:  sessionId(),
      referrer: document.referrer || '',
      ...payload,
    })
    const url = '/api/analytics/collect'
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
    }
  } catch { /* analytics must never break the page */ }
}
