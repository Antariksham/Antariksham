'use client'

import { useState, useEffect, useCallback } from 'react'
import Link                                  from 'next/link'
import type { DeepSpaceProbe }               from '@/types/api'

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

interface Props {
  probe:     DeepSpaceProbe
  allProbes: DeepSpaceProbe[]
  updatedAt: string
}

// ── Helpers ────────────────────────────────────────────────────

function formatAU(au: number): string {
  return au.toFixed(au < 1 ? 4 : 2)
}

function formatKm(au: number): string {
  const km = au * 149_597_870.7
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toFixed(3)}B km`
  if (km >= 1_000_000)     return `${(km / 1_000_000).toFixed(2)}M km`
  return `${Math.round(km).toLocaleString()} km`
}

function formatKmPerSec(kms: number): string {
  return `${kms.toFixed(1)} km/s`
}

function formatKmPerHour(kms: number): string {
  return `${Math.round(kms * 3600).toLocaleString()} km/h`
}

function formatSignalDelay(hours: number): string {
  if (hours < 1 / 60) return `${Math.round(hours * 3600)} seconds`
  if (hours < 1)      return `${Math.round(hours * 60)} minutes`
  return `${hours.toFixed(2)} hours`
}

function missionAge(launchDate: string): string {
  const launch = new Date(launchDate)
  const now    = new Date()
  const ms     = now.getTime() - launch.getTime()
  const years  = ms / (1000 * 60 * 60 * 24 * 365.25)
  const days   = Math.floor(ms / (1000 * 60 * 60 * 24))
  return `${years.toFixed(1)} years (${days.toLocaleString()} days)`
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

// Static mission facts per probe
const PROBE_FACTS: Record<string, {
  description:  string
  keyFacts:     { label: string; value: string }[]
  achievements: string[]
  instruments:  string[]
}> = {
  'voyager-1': {
    description: 'Voyager 1 is the most distant human-made object in existence, currently traveling through interstellar space beyond the heliosphere. Launched in 1977, it completed flybys of Jupiter and Saturn before continuing outward on its historic journey.',
    keyFacts: [
      { label: 'Launch Vehicle',  value: 'Titan IIIE/Centaur' },
      { label: 'Launch Mass',     value: '721.9 kg' },
      { label: 'Power Source',    value: 'RTG (Radioisotope Thermoelectric Generator)' },
      { label: 'Heliopause Cross',value: 'August 2012' },
      { label: 'Furthest Object', value: 'Yes — all time record' },
      { label: 'Data Rate',       value: '~160 bits/second' },
    ],
    achievements: [
      'First spacecraft to enter interstellar space (2012)',
      'Detailed images of Jupiter\'s Great Red Spot and moons',
      'Discovered active volcanoes on Io (Jupiter\'s moon)',
      'Detailed study of Saturn\'s rings and moon Titan',
      'Took the iconic "Pale Blue Dot" photograph (1990)',
      'Still transmitting data after 46+ years',
    ],
    instruments: [
      'Low-Energy Charged Particle Instrument',
      'Plasma Wave System',
      'Magnetometer',
      'Cosmic Ray Subsystem',
      'Plasma Science Experiment',
    ],
  },
  'voyager-2': {
    description: 'Voyager 2 is the only spacecraft to have visited all four outer planets — Jupiter, Saturn, Uranus, and Neptune. It remains the only probe to have flown past Uranus and Neptune, and is now the second human-made object to reach interstellar space.',
    keyFacts: [
      { label: 'Launch Vehicle',   value: 'Titan IIIE/Centaur' },
      { label: 'Launch Mass',      value: '721.9 kg' },
      { label: 'Power Source',     value: 'RTG (Radioisotope Thermoelectric Generator)' },
      { label: 'Heliopause Cross', value: 'November 2018' },
      { label: 'Unique Record',    value: 'Only craft to visit Uranus & Neptune' },
      { label: 'Data Rate',        value: ''  },
    ],
    achievements: [
      'Only spacecraft to fly by all four outer planets',
      'Discovered 10 new moons of Uranus',
      'Discovered 5 new moons of Neptune',
      'Confirmed Triton\'s geysers and thin atmosphere',
      'Entered interstellar space in 2018',
      'Providing unique measurements from southern heliosphere',
    ],
    instruments: [
      'Plasma Science Experiment',
      'Cosmic Ray Subsystem',
      'Magnetometer',
      'Ultraviolet Spectrometer',
      'Photopolarimeter System',
    ],
  },
  'parker-solar-probe': {
    description: 'Parker Solar Probe is the fastest human-made object ever built and the closest spacecraft to the Sun. It is designed to study the Sun\'s outer corona, solve the mystery of why the corona is hotter than the surface, and understand how the solar wind is accelerated.',
    keyFacts: [
      { label: 'Launch Vehicle',  value: 'Delta IV Heavy' },
      { label: 'Launch Mass',     value: '685 kg' },
      { label: 'Closest Approach', value: '6.16 million km from Sun' },
      { label: 'Peak Speed',      value: '~692,000 km/h' },
      { label: 'Heat Shield',     value: '11.4 cm carbon composite, 1,400°C' },
      { label: 'Total Orbits',    value: '24 planned' },
    ],
    achievements: [
      'Fastest human-made object in history',
      'First spacecraft to fly through the Sun\'s corona',
      'Discovered "switchbacks" in the solar wind',
      'Traced the source of slow solar wind',
      'First images of Venus\'s surface in visible light (through clouds)',
      'Broke its own speed record multiple times',
    ],
    instruments: [
      'FIELDS — Electric/magnetic field measurements',
      'SWEAP — Solar wind particle analyzer',
      'IS☉IS — Energetic particle detector',
      'WISPR — Wide-field imager for corona',
    ],
  },
  'europa-clipper': {
    description: 'Europa Clipper is NASA\'s flagship mission to study Europa, one of Jupiter\'s largest moons, which is believed to harbor a vast liquid water ocean beneath its icy crust. The mission will determine whether Europa has conditions suitable for life.',
    keyFacts: [
      { label: 'Launch Vehicle',    value: 'SpaceX Falcon Heavy' },
      { label: 'Spacecraft Mass',   value: '6,065 kg (fully fueled)' },
      { label: 'Power Source',      value: 'Two 46.3-meter solar arrays' },
      { label: 'Jupiter Arrival',   value: '2030' },
      { label: 'Europa Flybys',     value: '49 planned' },
      { label: 'Mission Duration',  value: '~4 years in Jovian system' },
    ],
    achievements: [
      'NASA\'s largest planetary spacecraft ever built',
      'Carries 9 science instruments',
      'Will map Europa\'s surface in unprecedented detail',
      'Will measure ice shell thickness via radar',
      'Will search for plumes of water vapor',
      'Will assess habitability potential of Europa\'s ocean',
    ],
    instruments: [
      'E-THEMIS — Thermal imaging',
      'EIS — Wide and narrow angle cameras',
      'MASPEX — Mass spectrometer',
      'MISE — Infrared spectrograph',
      'REASON — Ice-penetrating radar',
      'UVS — Ultraviolet spectrograph',
    ],
  },
  'lucy': {
    description: 'Lucy is the first spacecraft to explore the Trojan asteroids — ancient remnants of the early solar system that share Jupiter\'s orbit. Named after the famous fossil that reshaped understanding of human evolution, Lucy aims to similarly transform understanding of planetary origins.',
    keyFacts: [
      { label: 'Launch Vehicle',   value: 'Atlas V 401' },
      { label: 'Spacecraft Mass',  value: '1,550 kg' },
      { label: 'Power Source',     value: 'Two 7.3-meter solar arrays' },
      { label: 'Mission Duration', value: '12 years' },
      { label: 'Asteroid Targets', value: '8 Trojan asteroids + 1 main belt' },
      { label: 'First Flyby',      value: '2025 — Dinkinesh asteroid' },
    ],
    achievements: [
      'First mission to Jupiter\'s Trojan asteroids',
      'Successfully flew by Dinkinesh asteroid (Nov 2023)',
      'Discovered Dinkinesh has a contact binary satellite — Selam',
      'Will visit more asteroids than any previous mission',
      'Carries a message plaque to future generations',
      'Will return to Earth for gravity assists twice',
    ],
    instruments: [
      'L\'Ralph — Visible/infrared spectrograph',
      'L\'LORRI — Long-range reconnaissance imager',
      'L\'TES — Thermal emission spectrometer',
      'TTCam — Terminal tracking camera',
    ],
  },
}

// ── Signal pulse visualizer ────────────────────────────────────

function SignalVisualizer({ delayHours, color }: { delayHours: number; color: string }) {
  const delayMs = Math.min(delayHours * 1000, 4000) // cap animation at 4s

  return (
    <div style={{
      padding:      '20px',
      background:   'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      border:       '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '11px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color:         'rgba(240,244,250,0.55)',
        marginBottom:  '12px',
      }}>
        Signal Journey — Earth ↔ Probe
      </div>

      {/* Visual track */}
      <div style={{ position: 'relative', height: '32px', marginBottom: '12px' }}>
        <div style={{
          position:   'absolute',
          top:        '15px',
          left:       0,
          right:      0,
          height:     '2px',
          background: 'rgba(255,255,255,0.08)',
        }} />
        {/* Earth */}
        <div style={{
          position:     'absolute',
          left:         0,
          top:          '8px',
          width:        '16px',
          height:       '16px',
          borderRadius: '50%',
          background:   '#3b9eff',
          boxShadow:    '0 0 10px #3b9eff88',
        }} />
        {/* Probe */}
        <div style={{
          position:     'absolute',
          right:        0,
          top:          '8px',
          fontSize:     '16px',
          lineHeight:   1,
        }}>
          {probeIcon('voyager-1')}
        </div>
        {/* Animated signal dot */}
        <div style={{
          position:     'absolute',
          top:          '11px',
          left:         '8px',
          width:        '10px',
          height:       '10px',
          borderRadius: '50%',
          background:   color,
          boxShadow:    `0 0 8px ${color}`,
          animation:    `signalTravel ${delayMs}ms linear infinite`,
        }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   '14px',
        color:      '#ffffff',
        fontWeight: 600,
      }}>
        {formatSignalDelay(delayHours)}
        <span style={{ fontWeight: 400, fontSize: '12px', color: 'rgba(240,244,250,0.55)', marginLeft: '8px' }}>
          one-way at speed of light
        </span>
      </div>

      <style>{`
        @keyframes signalTravel {
          0%   { left: 8px;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { left: calc(100% - 24px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Main detail page ───────────────────────────────────────────

export function ProbeDetailPage({ probe, allProbes, updatedAt }: Props) {
  const [currentProbe,  setCurrentProbe]  = useState<DeepSpaceProbe>(probe)
  const [lastUpdated,   setLastUpdated]   = useState(updatedAt)
  const [refreshing,    setRefreshing]    = useState(false)
  const mounted = useMounted()

  const color  = probeColor(probe.id)
  const sColor = statusColor(currentProbe.communicationStatus)
  const facts  = PROBE_FACTS[probe.id]
  const otherProbes = allProbes.filter(p => p.id !== probe.id)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res  = await fetch('/api/deep-space', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const updated = data.probes.find((p: DeepSpaceProbe) => p.id === probe.id)
      if (updated) setCurrentProbe(updated)
      setLastUpdated(data.updatedAt)
    } catch (_e) {
      // fail silently
    } finally {
      setRefreshing(false)
    }
  }, [probe.id])

  useEffect(() => {
    const id = setInterval(refresh, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <Link href="/live" style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '12px',
          color:         'rgba(240,244,250,0.5)',
          textDecoration:'none',
          letterSpacing: '0.06em',
        }}>
          Live
        </Link>
        <span style={{ color: 'rgba(240,244,250,0.3)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>→</span>
        <Link href="/live/deep-space" style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '12px',
          color:         'rgba(240,244,250,0.5)',
          textDecoration:'none',
          letterSpacing: '0.06em',
        }}>
          Deep Space
        </Link>
        <span style={{ color: 'rgba(240,244,250,0.3)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>→</span>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '12px',
          color:         color,
          letterSpacing: '0.06em',
        }}>
          {currentProbe.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '32px', alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div>

          {/* Probe hero */}
          <div style={{
            background:   '#10151c',
            border:       `1px solid ${color}40`,
            borderRadius: '16px',
            overflow:     'hidden',
            marginBottom: '24px',
          }}>
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${color}, transparent 70%)` }} />

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '48px', lineHeight: 1 }}>{probeIcon(probe.id)}</span>
                  <div>
                    <h1 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize:   'clamp(28px, 4vw, 42px)',
                      fontWeight: 300,
                      color:      '#ffffff',
                      margin:     '0 0 6px',
                      lineHeight: 1.1,
                    }}>
                      {currentProbe.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      '12px',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color:         color,
                        fontWeight:    600,
                      }}>
                        {currentProbe.agency}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      '12px',
                        color:         'rgba(240,244,250,0.5)',
                        letterSpacing: '0.08em',
                      }}>
                        {mounted ? `Launched ${new Date(currentProbe.launchDate).getFullYear()}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '8px',
                  padding:      '8px 14px',
                  borderRadius: '8px',
                  background:   `${sColor}18`,
                  border:       `1px solid ${sColor}45`,
                }}>
                  <span style={{
                    width:        '8px',
                    height:       '8px',
                    borderRadius: '50%',
                    background:   sColor,
                    display:      'block',
                    boxShadow:    `0 0 10px ${sColor}`,
                    animation:    'blink 2s ease-in-out infinite',
                    flexShrink:   0,
                  }} />
                  <span style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      '12px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color:         sColor,
                    fontWeight:    600,
                  }}>
                    {currentProbe.communicationStatus}
                  </span>
                </div>
              </div>

              {/* Description */}
              {facts && (
                <p style={{
                  fontFamily:  'var(--font-sans)',
                  fontSize:    '16px',
                  color:       'rgba(240,244,250,0.8)',
                  lineHeight:  1.8,
                  margin:      '0 0 24px',
                }}>
                  {facts.description}
                </p>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '12px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'rgba(240,244,250,0.7)',
                  background:    'rgba(255,255,255,0.07)',
                  border:        '1px solid rgba(255,255,255,0.12)',
                  padding:       '5px 12px',
                  borderRadius:  '5px',
                }}>
                  {currentProbe.missionPhase}
                </span>
                {currentProbe.targetBody && (
                  <span style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      '12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color:         'rgba(240,244,250,0.7)',
                    background:    'rgba(255,255,255,0.07)',
                    border:        '1px solid rgba(255,255,255,0.12)',
                    padding:       '5px 12px',
                    borderRadius:  '5px',
                  }}>
                    Target: {currentProbe.targetBody}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live telemetry block */}
          <div style={{
            background:   '#10151c',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding:      '28px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '11px',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color:         color,
                  display:       'block',
                  marginBottom:  '4px',
                }}>
                  Live Telemetry
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '11px',
                  color:      'rgba(240,244,250,0.45)',
                }}>
                  {mounted ? `Updated ${new Date(lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '—'}
                </span>
              </div>
              <button
                onClick={refresh}
                disabled={refreshing}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '12px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         refreshing ? 'rgba(240,244,250,0.3)' : color,
                  background:    'transparent',
                  border:        `1px solid ${color}40`,
                  borderRadius:  '6px',
                  padding:       '6px 14px',
                  cursor:        refreshing ? 'not-allowed' : 'pointer',
                  fontWeight:    600,
                }}
              >
                {refreshing ? '…' : '↻ Refresh'}
              </button>
            </div>

            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap:                 '24px',
              marginBottom:        '24px',
            }}>
              {/* Distance from Earth */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.55)', marginBottom: '10px' }}>
                  Distance from Earth
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1 }}>
                  {formatAU(currentProbe.distanceFromEarth)}
                  <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '6px', color: 'rgba(240,244,250,0.6)' }}>AU</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: color }}>
                  {formatKm(currentProbe.distanceFromEarth)}
                </div>
              </div>

              {/* Distance from Sun */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.55)', marginBottom: '10px' }}>
                  Distance from Sun
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1 }}>
                  {formatAU(currentProbe.distanceFromSun)}
                  <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '6px', color: 'rgba(240,244,250,0.6)' }}>AU</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#f5c518' }}>
                  {formatKm(currentProbe.distanceFromSun)}
                </div>
              </div>

              {/* Velocity */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.55)', marginBottom: '10px' }}>
                  Velocity
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1 }}>
                  {currentProbe.velocity.toFixed(1)}
                  <span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '6px', color: 'rgba(240,244,250,0.6)' }}>km/s</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(240,244,250,0.6)' }}>
                  {formatKmPerHour(currentProbe.velocity)}
                </div>
              </div>

              {/* Mission age */}
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.55)', marginBottom: '10px' }}>
                  Mission Duration
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                  {mounted ? missionAge(currentProbe.launchDate) : '—'}
                </div>
              </div>
            </div>

            {/* Signal delay visualizer */}
            <SignalVisualizer delayHours={currentProbe.signalDelay} color={color} />
          </div>

          {/* Achievements */}
          {facts && (
            <div style={{
              background:   '#10151c',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding:      '28px',
              marginBottom: '24px',
            }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '11px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         color,
                display:       'block',
                marginBottom:  '18px',
              }}>
                Key Achievements
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {facts.achievements.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: color, fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>✦</span>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize:   '15px',
                      color:      'rgba(240,244,250,0.85)',
                      lineHeight: 1.6,
                    }}>
                      {a}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instruments */}
          {facts && (
            <div style={{
              background:   '#10151c',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding:      '28px',
            }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '11px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         color,
                display:       'block',
                marginBottom:  '18px',
              }}>
                Science Instruments
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {facts.instruments.map((inst, i) => (
                  <div key={i} style={{
                    padding:      '12px 16px',
                    background:   'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    border:       '1px solid rgba(255,255,255,0.07)',
                    fontFamily:   'var(--font-sans)',
                    fontSize:     '15px',
                    color:        'rgba(240,244,250,0.8)',
                  }}>
                    {inst}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mission facts */}
          {facts && (
            <div style={{
              background:   '#10151c',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding:      '22px',
            }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '11px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color:         color,
                display:       'block',
                marginBottom:  '16px',
              }}>
                Mission Facts
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {facts.keyFacts.filter(f => f.value).map((fact, i, arr) => (
                  <div key={i} style={{
                    padding:      '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}>
                    <div style={{
                      fontFamily:    'var(--font-mono)',
                      fontSize:      '10px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color:         'rgba(240,244,250,0.45)',
                      marginBottom:  '4px',
                    }}>
                      {fact.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize:   '14px',
                      color:      '#ffffff',
                      lineHeight: 1.4,
                    }}>
                      {fact.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other probes */}
          <div style={{
            background:   '#10151c',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding:      '22px',
          }}>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color:         'rgba(240,244,250,0.5)',
              display:       'block',
              marginBottom:  '16px',
            }}>
              Other Probes
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {otherProbes.map(p => (
                <Link
                  key={p.id}
                  href={`/live/deep-space/${p.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '10px',
                      padding:      '10px 12px',
                      borderRadius: '8px',
                      background:   'transparent',
                      transition:   'background 0.15s',
                      cursor:       'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{probeIcon(p.id)}</span>
                    <div>
                      <div style={{
                        fontFamily:  'var(--font-sans)',
                        fontSize:    '14px',
                        color:       '#ffffff',
                        fontWeight:  500,
                        marginBottom:'2px',
                      }}>
                        {p.name}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize:   '11px',
                        color:      probeColor(p.id),
                      }}>
                        {formatAU(p.distanceFromSun)} AU from Sun
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Back button */}
          <Link
            href="/live/deep-space"
            style={{
              display:       'block',
              textAlign:     'center',
              fontFamily:    'var(--font-mono)',
              fontSize:      '12px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'rgba(240,244,250,0.6)',
              textDecoration:'none',
              padding:       '12px',
              background:    'rgba(255,255,255,0.04)',
              border:        '1px solid rgba(255,255,255,0.1)',
              borderRadius:  '10px',
              transition:    'background 0.15s',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
          >
            ← Back to Deep Space Tracker
          </Link>

        </div>
      </div>
    </div>
  )
}
