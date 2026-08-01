'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { langFromPathname } from '@/lib/i18n'
import { strings } from '@/lib/ui'

// Raw numbers rather than formatted English: the units and the "Interstellar"
// label are chrome, so they have to be rendered in the reader's language, not
// baked in when the data is fetched.
interface StripData {
  issSpeedKmh:     number
  voyagerBillionKm: string
  voyagerKmS:      number | null
}

const FALLBACK: StripData = {
  issSpeedKmh:      27600,
  voyagerBillionKm: '23.6',
  voyagerKmS:       null,
}

export function StatusStrip() {
  // Reads the language itself for the same reason Footer does — a shared
  // layout does not re-render on client-side navigation, so a prop from the
  // root layout would freeze at whichever language the session started in.
  const ui = strings(langFromPathname(usePathname() ?? ''))
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
          next.issSpeedKmh = Math.round(iss.velocity)
        }
      }

      if (dsRes.status === 'fulfilled' && dsRes.value.ok) {
        const ds = await dsRes.value.json()
        const v1 = Array.isArray(ds) ? ds.find((p: any) => p.id === 'voyager-1') : null
        if (v1?.distanceFromSun) {
          const au = parseFloat(v1.distanceFromSun)
          next.voyagerBillionKm = (au * 149597870.7 / 1e9).toFixed(1)
          next.voyagerKmS = v1.velocity ? Math.round(v1.velocity) : null
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
      label:     ui('strip.issPosition'),
      value:     ui('strip.kmh', { n: data.issSpeedKmh.toLocaleString() }),
      sub:       ui('strip.liveTracking'),
      subColor:  '#2ecc71',
      href:      '/live/iss-tracker',   // ← fixed: was missing
    },
    {
      icon:      '🚀',
      label:     ui('strip.nextLaunch'),
      value:     ui('strip.viewSchedule'),
      sub:       'Launch Library 2',   // the data source's own name
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/launches',
    },
    {
      icon:      '🌌',
      label:     ui('strip.apod'),
      value:     ui('strip.todaysImage'),
      sub:       ui('strip.updatedDaily'),
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/apod',
    },
    {
      icon:      '🛰️',
      label:     ui('strip.voyager'),
      value:     ui('strip.billionKm', { n: data.voyagerBillionKm }),
      sub:       data.voyagerKmS != null
        ? ui('strip.interstellarKms', { n: data.voyagerKmS })
        : ui('strip.interstellar'),
      subColor:  'rgba(var(--ink),0.6)',
      href:      '/live/deep-space/voyager-1',
    },
    {
      icon:      '🌍',
      label:     ui('strip.deepSpace'),
      value:     ui('strip.probes', { n: 5 }),
      sub:       ui('strip.telemetry'),
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
