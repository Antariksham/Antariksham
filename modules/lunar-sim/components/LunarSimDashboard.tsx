'use client'

// Lunar Landing Simulator (testing) — telemetry console for the SELENE
// C++ flight software running in WebAssembly.
//
// Data path: the wasm module flies the whole closed-loop descent with the
// real flight stack (state machine, guidance, PID loops, thrust allocator,
// nav filter, hazard avoidance) and records 50 Hz telemetry. Every rendered
// frame (requestAnimationFrame, ~60 fps) this component asks the module for
// the interpolated state vector at the current mission time and paints it.
// No physics happens in JavaScript.

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  DEFAULT_SCENARIO,
  loadSelene,
  phaseName,
  type SeleneModule,
  type SeleneScenarioConfig,
  type SeleneSimResult,
  type SeleneSimState,
} from '../services/loadSelene'

// WebGL bundle stays off every other route (MIGRATION.md §10 pattern).
const LunarScene = dynamic(() => import('./LunarScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: 'var(--faint)',
    }}>
      Loading 3-D scene…
    </div>
  ),
})

// ── Presentation helpers ─────────────────────────────────────────────
const f0 = (v: number) => v.toFixed(0)
const f1 = (v: number) => v.toFixed(1)
const f2 = (v: number) => v.toFixed(2)

function phaseColor(phase: number): string {
  switch (phase) {
    case 4:  return 'var(--accent)' // APPROACH
    case 5:  return 'var(--gold)'   // TERMINAL DESCENT
    case 6:
    case 7:  return 'var(--green)'  // TOUCHDOWN / SAFED
    case 8:  return 'var(--red)'    // SAFE MODE
    default: return 'var(--dim)'
  }
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--faint)',
}

function Readout({ label, value, unit, color }: {
  label: string; value: string; unit?: string; color?: string
}) {
  return (
    <div className="card" style={{ padding: '0.9rem 1rem' }}>
      <div style={labelStyle}>{label}</div>
      <div style={{
        fontSize: '1.55rem', fontWeight: 700, lineHeight: 1.3,
        color: color || 'var(--white)', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
        {unit && <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--dim)', marginLeft: '0.3rem' }}>{unit}</span>}
      </div>
    </div>
  )
}

function Bar({ label, frac, color, detail }: {
  label: string; frac: number; color: string; detail: string
}) {
  const pct = Math.max(0, Math.min(1, frac)) * 100
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ ...labelStyle, color: 'var(--dim)' }}>{detail}</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(var(--ink), 0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: color, transition: 'width 80ms linear' }} />
      </div>
    </div>
  )
}

