'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { DeepSpaceProbe } from '@/types/api'

interface Props {
  initialProbes: DeepSpaceProbe[]
  updatedAt: string
}

const PROBE_COLORS: Record<string, string> = {
  'voyager-1': '#4f8ef7',
  'voyager-2': '#4f8ef7',
  'parker-solar-probe': '#e74c3c',
  'europa-clipper': '#2ecc71',
  'lucy': '#f39c12',
}

const PROBE_ICONS: Record<string, string> = {
  'voyager-1': '🛸',
  'voyager-2': '🛸',
  'parker-solar-probe': '☀️',
  'europa-clipper': '🪐',
  'lucy': '🌌',
}

function getColor(id: string): string {
  return PROBE_COLORS[id] || '#4f8ef7'
}

function getIcon(id: string): string {
  return PROBE_ICONS[id] || '🛰️'
}

function getStatusColor(status: string): string {
  if (status === 'degraded') return '#f39c12'
  if (status === 'lost') return '#e74c3c'
  return '#2ecc71'
}

function fmtAU(au: number): string {
  if (au < 1) return au.toFixed(3)
  return au.toFixed(1)
}

function fmtKm(au: number): string {
  const km = au * 149597870.7
  if (km >= 1000000000) return (km / 1000000000).toFixed(2) + 'B km'
  if (km >= 1000000) return (km / 1000000).toFixed(1) + 'M km'
  return Math.round(km).toString() + ' km'
}

function fmtDelay(hours: number): string {
  if (hours < 0.0167) return Math.round(hours * 3600) + 's'
  if (hours < 1) return Math.round(hours * 60) + ' min'
  return hours.toFixed(1) + ' hrs'
}

function fmtVel(kms: number): string {
  return kms.toFixed(1) + ' km/s'
}

const LOG_MIN = Math.log10(0.04)
const LOG_MAX = Math.log10(170)
const AU_TICKS = [0.1, 1, 10, 100]

