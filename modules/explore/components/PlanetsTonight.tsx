'use client'

import { useMemo } from 'react'
import { BODY_BY_ID } from '../services/solarSystemBodies'
import { planetsTonight, type SkyWindow } from '../services/skyTonight.ts'

const WINDOW_META: Record<SkyWindow, { label: string; hint: string }> = {
  // A planet east of the Sun sets after it (west after sunset); west of the
  // Sun it rises before it (east before dawn).
  evening:     { label: 'Evening',   hint: 'Western sky after sunset' },
  morning:     { label: 'Morning',   hint: 'Eastern sky before dawn' },
  'all-night': { label: 'All night', hint: 'Up nearly all night — near opposition' },
  hidden:      { label: 'Hidden',    hint: 'Lost in the Sun’s glare' },
}

const WINDOW_ORDER: SkyWindow[] = ['all-night', 'evening', 'morning', 'hidden']

/** Only these are naked-eye planets; the ice giants need help. */
const NEEDS_OPTICS: Record<string, string> = {
  uranus:  'binoculars',
  neptune: 'telescope',
}

export function PlanetsTonight({ epochMs }: { epochMs: number }) {
  const rows = useMemo(() => {
    const sky = planetsTonight(epochMs)
    return [...sky].sort((a, b) => {
      const g = WINDOW_ORDER.indexOf(a.window) - WINDOW_ORDER.indexOf(b.window)
      return g !== 0 ? g : b.elongationDeg - a.elongationDeg
    })
  }, [epochMs])

  return (
    <section className="sky-card" aria-label="Planet visibility tonight">
      <p className="body-section-title" style={{ margin: '0 0 4px' }}>Planets tonight</p>
      <p className="sky-note" style={{ marginBottom: 14 }}>
        Which twilight each planet belongs to — the same for every observer on
        Earth tonight, from its angle to the Sun.
      </p>

      <div className="sky-planets">
        {rows.map(p => {
          const body = BODY_BY_ID[p.id]
          const meta = WINDOW_META[p.window]
          return (
            <div key={p.id} className="sky-planet" data-window={p.window}>
              <span className="sky-planet-dot" style={{ background: body.color }} aria-hidden />
              <span className="sky-planet-name">
                {body.name}
                {NEEDS_OPTICS[p.id] && <span className="sky-planet-optics"> · {NEEDS_OPTICS[p.id]}</span>}
              </span>
              <span className="sky-planet-hint">{meta.hint}</span>
              <span className="sky-planet-elong">{Math.round(p.elongationDeg)}° from Sun</span>
              <span className="sky-window" data-window={p.window}>{meta.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
