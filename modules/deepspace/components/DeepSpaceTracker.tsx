'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { DeepSpaceProbe } from '@/types/api'

const AU_KM = 149_597_870.7

// ── Per-probe presentation metadata (add a probe → add an entry) ──
// Everything else (distance, velocity, signal, days) is data-driven from the
// live API / SSR fallback, so this map only holds the flavour a data feed
// can't provide. `image` is optional — a generated space panel shows if absent.
interface ProbeMeta {
  emoji:  string
  hue:    number      // cover gradient hue
  blurb:  string
  image?: string
}
const META: Record<string, ProbeMeta> = {
  'voyager-1':          { emoji: '🛰️', hue: 214, blurb: 'The most distant human-made object ever built — now drifting through interstellar space beyond the Sun’s heliosphere.' },
  'voyager-2':          { emoji: '🛰️', hue: 224, blurb: 'The only spacecraft to visit all four giant planets, and the second to reach interstellar space.' },
  'parker-solar-probe': { emoji: '☀️', hue: 28,  blurb: 'The fastest object humans have ever built, diving repeatedly through the Sun’s corona to touch our star.' },
  'europa-clipper':     { emoji: '🪐', hue: 150, blurb: 'En route to Jupiter’s ocean moon Europa to investigate whether it could harbour the conditions for life.' },
  'lucy':               { emoji: '🌌', hue: 265, blurb: 'On a twelve-year tour of the Trojan asteroids — fossils of the early Solar System locked in Jupiter’s orbit.' },
}
function meta(id: string): ProbeMeta {
  return META[id] || { emoji: '🛰️', hue: 210, blurb: 'A robotic emissary exploring the deep Solar System.' }
}

// ── Formatting ────────────────────────────────────────────────
const nf = new Intl.NumberFormat('en-US')
const kmExact   = (km: number) => nf.format(Math.round(km)) + ' km'
const kmBillion = (km: number) => (km / 1e9).toFixed(2)
const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
function fmtDelay(hours: number): string {
  if (hours < 1 / 60) return Math.round(hours * 3600) + ' sec'
  if (hours < 1)      return Math.round(hours * 60) + ' min'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m ? `${h} hr ${m} min` : `${h} hr`
}
function statusColor(s: string) {
  return s === 'lost' ? '#e74c3c' : s === 'degraded' ? '#f39c12' : '#2ecc71'
}

// ── Ticking clock — re-renders every 100ms so the counters climb live ──
function useNow(active: boolean, ms = 100): number {
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [active, ms])
  return now
}

interface Props {
  initialProbes: DeepSpaceProbe[]
  updatedAt: string
}

export function DeepSpaceTracker({ initialProbes }: Props) {
  const [probes, setProbes] = useState(initialProbes)
  const [liveFeed, setLiveFeed] = useState(false)   // true once client live data arrives
  const baseTime = useRef<number>(Date.now())
  const [mounted, setMounted] = useState(false)

  // Live refresh from the API-proxy (real NASA Horizons vectors, cached fallback)
  useEffect(() => {
    setMounted(true)
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/deep-space')
        if (!res.ok) return
        const data = await res.json()
        const next: DeepSpaceProbe[] = Array.isArray(data) ? data : data.probes
        if (alive && Array.isArray(next) && next.length) {
          baseTime.current = Date.now()
          setProbes(next)
          setLiveFeed(true)
        }
      } catch { /* keep current */ }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Hero summary — computed from the probe set
  const farthest = probes.reduce((a, b) => (b.distanceFromSun > a.distanceFromSun ? b : a), probes[0])
  const maxDelay = probes.reduce((m, p) => Math.max(m, p.signalDelay), 0)

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '38vh', display: 'flex', alignItems: 'flex-end', background: '#05060c' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.14) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(120,60,220,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 110%, rgba(20,20,60,0.85) 0%, transparent 70%)' }} />
        <Starfield />
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 2.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#7fb0ff', border: '1px solid rgba(79,142,247,0.35)', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(79,142,247,0.1)', marginBottom: '1rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f8ef7', boxShadow: '0 0 8px #4f8ef7', animation: 'blink 1.4s infinite' }} />
            Live Telemetry · NASA Horizons
          </span>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.02em', lineHeight: 1.08, color: '#ffffff', margin: 0 }}>
            Deep Space <span style={{ color: '#4f8ef7' }}>Mission</span> Tracker
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', marginTop: '1.5rem' }}>
            <HeroStat value={String(probes.length)} label="Active Missions" />
            <HeroStat value={farthest ? `${farthest.distanceFromSun.toFixed(1)} AU` : '—'} label={`Farthest — ${farthest?.name ?? ''}`} />
            <HeroStat value={fmtDelay(maxDelay)} label="Max Signal Delay" />
            <HeroStat value="299,792" label="Speed of Light (km/s)" />
          </div>
        </div>
      </section>

      {/* ── Missions ─────────────────────────────────────── */}
      <main className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
        <div className="section-head" style={{ marginBottom: '1.75rem' }}>
          <div>
            <h2 className="section-title">Spacecraft in Deep Space</h2>
            <span className="section-eyebrow">Distances update live · sourced from NASA Horizons</span>
          </div>
          {liveFeed && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2ecc71', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px #2ecc71', animation: 'blink 1.5s infinite' }} />Live</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {probes.map(p => (
            <MissionCard key={p.id} probe={p} baseTime={baseTime.current} mounted={mounted} />
          ))}
        </div>

        <p style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '720px' }}>
          All communication with deep-space spacecraft travels at the speed of light — 299,792 km per second.
          No matter how powerful the antenna, signals cannot travel faster. A command sent to Voyager&nbsp;1 today
          won’t arrive for nearly a day, and its reply takes just as long to return.
        </p>
      </main>
    </div>
  )
}

