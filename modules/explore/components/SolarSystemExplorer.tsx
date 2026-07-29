'use client'

import { useEffect, useState } from 'react'
import { formatUTCDate } from '../services/orrery'
import { SOLAR_BODIES, BODY_BY_ID } from '../services/solarSystemBodies'
import type { ExploreMissionRef } from '../services/bodyMissions'
import { OrrerySvg } from './OrrerySvg'
import { BodyPanel } from './BodyPanel'

/** Time-travel speeds, in simulated days per real second. */
const SPEEDS = [
  { label: '▶ 1 mo/s', days: 30 },
  { label: '▶▶ 1 yr/s', days: 365 },
]

interface Props {
  /**
   * Epoch the server rendered positions for. Serialized as a prop, so SSR and
   * hydration agree byte-for-byte; the client silently re-syncs to the real
   * "now" after mount (§6 rule: live values tick only after mount).
   */
  initialEpochMs: number
  /** Mission cross-links grouped by body id (computed server-side). */
  missionsByBody: Record<string, ExploreMissionRef[]>
}

export function SolarSystemExplorer({ initialEpochMs, missionsByBody }: Props) {
  const [selectedId, setSelectedId] = useState('earth')
  const [epochMs, setEpochMs]       = useState(initialEpochMs)
  const [speed, setSpeed]           = useState(0) // simulated days per second; 0 = holding a date

  // After mount, snap to the actual current date (planets move < 1°/day, so
  // the visual change from a stale ISR epoch is imperceptible — this keeps
  // the date readout honest).
  useEffect(() => { setEpochMs(Date.now()) }, [])

  // Time travel. Animation only ever starts from an explicit user action, so
  // prefers-reduced-motion users are never surprised — but when it *is*
  // running we honour the preference by stepping once a second instead of
  // ten times a second (same simulated rate, calmer screen).
  useEffect(() => {
    if (!speed) return
    const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stepMs   = reduced ? 1000 : 100
    const id = setInterval(() => {
      setEpochMs(e => e + speed * 86_400_000 * (stepMs / 1000))
    }, stepMs)
    return () => clearInterval(id)
  }, [speed])

  const resetToToday = () => { setSpeed(0); setEpochMs(Date.now()) }

  const selected = BODY_BY_ID[selectedId] || BODY_BY_ID.earth

  return (
    <div>
      {/* Body chip rail — the keyboard/touch-friendly selection path */}
      <div className="orrery-rail" role="tablist" aria-label="Solar System bodies">
        {SOLAR_BODIES.map(body => (
          <button
            key={body.id}
            type="button"
            role="tab"
            aria-selected={selectedId === body.id}
            data-active={selectedId === body.id}
            className="orrery-chip press"
            style={{ '--chip-color': body.color } as React.CSSProperties}
            onClick={() => setSelectedId(body.id)}
          >
            {body.name}
          </button>
        ))}
      </div>

      <div className="orrery-layout">
        <div>
          <div className="orrery-panel">
            <OrrerySvg epochMs={epochMs} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div className="orrery-controls">
            <div className="orrery-time-group" role="group" aria-label="Time controls">
              <button
                type="button"
                className="orrery-chip press"
                data-active={speed === 0}
                onClick={resetToToday}
              >
                Today
              </button>
              {SPEEDS.map(s => (
                <button
                  key={s.days}
                  type="button"
                  className="orrery-chip press"
                  data-active={speed === s.days}
                  aria-pressed={speed === s.days}
                  onClick={() => setSpeed(cur => (cur === s.days ? 0 : s.days))}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="orrery-date" aria-live="off">
              {formatUTCDate(epochMs)}{speed !== 0 && ' · simulating'}
            </p>
          </div>

          <p className="orrery-note">
            Positions are computed from JPL Keplerian orbital elements for the displayed
            date — the angles are true. Distances are log-compressed and body sizes
            exaggerated so every orbit stays readable (drawn to scale, the inner planets
            would vanish into the Sun).
          </p>
        </div>

        <BodyPanel body={selected} missions={missionsByBody[selected.id] || []} />
      </div>
    </div>
  )
}
