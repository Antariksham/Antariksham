'use client'

import { useEffect, useRef, useState } from 'react'

interface StripData {
  issSpeed:        string
  voyagerDistance: string
  voyagerStatus:   string
}

const FALLBACK: StripData = {
  issSpeed:        '27,600 km/h',
  voyagerDistance: '23.6 billion km',
  voyagerStatus:   'Interstellar · 46 yrs',
}

export function StatusStrip() {
  const [data, setData] = useState<StripData>(FALLBACK)
  const fetchRef        = useRef<() => void>()

  fetchRef.current = async () => {
    try {
      const [issRes, dsRes] = await Promise.allSettled([
        fetch('/api/iss'),
        fetch('/api/deep-space'),
      ])

      const next = { ...FALLBACK }

      if (issRes.status === 'fulfilled' && issRes.value.ok) {
        const iss = await issRes.value.json()
        if (iss?.velocity) {
          next.issSpeed = `${Math.round(iss.velocity).toLocaleString()} km/h`
        }
      }

      if (dsRes.status === 'fulfilled' && dsRes.value.ok) {
        const ds = await dsRes.value.json()
        const v1 = Array.isArray(ds) ? ds.find((p: any) => p.id === 'voyager-1') : null
        if (v1?.distanceFromSun) {
          const au  = parseFloat(v1.distanceFromSun)
          const bkm = (au * 149597870.7 / 1e9).toFixed(1)
          next.voyagerDistance = `${bkm} billion km`
          next.voyagerStatus   = v1.velocity
            ? `Interstellar · ${Math.round(v1.velocity)} km/s`
            : 'Interstellar · 46 yrs'
        }
      }

      setData(next)
    } catch { /* keep fallback */ }
  }

  useEffect(() => {
    fetchRef.current?.()
    const id = setInterval(() => fetchRef.current?.(), 30_000)
    return () => clearInterval(id)
  }, [])

  const items = [
    {
      icon:      '🛸',
      label:     'ISS Position',
      value:     data.issSpeed,
      sub:       '● Live tracking',
      subColor:  '#2ecc71',
      href:      '/live/iss-tracker',   // ← fixed: was missing
    },
    {
      icon:      '🚀',
      label:     'Next Launch',
      value:     'View Schedule',
      sub:       'Launch Library 2',
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/launches',
    },
    {
      icon:      '🌌',
      label:     'NASA APOD',
      value:     "Today's Image",
      sub:       'Updated daily',
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/apod',
    },
    {
      icon:      '🛰️',
      label:     'Voyager 1',
      value:     data.voyagerDistance,
      sub:       data.voyagerStatus,
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/deep-space/voyager-1',
    },
    {
      icon:      '🌍',
      label:     'Deep Space',
      value:     '5 Probes',
      sub:       'Live telemetry',
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/deep-space',
    },
  ]

  return (
    <div style={{ borderTop: '1px solid rgba(var(--ink),0.1)', borderBottom: '1px solid rgba(var(--ink),0.1)', background: 'var(--black)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 24px', minWidth: 'max-content' }}>
        {items.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 28px 20px 0', marginRight: '28px', borderRight: i < items.length - 1 ? '1px solid rgba(var(--ink),0.08)' : 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(var(--ink),0.06)', border: '1px solid rgba(var(--ink),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 500, color: 'var(--white)', marginBottom: '2px' }}>
                {item.value}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: item.subColor }}>
                {item.sub}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