function toPct(au: number): number {
  const v = Math.max(au, 0.04)
  const p = ((Math.log10(v) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100
  return Math.max(4, Math.min(p, 96))
}

// ── Scale diagram ──────────────────────────────────────────────

function ScaleDiagram({ probes }: { probes: DeepSpaceProbe[] }) {
  const sorted = [...probes].sort((a, b) => a.distanceFromSun - b.distanceFromSun)

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid rgba(var(--ink),0.12)', borderRadius: '16px', padding: '28px 32px 24px', marginBottom: '36px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: '#4f8ef7', marginBottom: '6px' }}>
        Scale Overview
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', color: '#fff', margin: '0 0 24px' }}>
        Probe Distances from the Sun
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
        {sorted.map(probe => {
          const pct = toPct(probe.distanceFromSun)
          const color = getColor(probe.id)
          return (
            <div key={probe.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '160px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px' }}>{getIcon(probe.id)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {probe.name}
                </span>
              </div>
              <div style={{ flex: 1, position: 'relative' as const, height: '20px', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute' as const, left: 0, right: 0, height: '3px', background: 'rgba(var(--ink),0.07)', borderRadius: '2px' }} />
                <div style={{ position: 'absolute' as const, left: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#f39c12', boxShadow: '0 0 8px #f39c1288', transform: 'translateX(-50%)' }} />
                <div style={{ position: 'absolute' as const, left: 0, width: pct + '%', height: '3px', background: 'linear-gradient(90deg, #f39c1240, ' + color + '90)', borderRadius: '2px' }} />
                <div style={{ position: 'absolute' as const, left: pct + '%', width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: '0 0 8px ' + color, transform: 'translateX(-50%)', zIndex: 2 }} />
              </div>
              <div style={{ width: '90px', flexShrink: 0, textAlign: 'right' as const }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff', fontWeight: 700 }}>{fmtAU(probe.distanceFromSun)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', marginLeft: '4px' }}>AU</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginLeft: '172px', marginRight: '94px', position: 'relative' as const, height: '18px', marginBottom: '4px' }}>
        {AU_TICKS.map(au => {
          const p = toPct(au)
          return (
            <div key={au} style={{ position: 'absolute' as const, left: p + '%', top: 0, transform: 'translateX(-50%)', textAlign: 'center' as const }}>
              <div style={{ width: '1px', height: '6px', background: 'rgba(var(--ink),0.15)', margin: '0 auto 2px' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(var(--ink),0.35)', whiteSpace: 'nowrap' as const }}>{au} AU</span>
            </div>
          )
        })}
      </div>
      <div style={{ marginLeft: '172px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(var(--ink),0.28)' }}>
        Logarithmic scale
      </div>
    </div>
  )
}

// ── Probe card ─────────────────────────────────────────────────

function ProbeCard({ probe }: { probe: DeepSpaceProbe }) {
  const color = getColor(probe.id)
  const sColor = getStatusColor(probe.communicationStatus)
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={'/live/deep-space/' + probe.id} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--panel)',
          border: '1px solid ' + (hovered ? color : 'rgba(var(--ink),0.1)'),
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'border-color 0.2s, transform 0.15s',
        }}
      >
        <div style={{ height: '3px', background: 'linear-gradient(90deg, ' + color + ', transparent 70%)' }} />
        <div style={{ padding: '24px 26px 26px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px', lineHeight: '1' }}>{getIcon(probe.id)}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 400, color: '#fff', marginBottom: '4px', lineHeight: '1.1' }}>{probe.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color, fontWeight: 600 }}>{probe.agency}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: sColor + '18', border: '1px solid ' + sColor + '45', flexShrink: 0 }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sColor, boxShadow: '0 0 8px ' + sColor }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: sColor, fontWeight: 600 }}>{probe.communicationStatus}</span>
            </div>
          </div>

          {/* Phase tag */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(var(--ink),0.7)', background: 'rgba(var(--ink),0.07)', border: '1px solid rgba(var(--ink),0.12)', padding: '5px 12px', borderRadius: '4px', display: 'inline-block', whiteSpace: 'nowrap' as const }}>
              {probe.missionPhase}{probe.targetBody ? ' · ' + probe.targetBody : ''}
            </span>
          </div>

          {/* Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', padding: '20px', background: 'rgba(var(--ink),0.04)', borderRadius: '10px', border: '1px solid rgba(var(--ink),0.08)', marginBottom: '20px' }}>
            {[
              { label: 'From Earth', value: fmtAU(probe.distanceFromEarth) + ' AU', sub: fmtKm(probe.distanceFromEarth) },
              { label: 'From Sun',   value: fmtAU(probe.distanceFromSun) + ' AU',   sub: fmtKm(probe.distanceFromSun) },
              { label: 'Velocity',   value: fmtVel(probe.velocity),                  sub: 'heliocentric' },
              { label: 'Signal',     value: fmtDelay(probe.signalDelay),             sub: 'one-way' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(var(--ink),0.55)', marginBottom: '5px' }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: '#fff', lineHeight: '1', marginBottom: '4px' }}>{item.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)' }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar */}
          <div>
            <div style={{ height: '5px', background: 'rgba(var(--ink),0.07)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.min((probe.distanceFromSun / 170) * 100, 100) + '%', background: 'linear-gradient(90deg, ' + color + '66, ' + color + ')', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.45)' }}>☀ Sun</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.45)' }}>170 AU</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(var(--ink),0.07)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.5)' }}>
              Launched {new Date(probe.launchDate).getFullYear()}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color, letterSpacing: '0.08em' }}>View Details →</span>
          </div>

        </div>
      </div>
    </Link>
  )
}

// ── Main ───────────────────────────────────────────────────────

// Minimum valid distances per probe (outside component to avoid stale closure)
const MIN_DISTANCE: Record<string, number> = {
  'voyager-1': 100, 'voyager-2': 80,
  'parker-solar-probe': 0.01, 'europa-clipper': 1, 'lucy': 1,
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (_e) {
    return iso
  }
}

