'use client'

import { useEffect, useState, useRef } from 'react'
import { Navigation, Gauge, MoveVertical, Globe, Satellite, Users } from 'lucide-react'
import { latLngToSVG } from '@/modules/iss/services/getISS'
import type { ISSPosition, ISSCrew } from '@/types/api'

interface Props {
  initialPosition: ISSPosition | null
  crew:            ISSCrew[]
}

const MAP_W     = 1000
const MAP_H     = 500
const MAX_TRAIL = 80

export function ISSTracker({ initialPosition, crew }: Props) {
  const [position, setPosition]     = useState<ISSPosition | null>(initialPosition)
  const [trail, setTrail]           = useState<{ x: number; y: number }[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLive, setIsLive]         = useState(true)
  const [crewList, setCrewList]     = useState<ISSCrew[]>(crew)
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (initialPosition) {
      const pt = latLngToSVG(initialPosition.latitude, initialPosition.longitude, MAP_W, MAP_H)
      setTrail([pt])
    }

    const tick = async () => {
      try {
        const res  = await fetch('/api/iss')
        const data = await res.json()
        if (data.position) {
          setPosition(data.position)
          setLastUpdate(new Date())
          setIsLive(true)
          if (data.crew?.length) setCrewList(data.crew)
          const pt = latLngToSVG(data.position.latitude, data.position.longitude, MAP_W, MAP_H)
          setTrail(prev => [...prev, pt].slice(-MAX_TRAIL))
        } else {
          setIsLive(false)
        }
      } catch {
        setIsLive(false)
      }
    }

    tick() // fetch immediately so the static shell fills without waiting 5s
    intervalRef.current = setInterval(tick, 5000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const dot = position
    ? latLngToSVG(position.latitude, position.longitude, MAP_W, MAP_H)
    : null

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(var(--ink),0.08)', padding: 'clamp(24px,4vw,48px) clamp(20px,5vw,48px) 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? '#2ecc71' : '#e74c3c', display: 'inline-block', boxShadow: isLive ? '0 0 10px #2ecc71' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: isLive ? '#2ecc71' : '#e74c3c' }}>
              {isLive ? 'Live Feed Active' : 'Signal Lost'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 300, color: 'var(--white)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            ISS Live Tracker
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', margin: '0 0 28px', letterSpacing: '0.05em' }}>
            Live Telemetry Data · Updates every 5 seconds
          </p>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px' }}>
            <StatCard icon={<Globe size={13} />}        label="Latitude"  value={position ? `${position.latitude.toFixed(4)}°`  : '—'} />
            <StatCard icon={<Navigation size={13} />}   label="Longitude" value={position ? `${position.longitude.toFixed(4)}°` : '—'} />
            <StatCard icon={<MoveVertical size={13} />} label="Altitude"  value={position ? `${position.altitude} km`           : '—'} />
            <StatCard icon={<Gauge size={13} />}        label="Velocity"  value={position ? `${position.velocity.toLocaleString()} km/h` : '—'} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(20px,5vw,48px)' }}>

        {/* World Map Tracker */}
        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(var(--ink),0.1)', marginBottom: '28px', background: 'var(--black)', position: 'relative' }}>

          {/* World map — <img> behind SVG so CSS filter works on all browsers including mobile */}
          <img
            src="/world-map.svg"
            alt=""
            aria-hidden="true"
            style={{
              position:      'absolute',
              inset:         0,
              width:         '100%',
              height:        '100%',
              objectFit:     'fill',
              filter:        'brightness(0) invert(1)',
              opacity:       0.13,
              pointerEvents: 'none',
              userSelect:    'none',
            }}
          />

          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            style={{ width: '100%', display: 'block', position: 'relative' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Transparent base so world map img shows through */}
            <rect width={MAP_W} height={MAP_H} fill="transparent" />

            {/* Latitude lines */}
            {[-60,-30,0,30,60].map(lat => {
              const y = ((90 - lat) / 180) * MAP_H
              return (
                <g key={lat}>
                  <line x1={0} y1={y} x2={MAP_W} y2={y} stroke="rgba(79,142,247,0.07)" strokeWidth={0.5} />
                  <text x={6} y={y - 3} fill="rgba(var(--ink),0.2)" fontSize={10} fontFamily="monospace">{lat}°</text>
                </g>
              )
            })}

            {/* Longitude lines */}
            {[-120,-60,0,60,120].map(lng => {
              const x = ((lng + 180) / 360) * MAP_W
              return (
                <g key={lng}>
                  <line x1={x} y1={0} x2={x} y2={MAP_H} stroke="rgba(79,142,247,0.07)" strokeWidth={0.5} />
                  <text x={x + 3} y={MAP_H - 6} fill="rgba(var(--ink),0.2)" fontSize={10} fontFamily="monospace">{lng}°</text>
                </g>
              )
            })}

            {/* Equator */}
            <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2} stroke="rgba(79,142,247,0.18)" strokeWidth={1} strokeDasharray="4 4" />

            {/* Trail */}
            {trail.map((pt, i) => {
              if (i === 0) return null
              const prev = trail[i - 1]
              if (Math.abs(pt.x - prev.x) > MAP_W / 2) return null
              return (
                <line key={i} x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y}
                  stroke="#4f8ef7" strokeWidth={1.5}
                  strokeOpacity={(i / trail.length) * 0.7}
                />
              )
            })}

            {/* ISS satellite marker */}
            {dot && (
              <g transform={`translate(${dot.x}, ${dot.y})`}>
                <circle cx={0} cy={0} r={14} fill="none" stroke="#2ecc71" strokeWidth={1} strokeOpacity={0.2}>
                  <animate attributeName="r"              values="10;22;10" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx={0} cy={0} r={8} fill="rgba(46,204,113,0.15)" />
                <rect x={-8} y={-2} width={16} height={4} rx={1} fill="#2ecc71" />
                <rect x={-14} y={-5} width={5}  height={10} rx={1} fill="#4f8ef7" opacity={0.9} />
                <rect x={9}   y={-5} width={5}  height={10} rx={1} fill="#4f8ef7" opacity={0.9} />
                <circle cx={0} cy={0} r={2.5} fill="#ffffff" />
              </g>
            )}
          </svg>

          <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)' }}>
            {lastUpdate.toLocaleTimeString()}
          </div>
          <div style={{ position: 'absolute', top: '12px', left: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(79,142,247,0.5)' }}>
            Equirectangular Projection
          </div>
        </div>

        {/* Crew */}
        {crewList.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Users size={13} color="#4f8ef7" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7' }}>
                Current Crew — {crewList.length} Aboard
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '12px' }}>
              {crewList.map((member, i) => (
                <div key={i} style={{ background: 'var(--black)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Satellite size={14} color="#4f8ef7" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--white)', margin: '0 0 3px' }}>{member.name}</p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2ecc71' }}>{member.craft}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
          <a href="/live" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← Back to Live
          </a>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: 'var(--black)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ color: 'rgba(var(--ink),0.55)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)' }}>{label}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#2ecc71', letterSpacing: '0.05em' }}>{value}</span>
    </div>
  )
}
