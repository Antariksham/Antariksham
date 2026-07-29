'use client'

import { useMemo } from 'react'
import {
  PLANET_ELEMENTS, helioPosition, moonAngleDeg,
  scaledFraction, orreryPoint,
} from '../services/orrery'
import { SOLAR_BODIES, BODY_BY_ID, type SolarBody } from '../services/solarSystemBodies'

// SVG canvas geometry (viewBox units).
const VIEW  = 720
const CX    = VIEW / 2
const CY    = VIEW / 2
const MAX_R = 332
/** Display radius of the Moon's little orbit around the Earth dot. */
const MOON_ORBIT_R = 17

// ── Deterministic starfield ───────────────────────────────────
// Seeded PRNG (mulberry32) so the exact same stars render on the server and
// the client — Math.random() here would be a hydration mismatch.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const STARS = (() => {
  const rnd = mulberry32(7)
  return Array.from({ length: 110 }, () => ({
    x: Math.round(rnd() * VIEW * 10) / 10,
    y: Math.round(rnd() * VIEW * 10) / 10,
    r: Math.round((0.4 + rnd() * 0.9) * 100) / 100,
    o: Math.round((0.2 + rnd() * 0.45) * 100) / 100,
  }))
})()

const PLANET_IDS = Object.keys(PLANET_ELEMENTS)

interface Props {
  epochMs:    number
  selectedId: string
  onSelect:   (id: string) => void
}

/**
 * The orrery itself: a top-down SVG map of the Solar System with true
 * heliocentric angles for the given epoch, log-compressed distances, and
 * exaggerated body sizes. Purely presentational — all state lives in
 * `SolarSystemExplorer`.
 */
export function OrrerySvg({ epochMs, selectedId, onSelect }: Props) {
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {
      sun: { x: CX, y: CY },
    }
    for (const id of PLANET_IDS) {
      const { lonDeg, rAU } = helioPosition(PLANET_ELEMENTS[id], epochMs)
      map[id] = orreryPoint(lonDeg, scaledFraction(rAU), CX, CY, MAX_R)
    }
    // The Moon rides around the Earth dot on a small decorative orbit.
    const moonRad = moonAngleDeg(epochMs) * (Math.PI / 180)
    map.moon = {
      x: map.earth.x + MOON_ORBIT_R * Math.cos(moonRad),
      y: map.earth.y - MOON_ORBIT_R * Math.sin(moonRad),
    }
    return map
  }, [epochMs])

  const handleKey = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  const renderBody = (body: SolarBody) => {
    const pos = positions[body.id]
    const selected = selectedId === body.id
    // The Moon sits right next to Earth — its label only appears when
    // selected, so the two never overlap.
    const showLabel = body.id !== 'moon' || selected
    return (
      <g
        key={body.id}
        className="orrery-body"
        transform={`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`}
        role="button"
        tabIndex={0}
        aria-label={`Select ${body.name}`}
        aria-pressed={selected}
        onClick={() => onSelect(body.id)}
        onKeyDown={handleKey(body.id)}
      >
        {selected && (
          <circle className="orrery-halo" r={body.size + 7} style={{ stroke: body.color }} />
        )}
        {body.id === 'sun' && (
          <circle r={54} fill="url(#orrery-sun-glow)" pointerEvents="none" />
        )}
        {/* Invisible fat hit-target so small dots stay easy to click/tap. */}
        <circle r={Math.max(body.size + 8, 13)} fill="transparent" stroke="none" />
        <circle className="orrery-dot" r={body.size} fill={body.color} />
        {body.id === 'saturn' && (
          <ellipse
            className="orrery-saturn-rings"
            rx={body.size * 1.95}
            ry={body.size * 0.62}
            transform="rotate(-20)"
            style={{ stroke: body.color }}
          />
        )}
        {showLabel && (
          <text className="orrery-label" y={body.size + 14}>{body.name}</text>
        )}
      </g>
    )
  }

  const sun = BODY_BY_ID.sun

  return (
    <svg
      className="orrery-svg"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="group"
      aria-label="Interactive map of the Solar System. Use Tab to move between bodies and Enter to select one."
    >
      <defs>
        <radialGradient id="orrery-sun-glow">
          <stop offset="0%"  stopColor={sun.color} stopOpacity="0.5" />
          <stop offset="45%" stopColor={sun.color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={sun.color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Starfield (deterministic — see above) */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} className="orrery-star" style={{ opacity: s.o }} />
      ))}

      {/* Orbit rings at each planet's scaled semi-major axis */}
      {PLANET_IDS.map(id => (
        <circle
          key={id}
          className="orrery-ring"
          cx={CX}
          cy={CY}
          r={(scaledFraction(PLANET_ELEMENTS[id].a) * MAX_R).toFixed(2)}
        />
      ))}
      {/* The Moon's little orbit around Earth */}
      <circle
        className="orrery-ring orrery-ring--moon"
        cx={positions.earth.x.toFixed(2)}
        cy={positions.earth.y.toFixed(2)}
        r={MOON_ORBIT_R}
      />

      {/* Bodies — Sun first (bottom), then outward; Moon last so it draws over Earth's ring */}
      {SOLAR_BODIES.map(renderBody)}
    </svg>
  )
}
