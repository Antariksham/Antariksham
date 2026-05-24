'use client'

import { useState, useEffect, useCallback } from 'react'
import Link                                  from 'next/link'
import type { DeepSpaceProbe }               from '@/types/api'

interface Props {
  initialProbes: DeepSpaceProbe[]
  updatedAt:     string
}

// ── Helpers ────────────────────────────────────────────────────

function formatAU(au: number): string {
  return au.toFixed(au < 1 ? 3 : 1)
}

function formatKm(au: number): string {
  const km = au * 149_597_870.7
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toFixed(2)}B km`
  if (km >= 1_000_000)     return `${(km / 1_000_000).toFixed(1)}M km`
  return `${Math.round(km).toLocaleString()} km`
}

function formatSignalDelay(hours: number): string {
  if (hours < 1 / 60) return `${Math.round(hours * 3600)}s`
  if (hours < 1)      return `${Math.round(hours * 60)} min`
  return `${hours.toFixed(1)} hrs`
}

function formatVelocity(kms: number): string {
  if (kms >= 1000) return `${(kms / 1000).toFixed(1)}k km/s`
  return `${kms.toFixed(1)} km/s`
}

function missionAge(launchDate: string): string {
  const launch = new Date(launchDate)
  const now    = new Date()
  const years  = (now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  if (years < 1) return `${Math.round(years * 12)} months`
  return `${years.toFixed(1)} years`
}

function statusColor(status: DeepSpaceProbe['communicationStatus']): string {
  switch (status) {
    case 'nominal':  return '#34d897'
    case 'degraded': return '#c9a96e'
    case 'lost':     return '#f05a5a'
  }
}

function probeColor(id: string): string {
  switch (id) {
    case 'voyager-1':          return '#b48cff'
    case 'voyager-2':          return '#3b9eff'
    case 'parker-solar-probe': return '#ff6b6b'
    case 'europa-clipper':     return '#34d897'
    case 'lucy':               return '#c9a96e'
    default:                   return '#3b9eff'
  }
}

function probeIcon(id: string): string {
  switch (id) {
    case 'voyager-1':
    case 'voyager-2':          return '🛸'
    case 'parker-solar-probe': return '☀️'
    case 'europa-clipper':     return '🪐'
    case 'lucy':               return '🌌'
    default:                   return '🛰️'
  }
}

const MAX_DISTANCE_AU = 170

// ── Scale diagram ──────────────────────────────────────────────

function SolarSystemScale({ probes }: { probes: DeepSpaceProbe[] }) {
  return (
    <div style={{
      background:   '#10151c',
      border:       '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding:      '28px 32px',
      marginBottom: '36px',
    }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '11px',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color:         '#b48cff',
        display:       'block',
        marginBottom:  '6px',
      }}>
        Scale Overview
      </span>
      <h3 style={{
        fontFamily:   'var(--font-serif)',
        fontSize:     '20px',
        fontWeight:   400,
        color:        '#ffffff',
        margin:       '0 0 28px',
      }}>
        Probe Positions Relative to the Sun
      </h3>

      {/* Scale bar — logarithmic so inner + outer probes are all visible */}
      <div style={{ position: 'relative', height: '100px' }}>
        {/* Track */}
        <div style={{
          position:     'absolute',
          top:          '40px',
          left:         '24px',
          right:        '24px',
          height:       '2px',
          background:   'rgba(255,255,255,0.1)',
          borderRadius: '1px',
        }} />

        {/* AU tick labels */}
        {([0.1, 1, 10, 100] as number[]).map(au => {
          const logMin = Math.log10(0.04)
          const logMax = Math.log10(170)
          const pct    = ((Math.log10(au) - logMin) / (logMax - logMin)) * 100
          if (pct < 0 || pct > 100) return null
          return (
            <div key={au} style={{
              position:  'absolute',
              left:      `calc(24px + ${pct}%)`,
              top:       '42px',
              transform: 'translateX(-50%)',
            }}>
              <div style={{ width: '1px', height: '8px', background: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(240,244,250,0.35)', whiteSpace: 'nowrap', display: 'block', marginTop: '2px', textAlign: 'center' }}>
                {au} AU
              </span>
            </div>
          )
        })}

        {/* Sun */}
        <div style={{
          position:     'absolute',
          left:         '24px',
          top:          '31px',
          width:        '18px',
          height:       '18px',
          borderRadius: '50%',
          background:   '#f5c518',
          boxShadow:    '0 0 16px #f5c51899',
          transform:    'translateX(-50%)',
          zIndex:       2,
        }} />

        {/* Probe markers — log scale */}
        {probes.map(probe => {
          const logMin = Math.log10(0.04)
          const logMax = Math.log10(170)
          const logVal = Math.log10(Math.max(probe.distanceFromSun, 0.04))
          const pct    = Math.min(((logVal - logMin) / (logMax - logMin)) * 100, 97)
          const color  = probeColor(probe.id)
          return (
            <div
              key={probe.id}
              style={{
                position:      'absolute',
                left:          `calc(24px + ${pct}%)`,
                top:           0,
                transform:     'translateX(-50%)',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '2px',
                zIndex:        3,
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{probeIcon(probe.id)}</span>
              <div style={{
                width:        '10px',
                height:       '10px',
                borderRadius: '50%',
                background:   color,
                boxShadow:    `0 0 8px ${color}`,
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   '10px',
                color:      color,
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}>
                {formatAU(probe.distanceFromSun)} AU
              </span>
            </div>
          )
        })}
      </div>

      {/* Log scale note */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.06em' }}>
          Logarithmic scale · 0.04 AU → 170 AU
        </span>
      </div>

      {/* Legend */}
      <div style={{
        display:    'flex',
        gap:        '20px',
        flexWrap:   'wrap',
        paddingTop: '16px',
        borderTop:  '1px solid rgba(255,255,255,0.07)',
      }}>
        {probes.map(probe => (
          <div key={probe.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>{probeIcon(probe.id)}</span>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '12px',
              color:         probeColor(probe.id),
              fontWeight:    500,
              letterSpacing: '0.04em',
            }}>
              {probe.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Telemetry item ─────────────────────────────────────────────

function TelemetryItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '11px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color:         'rgba(240,244,250,0.55)',
        marginBottom:  '5px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '18px',
        fontWeight:    600,
        color:         '#ffffff',
        letterSpacing: '0.02em',
        lineHeight:    1,
        marginBottom:  '4px',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '12px',
          color:         'rgba(240,244,250,0.6)',
          letterSpacing: '0.04em',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Probe card ─────────────────────────────────────────────────

function ProbeCard({ probe }: { probe: DeepSpaceProbe }) {
  const color  = probeColor(probe.id)
  const sColor = statusColor(probe.communicationStatus)
  const pct    = Math.min((probe.distanceFromSun / MAX_DISTANCE_AU) * 100, 100)

  return (
    <Link
      href={`/live/deep-space/${probe.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background:   '#10151c',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow:     'hidden',
          cursor:       'pointer',
          transition:   'border-color 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = color
          e.currentTarget.style.transform   = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform   = 'translateY(0)'
        }}
      >
        {/* Color accent bar */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${color}, transparent 70%)` }} />

        <div style={{ padding: '24px 26px 26px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{probeIcon(probe.id)}</span>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize:   '22px',
                  fontWeight: 400,
                  color:      '#ffffff',
                  margin:     '0 0 4px',
                  lineHeight: 1.1,
                }}>
                  {probe.name}
                </h3>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color:         color,
                  fontWeight:    600,
                }}>
                  {probe.agency}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '6px 10px',
              borderRadius: '6px',
              background:   `${sColor}18`,
              border:       `1px solid ${sColor}45`,
              flexShrink:   0,
            }}>
              <span style={{
                width:        '7px',
                height:       '7px',
                borderRadius: '50%',
                background:   sColor,
                display:      'block',
                boxShadow:    `0 0 8px ${sColor}`,
                animation:    'blink 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color:         sColor,
                fontWeight:    600,
              }}>
                {probe.communicationStatus}
              </span>
            </div>
          </div>

          {/* Phase tags — single pill, no wrap */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         'rgba(240,244,250,0.7)',
              background:    'rgba(255,255,255,0.07)',
              border:        '1px solid rgba(255,255,255,0.12)',
              padding:       '5px 12px',
              borderRadius:  '4px',
              display:       'inline-block',
              whiteSpace:    'nowrap',
            }}>
              {probe.missionPhase}{probe.targetBody ? ` · ${probe.targetBody}` : ''}
            </span>
          </div>

          {/* Telemetry grid */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap:                 '20px 16px',
            padding:             '20px',
            background:          'rgba(255,255,255,0.04)',
            borderRadius:        '10px',
            border:              '1px solid rgba(255,255,255,0.08)',
            marginBottom:        '20px',
          }}>
            <TelemetryItem
              label="From Earth"
              value={`${formatAU(probe.distanceFromEarth)} AU`}
              sub={formatKm(probe.distanceFromEarth)}
            />
            <TelemetryItem
              label="From Sun"
              value={`${formatAU(probe.distanceFromSun)} AU`}
              sub={formatKm(probe.distanceFromSun)}
            />
            <TelemetryItem
              label="Velocity"
              value={formatVelocity(probe.velocity)}
              sub="heliocentric"
            />
            <TelemetryItem
              label="Signal Delay"
              value={formatSignalDelay(probe.signalDelay)}
              sub="one-way"
            />
          </div>

          {/* Distance bar */}
          <div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height:       '100%',
                width:        `${pct}%`,
                background:   `linear-gradient(90deg, ${color}66, ${color})`,
                borderRadius: '3px',
                transition:   'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.45)' }}>
                ☀ Sun
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.45)' }}>
                {MAX_DISTANCE_AU} AU
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginTop:      '18px',
            paddingTop:     '14px',
            borderTop:      '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   '12px',
              color:      'rgba(240,244,250,0.5)',
            }}>
              Launched {missionAge(probe.launchDate)} ago
            </span>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '12px',
              color:         color,
              letterSpacing: '0.08em',
            }}>
              View Details →
            </span>
          </div>

        </div>
      </div>
    </Link>
  )
}

// ── Main component ─────────────────────────────────────────────

export function DeepSpaceTracker({ initialProbes, updatedAt }: Props) {
  const [probes,      setProbes]      = useState<DeepSpaceProbe[]>(initialProbes)
  const [lastUpdated, setLastUpdated] = useState(updatedAt)
  const [refreshing,  setRefreshing]  = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res  = await fetch('/api/deep-space', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setProbes(data.probes)
      setLastUpdated(data.updatedAt)
    } catch {
      // fail silently — keep showing last data
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            width:        '9px',
            height:       '9px',
            borderRadius: '50%',
            background:   '#b48cff',
            boxShadow:    '0 0 12px #b48cff88',
            display:      'inline-block',
          }} />
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '12px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color:         '#b48cff',
            fontWeight:    600,
          }}>
            Live Telemetry
          </span>
        </div>

        <h1 style={{
          fontFamily:    'var(--font-serif)',
          fontSize:      'clamp(36px, 5vw, 60px)',
          fontWeight:    300,
          color:         '#ffffff',
          margin:        '0 0 16px',
          letterSpacing: '-0.01em',
          lineHeight:    1.1,
        }}>
          Deep Space Tracker
        </h1>

        <p style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    '17px',
          color:       'rgba(240,244,250,0.75)',
          margin:      '0 0 24px',
          maxWidth:    '580px',
          lineHeight:  1.7,
        }}>
          Live telemetry for humanity's most distant emissaries — position, velocity,
          and signal delay sourced from NASA Horizons System.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '12px',
            color:         'rgba(240,244,250,0.5)',
            letterSpacing: '0.06em',
          }}>
            Updated {new Date(lastUpdated).toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour:  '2-digit', minute: '2-digit',
            })}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color:         refreshing ? 'rgba(240,244,250,0.3)' : '#b48cff',
              background:    'transparent',
              border:        '1px solid rgba(180,140,255,0.35)',
              borderRadius:  '6px',
              padding:       '6px 16px',
              cursor:        refreshing ? 'not-allowed' : 'pointer',
              fontWeight:    600,
            }}
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Scale diagram */}
      <SolarSystemScale probes={probes} />

      {/* Cards */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap:                 '20px',
      }}>
        {probes.map(probe => (
          <ProbeCard key={probe.id} probe={probe} />
        ))}
      </div>

      {/* Source note */}
      <div style={{
        marginTop:    '48px',
        padding:      '18px 22px',
        background:   'rgba(255,255,255,0.03)',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
      }}>
        <p style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    '12px',
          color:       'rgba(240,244,250,0.5)',
          margin:      0,
          lineHeight:  1.8,
          letterSpacing: '0.04em',
        }}>
          Telemetry sourced from NASA JPL Horizons System. Distances in AU (1 AU = 149,597,870 km).
          Signal delay calculated at speed of light. Data refreshes every hour.
          Positions are heliocentric vector calculations.
        </p>
      </div>

    </div>
  )
}
