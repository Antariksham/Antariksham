'use client'

import { useMemo } from 'react'
import { formatUTCDate } from '../services/orrery'
import { moonPhase, nextMoonEvent } from '../services/skyTonight.ts'

// Depiction colors for the Moon disc (content, like the orrery's planet
// colors — the disc sits on the pinned-dark space canvas in both themes).
const LIT    = 'hsl(48, 16%, 88%)'
const UNLIT  = 'hsl(228, 15%, 16%)'
const CRATER = 'hsla(48, 10%, 60%, 0.25)'

const R = 74
const C = 90 // center of the 180×180 viewBox

/**
 * SVG path for the lit part of the disc. Standard two-arc construction: a
 * semicircle down the lit limb, then back up along the terminator — a
 * half-ellipse whose x-radius shrinks to 0 at the quarters.
 */
function litPathD(illumination: number, waxing: boolean): string {
  const k = 1 - 2 * illumination // +1 new → 0 quarter → −1 full
  const rx = (R * Math.abs(k)).toFixed(2)
  const top = `${C} ${C - R}`, bottom = `${C} ${C + R}`
  if (waxing) {
    // Lit on the right (Northern-Hemisphere convention).
    return `M ${top} A ${R} ${R} 0 0 1 ${bottom} A ${rx} ${R} 0 0 ${k > 0 ? 0 : 1} ${top} Z`
  }
  return `M ${top} A ${R} ${R} 0 0 0 ${bottom} A ${rx} ${R} 0 0 ${k > 0 ? 1 : 0} ${top} Z`
}

export function MoonPhaseCard({ epochMs }: { epochMs: number }) {
  const { phase, nextFullMs, nextNewMs } = useMemo(() => ({
    phase:      moonPhase(epochMs),
    nextFullMs: nextMoonEvent(epochMs, 'full'),
    nextNewMs:  nextMoonEvent(epochMs, 'new'),
  }), [epochMs])

  const pct = Math.round(phase.illumination * 100)

  return (
    <section className="sky-card" aria-label="Moon phase tonight">
      <p className="body-section-title" style={{ margin: '0 0 12px' }}>The Moon tonight</p>

      <div className="sky-moon-row">
        <div className="sky-canvas sky-moon-canvas">
          <svg viewBox="0 0 180 180" role="img"
            aria-label={`${phase.name}, ${pct}% illuminated`}>
            <circle cx={C} cy={C} r={R} fill={UNLIT} />
            <path d={litPathD(phase.illumination, phase.waxing)} fill={LIT} />
            {/* A few craters, clipped to the disc, for a touch of realism */}
            <clipPath id="sky-moon-clip"><circle cx={C} cy={C} r={R} /></clipPath>
            <g clipPath="url(#sky-moon-clip)">
              <circle cx={C - 22} cy={C - 18} r={13} fill={CRATER} />
              <circle cx={C + 26} cy={C + 8}  r={9}  fill={CRATER} />
              <circle cx={C - 4}  cy={C + 34} r={11} fill={CRATER} />
              <circle cx={C + 14} cy={C - 38} r={6}  fill={CRATER} />
            </g>
          </svg>
        </div>

        <div className="sky-moon-info">
          <h2 className="body-title" style={{ fontSize: '1.35rem' }}>{phase.name}</h2>
          <div className="body-facts" style={{ marginTop: 12 }}>
            <div className="body-fact">
              <p className="body-fact-label">Illuminated</p>
              <p className="body-fact-value">{pct}%</p>
            </div>
            <div className="body-fact">
              <p className="body-fact-label">Moon age</p>
              <p className="body-fact-value">{phase.ageDays.toFixed(1)} days</p>
            </div>
            <div className="body-fact">
              <p className="body-fact-label">Next full moon</p>
              <p className="body-fact-value">{formatUTCDate(nextFullMs)}</p>
            </div>
            <div className="body-fact">
              <p className="body-fact-label">Next new moon</p>
              <p className="body-fact-value">{formatUTCDate(nextNewMs)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
