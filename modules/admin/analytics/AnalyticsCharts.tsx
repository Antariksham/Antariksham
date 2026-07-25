'use client'

import { useMemo, useRef, useState } from 'react'
import type { Point, Slice } from './analytics'
import { niceMax, linePoints, toPath } from './chartUtils'

/**
 * Dashboard charts (Phase 2, Feature 5).
 * ─────────────────────────────────────────────────────────────────
 * Two forms, chosen by the data's job (per the dataviz method):
 *   • LineChart  — a single series over time (views). One accent hue, no legend
 *     (the card title names it), a 2px line over a faint area, a recessive grid,
 *     and a crosshair + tooltip on hover.
 *   • BarList    — a magnitude breakdown (device / source / …). One hue, rounded
 *     bar ends, direct value labels, per-row hover.
 * Colour is read from brand tokens (`--accent-rgb`, `--ink`) so both charts are
 * theme-aware by construction — no hard-coded hues, light + dark for free.
 */

const VB_W = 720
const VB_H = 220
const PAD_L = 6
const PAD_R = 6
const PAD_T = 12
const PAD_B = 22

// ── Line / area chart (single series over time) ────────────────
export function LineChart({ points, label = 'Views', formatKey }: {
  points: Point[]
  label?: string
  formatKey?: (key: string) => string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const values = points.map(p => p.value)
  const max = niceMax(Math.max(1, ...values))

  // Plot inside a box inset from the SVG edges (leaving room for x labels).
  const plotW = VB_W - PAD_L - PAD_R
  const plotH = VB_H - PAD_T - PAD_B
  const pts = useMemo(
    () => linePoints(values, plotW, plotH, max).map(p => ({ x: p.x + PAD_L, y: p.y + PAD_T })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, max],
  )

  const line = toPath(pts)
  const areaPath = useMemo(() => {
    if (pts.length === 0) return ''
    const base = (PAD_T + plotH).toFixed(1)
    const body = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    return `${body} L${pts[pts.length - 1].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`
  }, [pts, plotH])

  // Horizontal grid lines at 0 / ½ / max.
  const gridYs = [PAD_T, PAD_T + plotH / 2, PAD_T + plotH]
  const gridVals = [max, max / 2, 0]

  // Sparse x labels: first, middle, last (avoids collisions on long ranges).
  const xLabelIdx = points.length <= 1 ? [0]
    : Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]))

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || pts.length === 0) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VB_W
    let nearest = 0, best = Infinity
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - x)
      if (d < best) { best = d; nearest = i }
    }
    setHover(nearest)
  }

  const hv = hover != null && points[hover] ? { pt: pts[hover], p: points[hover] } : null
  const fmt = formatKey ?? ((k: string) => k)

  return (
    <div className="an-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="an-chart__svg"
        role="img"
        aria-label={`${label} over time`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Recessive grid + axis labels */}
        {gridYs.map((y, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={VB_W - PAD_R} y2={y} className="an-chart__grid" />
            <text x={PAD_L} y={y - 3} className="an-chart__axis">{Math.round(gridVals[i]).toLocaleString()}</text>
          </g>
        ))}

        {/* Area fill + line */}
        {areaPath && <path d={areaPath} className="an-chart__area" />}
        {line && <path d={line} className="an-chart__line" />}

        {/* End dot (last data point) */}
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3.2} className="an-chart__dot" />
        )}

        {/* Hover crosshair + marker */}
        {hv && (
          <g className="an-chart__hover">
            <line x1={hv.pt.x} y1={PAD_T} x2={hv.pt.x} y2={PAD_T + plotH} className="an-chart__crosshair" />
            <circle cx={hv.pt.x} cy={hv.pt.y} r={4} className="an-chart__marker" />
          </g>
        )}

        {/* X labels */}
        {xLabelIdx.map(i => pts[i] && (
          <text
            key={i}
            x={Math.min(Math.max(pts[i].x, 24), VB_W - 24)}
            y={VB_H - 6}
            className="an-chart__axis"
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          >
            {fmt(points[i].key)}
          </text>
        ))}
      </svg>

      {/* HTML tooltip (crisp text, unaffected by the non-uniform SVG scale) */}
      {hv && (
        <div
          className="an-chart__tip"
          style={{ left: `${(hv.pt.x / VB_W) * 100}%`, top: `${(hv.pt.y / VB_H) * 100}%` }}
        >
          <span className="an-chart__tip-k">{fmt(hv.p.key)}</span>
          <span className="an-chart__tip-v">{hv.p.value.toLocaleString()} {label.toLowerCase()}</span>
        </div>
      )}
    </div>
  )
}

// ── Horizontal bar list (magnitude breakdown) ──────────────────
export function BarList({ slices, unit = 'views', renderLabel }: {
  slices: Slice[]
  unit?: string
  renderLabel?: (label: string) => string
}) {
  const max = Math.max(1, ...slices.map(s => s.value))
  const label = renderLabel ?? ((l: string) => l)

  if (slices.length === 0) return <p className="an-empty">No data yet.</p>

  return (
    <div className="an-bars" role="list">
      {slices.map(s => {
        const pct = (s.value / max) * 100
        return (
          <div className="an-bars__row" role="listitem" key={s.label} title={`${label(s.label)}: ${s.value.toLocaleString()} ${unit}`}>
            <span className="an-bars__label">{label(s.label)}</span>
            <span className="an-bars__track">
              <span className="an-bars__fill" style={{ width: `${Math.max(pct, 2)}%` }} />
            </span>
            <span className="an-bars__value">{s.value.toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}