// ── Descent profile (2-D side view; the Three.js scene is the next
//    milestone — this proves the coordinate mapping it will use) ──────
function DescentProfile({ state, scenario, trace, targetM }: {
  state: SeleneSimState
  scenario: SeleneScenarioConfig
  trace: Array<[number, number]>
  targetM: number
}) {
  const W = 640, H = 240, PAD = 24
  const xMax = Math.max(scenario.targetDownrangeM + 400, state.downrangeM + 50)
  const yMax = scenario.gateAltitudeM * 1.06
  const px = (m: number) => PAD + (m / xMax) * (W - 2 * PAD)
  const py = (m: number) => H - PAD - (m / yMax) * (H - 2 * PAD)
  const pitchDeg = state.pitchRad * (180 / Math.PI)
  const lx = px(state.downrangeM)
  const ly = py(state.altitudeM)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Descent profile: altitude versus downrange distance"
    >
      {/* ground */}
      <line x1={PAD - 8} y1={py(0)} x2={W - PAD + 8} y2={py(0)}
        stroke="rgba(var(--ink), 0.35)" strokeWidth="2" />
      {/* hazard zone on the nominal site */}
      {scenario.hazardAtTarget && (
        <rect x={px(scenario.targetDownrangeM - 40)} y={py(0)}
          width={px(scenario.targetDownrangeM + 40) - px(scenario.targetDownrangeM - 40)}
          height={5} fill="var(--red)" opacity={0.85} />
      )}
      {/* landing target (post-divert if HDA moved it) */}
      <g transform={`translate(${px(targetM)}, ${py(0)})`}>
        <line x1="0" y1="0" x2="0" y2="-14" stroke="var(--green)" strokeWidth="2" />
        <polygon points="0,-14 9,-11 0,-8" fill="var(--green)" />
      </g>
      {/* flown trajectory */}
      <polyline
        points={trace.map(([d, a]) => `${px(d)},${py(a)}`).join(' ')}
        fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7"
        strokeDasharray="3 3"
      />
      {/* lander: body + legs, rotated by true pitch; flame scales with throttle */}
      <g transform={`translate(${lx}, ${ly}) rotate(${pitchDeg})`}>
        {state.throttleFrac > 0 && !state.touchedDown && (
          <polygon
            points={`-3,7 3,7 0,${7 + 14 * state.throttleFrac}`}
            fill="var(--gold)" opacity="0.9"
          />
        )}
        <rect x="-5" y="-7" width="10" height="14" rx="2.5" fill="var(--white)" />
        <line x1="-5" y1="5" x2="-9" y2="11" stroke="var(--white)" strokeWidth="1.6" />
        <line x1="5" y1="5" x2="9" y2="11" stroke="var(--white)" strokeWidth="1.6" />
      </g>
      {/* gate + altitude scale hints */}
      <text x={PAD} y={py(scenario.gateAltitudeM) - 6} fill="var(--faint)"
        fontSize="10" fontFamily="var(--font-mono)">
        GATE {f0(scenario.gateAltitudeM)} m
      </text>
      <text x={W - PAD} y={py(0) + 16} fill="var(--faint)" fontSize="10"
        textAnchor="end" fontFamily="var(--font-mono)">
        DOWNRANGE →
      </text>
    </svg>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────
type BridgeStatus = 'loading' | 'ready' | 'error'

export function LunarSimDashboard() {
  const [status, setStatus] = useState<BridgeStatus>('loading')
  const [state, setState] = useState<SeleneSimState | null>(null)
  const [result, setResult] = useState<SeleneSimResult | null>(null)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [scenario, setScenario] = useState<SeleneScenarioConfig>(DEFAULT_SCENARIO)
  const [finalTargetM, setFinalTargetM] = useState(DEFAULT_SCENARIO.targetDownrangeM)
  const [runId, setRunId] = useState(0)

  const moduleRef = useRef<SeleneModule | null>(null)
  const stateRef = useRef<SeleneSimState | null>(null)
  const missionTimeRef = useRef(0)
  const lastFrameRef = useRef<number | null>(null)
  const lastLogRef = useRef(-1)
  const traceRef = useRef<Array<[number, number]>>([])
  const pausedRef = useRef(paused)
  const speedRef = useRef(speed)
  pausedRef.current = paused
  speedRef.current = speed

  // Fly a scenario inside the wasm module and rewind the playback clock.
  const startRun = useCallback((cfg: SeleneScenarioConfig) => {
    const fsw = moduleRef.current
    if (!fsw) return
    if (!fsw.runScenario(cfg)) {
      console.error('[lunar-sim] C++ FSW rejected the scenario', cfg)
      return
    }
    missionTimeRef.current = 0
    lastFrameRef.current = null
    lastLogRef.current = -1
    traceRef.current = []
    setResult(null)
    setScenario(cfg)
    setPaused(false)
    // The run is already complete inside wasm, so the (post-divert) landing
    // target is known up front — the profile marker uses it from the start.
    setFinalTargetM(fsw.getResult().finalTargetDownrangeM)
    setRunId((id) => id + 1)
    const t0 = fsw.getStateAtTime(0)
    stateRef.current = t0
    setState(t0)
    console.log(
      `[lunar-sim] Scenario loaded — gate ${cfg.gateAltitudeM} m, ` +
      `flight time ${fsw.getFlightTimeS().toFixed(1)} s, ` +
      `${fsw.getSampleCount()} FSW cycles @ 50 Hz`
    )
    console.log(`[lunar-sim] Altitude from C++ FSW at t=0: ${t0.altitudeM.toFixed(1)} m`)
  }, [])

  // Bring up the wasm bridge once on mount.
  useEffect(() => {
    let alive = true
    loadSelene()
      .then((fsw) => {
        if (!alive) return
        moduleRef.current = fsw
        console.log('[lunar-sim] SELENE C++ flight software → WebAssembly bridge established')
        setStatus('ready')
        startRun(DEFAULT_SCENARIO)
      })
      .catch((err) => {
        console.error('[lunar-sim] wasm bridge failed to load:', err)
        if (alive) setStatus('error')
      })
    return () => { alive = false }
  }, [startRun])

  // 60 fps render loop: advance the mission clock, pull the state vector
  // from C++, log altitude once per mission second.
  useEffect(() => {
    if (status !== 'ready') return
    let rafId = 0
    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame)
      const fsw = moduleRef.current
      if (!fsw) return
      if (lastFrameRef.current === null) lastFrameRef.current = now
      const dt = (now - lastFrameRef.current) / 1000
      lastFrameRef.current = now
      if (!pausedRef.current) missionTimeRef.current += dt * speedRef.current

      const s = fsw.getStateAtTime(missionTimeRef.current)
      stateRef.current = s
      setState(s)

      const second = Math.floor(s.timeS)
      if (second !== lastLogRef.current) {
        lastLogRef.current = second
        console.log(
          `[lunar-sim] C++ FSW altitude: ${s.altitudeM.toFixed(1)} m ` +
          `(t=${s.timeS.toFixed(1)}s, descent ${(-s.velocityZMps).toFixed(1)} m/s, ` +
          `phase=${phaseName(s.missionPhase)})`
        )
      }

      const trace = traceRef.current
      const last = trace[trace.length - 1]
      if (!last || Math.abs(s.downrangeM - last[0]) > 4 || Math.abs(s.altitudeM - last[1]) > 4) {
        trace.push([s.downrangeM, s.altitudeM])
      }

      if (s.touchedDown) {
        setResult((prev) => prev ?? fsw.getResult())
      }
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [status])

  useEffect(() => {
    if (result) {
      console.log(
        `[lunar-sim] TOUCHDOWN — ${result.safeLanding ? 'SAFE LANDING' : 'LOSS OF VEHICLE'} ` +
        `(vertical ${result.touchdownVerticalSpeedMps.toFixed(2)} m/s, ` +
        `miss ${result.touchdownMissM.toFixed(1)} m)`
      )
    }
  }, [result])

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>
      <header className="page-header">
        <div className="container">
          <span className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)', display: 'inline-block',
            }} />
            Testing · WebAssembly
          </span>
          <h1 className="page-title">Lunar Landing Simulator</h1>
          <p className="page-lede">
            A live autonomous moon landing, flown end-to-end by real C++ flight software —
            guidance, navigation, control and hazard avoidance — compiled to WebAssembly
            and telemetered to this page at 60&nbsp;fps.
          </p>
        </div>
      </header>

      <div className="container section" style={{ paddingTop: '2rem' }}>
        {status === 'loading' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--dim)' }}>
            Initializing SELENE flight software (WebAssembly)…
          </div>
        )}

        {status === 'error' && (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--red)' }}>
            The flight-software module failed to load. Check the browser console —
            /wasm/selene_fsw.js and selene_fsw.wasm must be served alongside the site.
          </div>
        )}

        {status === 'ready' && state && (
          <>
            {/* Mission strip: phase, clock, controls */}
            <div className="card" style={{
              padding: '0.9rem 1.25rem', marginBottom: '1.5rem', flexDirection: 'row',
              alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span className="tag" style={{
                cursor: 'default', fontWeight: 700, letterSpacing: '0.08em',
                color: phaseColor(state.missionPhase), borderColor: phaseColor(state.missionPhase),
                background: 'transparent',
              }}>
                ● {phaseName(state.missionPhase)}
              </span>
              <span style={{ ...labelStyle, fontSize: '0.85rem', color: 'var(--white)', textTransform: 'none' }}>
                T+{f1(state.timeS)} s
              </span>
              <span style={{ flex: 1 }} />
              <button className="btn btn-outline" onClick={() => setPaused(p => !p)}>
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn btn-outline" onClick={() => setSpeed(s => (s >= 4 ? 1 : s * 2))}>
                {speed}× speed
              </button>
              <button
                className="btn btn-outline"
                onClick={() => startRun({ ...scenario, hazardAtTarget: !scenario.hazardAtTarget })}
                title="Restart with a boulder field on the nominal site — watch the FSW divert"
              >
                Hazard: {scenario.hazardAtTarget ? 'ON' : 'OFF'}
              </button>
              <button className="btn btn-primary" onClick={() => startRun(scenario)}>
                ↺ Restart descent
              </button>
            </div>

            {/* 3-D visual simulation — rendered from C++ state vectors */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ height: 'clamp(320px, 48vw, 520px)' }}>
                <LunarScene stateRef={stateRef} scenario={scenario} targetM={finalTargetM} runId={runId} />
              </div>
              <div style={{
                ...labelStyle, padding: '0.6rem 1rem',
                borderTop: '1px solid var(--border)', color: 'var(--faint)',
              }}>
                Visual simulation (Three.js) — position, attitude and engine plume mapped 1:1
                from the flight software&apos;s state vectors
              </div>
            </div>

            {/* Primary telemetry */}
            <div style={{
              display: 'grid', gap: '1rem', marginBottom: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            }}>
              <Readout label="Altitude" value={f1(state.altitudeM)} unit="m" color="var(--accent)" />
              <Readout label="Descent rate" value={f1(-state.velocityZMps)} unit="m/s"
                color={-state.velocityZMps > 15 ? 'var(--gold)' : 'var(--white)'} />
              <Readout label="Ground speed" value={f1(state.velocityXMps)} unit="m/s" />
              <Readout label="Downrange" value={f0(state.downrangeM)} unit="m" />
              <Readout label="Pitch" value={f1(state.pitchRad * 180 / Math.PI)} unit="°" />
              <Readout label="Vehicle mass" value={f0(state.massKg)} unit="kg" />
            </div>

            <div style={{
              display: 'grid', gap: '1.5rem', alignItems: 'stretch',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '1.5rem',
            }}>
              {/* Descent profile */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ ...labelStyle, marginBottom: '0.75rem' }}>Descent profile — truth state from C++</div>
                <DescentProfile state={state} scenario={scenario} trace={traceRef.current} targetM={finalTargetM} />
              </div>

              {/* Actuators + navigation */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ ...labelStyle, marginBottom: '0.75rem' }}>Actuators & navigation filter</div>
                <Bar label="Main engine throttle" frac={state.throttleFrac} color="var(--gold)"
                  detail={`${f0(state.throttleFrac * 100)} %`} />
                <Bar label="RCS pitch torque" frac={Math.abs(state.torqueFrac)}
                  color="var(--accent)" detail={`${f0(state.torqueFrac * 100)} %`} />
                <Bar label="Altitude vs gate" frac={state.altitudeM / scenario.gateAltitudeM}
                  color="var(--green)" detail={`${f0(state.altitudeM)} m`} />
                <div style={{
                  marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                }}>
                  <div>
                    <div style={labelStyle}>Nav altitude (KF)</div>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{f1(state.navAltitudeM)} m</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Nav error vs truth</div>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--dim)' }}>
                      {f2(Math.abs(state.navAltitudeM - state.altitudeM))} m
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Cmd descent rate</div>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{f1(-state.velocityZCmdMps)} m/s</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Cmd ground speed</div>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{f1(state.velocityXCmdMps)} m/s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Touchdown verdict */}
            {result && (
              <div className="card" style={{
                padding: '1.5rem',
                borderColor: result.safeLanding ? 'var(--green)' : 'var(--red)',
              }}>
                <div style={{
                  fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem',
                  color: result.safeLanding ? 'var(--green)' : 'var(--red)',
                }}>
                  {result.safeLanding ? '✓ SAFE LANDING' : '✗ LOSS OF VEHICLE'}
                </div>
                <div style={{
                  display: 'grid', gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                }}>
                  <div><div style={labelStyle}>Vertical speed</div><b>{f2(result.touchdownVerticalSpeedMps)} m/s</b> <span style={{ color: 'var(--faint)' }}>limit 2.0</span></div>
                  <div><div style={labelStyle}>Horizontal speed</div><b>{f2(result.touchdownHorizontalSpeedMps)} m/s</b> <span style={{ color: 'var(--faint)' }}>limit 1.0</span></div>
                  <div><div style={labelStyle}>Tilt</div><b>{f2(result.touchdownTiltDeg)}°</b> <span style={{ color: 'var(--faint)' }}>limit 5.0</span></div>
                  <div><div style={labelStyle}>Site miss</div><b>{f1(result.touchdownMissM)} m</b> <span style={{ color: 'var(--faint)' }}>limit 50</span></div>
                  <div><div style={labelStyle}>Flight time</div><b>{f1(result.flightTimeS)} s</b></div>
                  <div><div style={labelStyle}>Propellant used</div><b>{f1(result.propellantUsedKg)} kg</b></div>
                </div>
                {result.hdaDiverted && (
                  <p style={{ margin: '1rem 0 0', color: 'var(--gold)', fontSize: '0.9rem' }}>
                    ⚠ Hazard avoidance diverted the landing site by {f0(result.hdaDivertDistanceM)} m
                    after the terrain scan flagged the nominal target.
                  </p>
                )}
                {result.hdaNoSafeSite && (
                  <p style={{ margin: '1rem 0 0', color: 'var(--red)', fontSize: '0.9rem' }}>
                    ⚠ No safe site found inside the divert envelope — the vehicle held the nominal target.
                  </p>
                )}
              </div>
            )}

            <p style={{ marginTop: '1.5rem', color: 'var(--faint)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Testing page — telemetry above is generated by the SELENE flight software
              (C++17, compiled to WebAssembly with Emscripten) flying a closed-loop 3-DOF
              descent at 50 Hz: mission state machine, descent guidance, three PID loops,
              thrust allocation, a vertical navigation Kalman filter fed by noisy sensor
              models, and hazard detection &amp; avoidance. The 3-D scene (Three.js) and the
              dashboard are pure renderers of that data — no physics runs in JavaScript.
              Open the browser console to see the raw altitude stream.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