// ── Hero stat ─────────────────────────────────────────────────
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
    </div>
  )
}

// ── Mission card (data-driven) ────────────────────────────────
function MissionCard({ probe, baseTime, mounted }: { probe: DeepSpaceProbe; baseTime: number; mounted: boolean }) {
  const m       = meta(probe.id)
  const now     = useNow(mounted)
  const elapsed = mounted && now ? (now - baseTime) / 1000 : 0

  const baseKm  = probe.distanceFromSun * AU_KM
  const liveKm  = baseKm + probe.velocity * elapsed           // ← climbs live
  const kmh     = Math.round(probe.velocity * 3600)
  const days    = daysSince(probe.launchDate)
  const journey = Math.min(100, (Math.log10(Math.max(probe.distanceFromSun, 0.04)) - Math.log10(0.04)) / (Math.log10(180) - Math.log10(0.04)) * 100)
  const sColor  = statusColor(probe.communicationStatus)

  return (
    <article style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="ds-card-inner" style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>

        {/* Visual panel (always dark — it's imagery) */}
        <div style={{ position: 'relative', minHeight: '260px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(150deg, hsl(${m.hue},48%,18%) 0%, hsl(${m.hue},44%,10%) 45%, #05060c 100%)` }}>
          {m.image
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.image} alt={probe.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <>
                <div aria-hidden style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', top: -90, right: -70, background: `radial-gradient(circle, hsla(${m.hue},72%,60%,0.3) 0%, transparent 62%)` }} />
                <div aria-hidden style={{ position: 'absolute', width: 320, height: 90, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(-16deg)' }} />
                <span style={{ fontSize: '64px', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>{m.emoji}</span>
              </>}
          <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '0.3rem 0.7rem', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{probe.agency}</span>
          <span style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '20px', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: sColor, background: 'rgba(0,0,0,0.55)', border: `1px solid ${sColor}` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sColor, animation: 'blink 1.5s infinite' }} />
            {probe.communicationStatus}
          </span>
        </div>

        {/* Data panel */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', minWidth: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'var(--text-primary)' }}>{probe.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '0.3rem' }}>
              {probe.missionPhase} · {probe.targetBody} · Launched {new Date(probe.launchDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* LIVE distance */}
          <div style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(120,60,220,0.05) 100%)', border: '1px solid rgba(79,142,247,0.22)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.35rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'blink 1s infinite' }} />
              Live · Distance from the Sun
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.25rem, 2.6vw, 1.7rem)', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
              {kmExact(liveKm)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              kilometres · travelling at ~{nf.format(kmh)} km/h
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <MStat value={kmBillion(liveKm)} label="Distance (Billion km)" color="var(--accent)" />
            <MStat value={nf.format(days)} label="Days Since Launch" />
            <MStat value={probe.velocity.toFixed(1)} label="Speed (km/s)" color="#2ecc71" />
          </div>

          {/* Signal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📡</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>One-Way Signal Travel Time</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtDelay(probe.signalDelay)}</div>
            </div>
          </div>

          {/* Journey */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>☉ Sun</span><span>Interstellar space →</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${journey}%`, borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), #7b4fe0)', transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0.75rem 0 0' }}>{m.blurb}</p>
          </div>

          <Link href={`/live/deep-space/${probe.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--accent)', textDecoration: 'none' }}>
            Full telemetry →
          </Link>
        </div>
      </div>

      <style>{`@media (max-width: 720px){ .ds-card-inner{ grid-template-columns: 1fr !important; } }`}</style>
    </article>
  )
}

function MStat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 0.9rem', minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.2rem', fontVariantNumeric: 'tabular-nums', color: color || 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

// ── Decorative starfield for the hero ─────────────────────────
function Starfield() {
  const stars = [
    [8, 30], [18, 62], [27, 20], [36, 78], [44, 40], [52, 15],
    [61, 68], [70, 34], [78, 82], [86, 24], [92, 55], [14, 84],
  ]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0 }}>
      {stars.map(([x, y], i) => (
        <span key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', animation: `blink ${2 + (i % 3)}s infinite` }} />
      ))}
    </div>
  )
}