export function DeepSpaceTracker({ initialProbes, updatedAt }: Props) {
  const [probes, setProbes] = useState<DeepSpaceProbe[]>(initialProbes)
  const [refreshing, setRefreshing] = useState(false)
  const [displayDate, setDisplayDate] = useState('')

  // useRef holds the fetch logic so the interval always calls the latest version
  // This avoids stale closure problems with useCallback + setInterval
  const fetchRef = useRef<() => Promise<void>>(async () => {})

  fetchRef.current = async () => {
    setRefreshing(true)
    setDisplayDate(formatDate(new Date().toISOString()))
    try {
      const res = await fetch('/api/deep-space?t=' + Date.now(), { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.probes) && data.probes.length > 0) {
        setProbes(prev => data.probes.map((p: Record<string, unknown>) => {
          const id  = String(p.id || '')
          const dst = Number(p.distanceFromSun)
          const min = MIN_DISTANCE[id] ?? 0.001
          const existing = prev.find(x => x.id === id)
          if (dst < min && existing) return existing
          return {
            id,
            name:                String(p.name || ''),
            agency:              String(p.agency || 'NASA'),
            launchDate:          String(p.launchDate || '1977-01-01'),
            distanceFromEarth:   dst > 0 ? Number(p.distanceFromEarth) : (existing?.distanceFromEarth ?? 0),
            distanceFromSun:     dst > 0 ? dst                         : (existing?.distanceFromSun    ?? 0),
            velocity:            Number(p.velocity)    > 0 ? Number(p.velocity)    : (existing?.velocity    ?? 0),
            signalDelay:         Number(p.signalDelay) > 0 ? Number(p.signalDelay) : (existing?.signalDelay ?? 0),
            missionPhase:        String(p.missionPhase || existing?.missionPhase || ''),
            targetBody:          String(p.targetBody   || existing?.targetBody   || ''),
            communicationStatus: (['nominal','degraded','lost'].includes(String(p.communicationStatus))
              ? String(p.communicationStatus)
              : 'nominal') as 'nominal' | 'degraded' | 'lost',
            lastUpdated:         String(p.lastUpdated || new Date().toISOString()),
          }
        }))
      }
      setDisplayDate(formatDate(new Date().toISOString()))
    } catch (_e) {
      // fail silently — keep showing last data
    } finally {
      setRefreshing(false)
    }
  }

  // Stable refresh function for button — always calls latest fetchRef
  const refresh = () => { fetchRef.current() }

  // Auto-refresh: fire once on mount after 800ms, then every 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => fetchRef.current(), 800)
    const id    = setInterval(() => fetchRef.current(), 5 * 60 * 1000)
    return () => { clearTimeout(timer); clearInterval(id) }
  }, [])  // empty deps — interval never re-registers, always calls latest via ref

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 80px' }}>

      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#4f8ef7', boxShadow: '0 0 12px #4f8ef788', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: '#4f8ef7', fontWeight: 600 }}>Live Telemetry</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 300, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.01em', lineHeight: '1.1' }}>
          Deep Space Tracker
        </h1>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', color: 'rgba(var(--ink),0.9)', margin: '0 0 24px', maxWidth: '580px', lineHeight: '1.7' }}>
          Live telemetry for humanity's most distant emissaries — position, velocity, and signal delay sourced from NASA Horizons System.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.5)', letterSpacing: '0.06em' }}>
            {displayDate ? 'Data from ' + displayDate : 'Static data · click Refresh for live'}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: refreshing ? 'rgba(var(--ink),0.3)' : '#4f8ef7', background: 'transparent', border: '1px solid rgba(180,140,255,0.35)', borderRadius: '6px', padding: '6px 16px', cursor: refreshing ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <ScaleDiagram probes={probes} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {probes.map(probe => <ProbeCard key={probe.id} probe={probe} />)}
      </div>

      <div style={{ marginTop: '48px', padding: '18px 22px', background: 'rgba(var(--ink),0.03)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '10px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.5)', margin: 0, lineHeight: '1.8', letterSpacing: '0.04em' }}>
          Telemetry sourced from NASA JPL Horizons System. Distances in AU (1 AU = 149,597,870 km). Signal delay at speed of light. Data refreshes every hour.
        </p>
      </div>

    </div>
  )
}
