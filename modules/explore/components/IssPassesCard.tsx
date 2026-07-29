'use client'

import { useState } from 'react'
import Link from 'next/link'
import { compassPoint, passDuration, type IssPass } from '../services/issPasses'

interface PassRow extends IssPass {
  /** ISS sunlit + observer in twilight/darkness at the peak → actually visible. */
  visible: boolean
}

interface Result {
  passes:     PassRow[]
  sunriseMs:  number | null
  sunsetMs:   number | null
  scanHours:  number
  minElevDeg: number
}

type State =
  | { kind: 'idle' }
  | { kind: 'working'; step: string }
  | { kind: 'error'; message: string }
  | { kind: 'done'; result: Result }

// Local-time formatters — only ever rendered after a user action, so the
// user's locale/timezone can't cause a hydration mismatch.
const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const fmtDay = (ms: number) => {
  const d = new Date(ms)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(d) - startOf(today)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

function geolocate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, err => {
      reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission was denied. Pass times depend on where you are — allow location access and try again.'
          : 'Could not determine your location.',
      ))
    }, { timeout: 12_000, maximumAge: 600_000 })
  })
}

export function IssPassesCard() {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function run() {
    try {
      setState({ kind: 'working', step: 'Getting your location…' })
      const pos = await geolocate()
      // Rounded to ~11 km before it leaves the device — pass times only
      // shift by seconds across that distance.
      const lat = Math.round(pos.coords.latitude * 10) / 10
      const lon = Math.round(pos.coords.longitude * 10) / 10

      setState({ kind: 'working', step: 'Computing passes over your sky…' })
      const res = await fetch(`/api/iss/passes?lat=${lat}&lon=${lon}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || !Array.isArray(data.passes)) {
        throw new Error(data?.error || 'Pass predictions are unavailable right now — try again in a minute.')
      }

      setState({
        kind: 'done',
        result: {
          passes:     data.passes,
          sunriseMs:  data.sun?.sunriseMs ?? null,
          sunsetMs:   data.sun?.sunsetMs ?? null,
          scanHours:  data.scanHours ?? 48,
          minElevDeg: data.minElevDeg ?? 10,
        },
      })
    } catch (err: any) {
      setState({ kind: 'error', message: err?.message || 'Something went wrong.' })
    }
  }

  return (
    <section className="sky-card" aria-label="ISS passes over your location">
      <p className="body-section-title" style={{ margin: '0 0 4px' }}>ISS over your sky</p>
      <p className="sky-note">
        Upcoming International Space Station passes for your location, computed
        from the live orbital elements. Your coordinates are rounded to ~10 km
        first and used only for the calculation — never stored.
      </p>

      {state.kind === 'idle' && (
        <button type="button" className="btn btn-primary press" style={{ marginTop: 14 }} onClick={run}>
          Find passes for my location
        </button>
      )}

      {state.kind === 'working' && (
        <p className="sky-status" role="status">{state.step}</p>
      )}

      {state.kind === 'error' && (
        <div style={{ marginTop: 14 }}>
          <p className="sky-error" role="alert">{state.message}</p>
          <button type="button" className="btn btn-outline press" style={{ marginTop: 10 }} onClick={run}>
            Try again
          </button>
        </div>
      )}

      {state.kind === 'done' && (
        <div style={{ marginTop: 14 }}>
          <p className="sky-note" style={{ marginBottom: 10 }}>
            {state.result.sunsetMs !== null && state.result.sunriseMs !== null && (
              <>Sun sets {fmtTime(state.result.sunsetMs)} · rises {fmtTime(state.result.sunriseMs)} · </>
            )}
            next {state.result.scanHours} h · passes above {state.result.minElevDeg}°
          </p>

          {state.result.passes.length === 0 ? (
            <p className="sky-status">
              No passes above {state.result.minElevDeg}° in the next{' '}
              {state.result.scanHours} hours — the ISS ground track shifts
              daily, so check back tomorrow.
            </p>
          ) : (
            <div className="sky-passes">
              {state.result.passes.map(p => (
                <div key={p.startMs} className="sky-pass" data-visible={p.visible}>
                  <span className="sky-pass-day">{fmtDay(p.startMs)}</span>
                  <span className="sky-pass-time">
                    {fmtTime(p.startMs)}–{fmtTime(p.endMs)}
                    <span className="sky-pass-dur"> · {passDuration(p)}</span>
                  </span>
                  <span className="sky-pass-path">
                    {compassPoint(p.startAzDeg)} → {compassPoint(p.maxAzDeg)} → {compassPoint(p.endAzDeg)}
                  </span>
                  <span className="sky-pass-elev">max {Math.round(p.maxElevDeg)}°</span>
                  <span className="sky-window" data-window={p.visible ? 'evening' : 'hidden'}>
                    {p.visible ? 'Visible' : 'In daylight / shadow'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="sky-note" style={{ marginTop: 12 }}>
            “Visible” = your sky is dark while the Station is still in sunlight —
            it looks like a bright, steady star crossing the sky.{' '}
            <Link href="/live/iss-tracker" className="body-link">Track it live →</Link>
          </p>
        </div>
      )}
    </section>
  )
}
