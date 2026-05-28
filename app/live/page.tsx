import type { Metadata } from 'next'
import Link              from 'next/link'
import { siteConfig }   from '@/config/site'
import { Satellite, Rocket, Camera, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       `Live — ${siteConfig.name}`,
  description: 'Live space intelligence systems — ISS tracker, launch countdowns, NASA APOD and deep space telemetry.',
}

const LIVE_PAGES = [
  {
    href:  '/live/iss-tracker',
    icon:  <Satellite size={28} />,
    label: 'ISS Tracker',
    desc:  'Real-time position, altitude, velocity and crew of the International Space Station.',
    color: 'var(--green)',
    badge: 'LIVE',
  },
  {
    href:  '/live/launches',
    icon:  <Rocket size={28} />,
    label: 'Launch Tracker',
    desc:  'Upcoming and recent rocket launches with live countdown timers and livestream links.',
    color: 'var(--accent)',
    badge: 'LIVE',
  },
  {
    href:  '/live/apod',
    icon:  <Camera size={28} />,
    label: 'NASA APOD',
    desc:  "NASA's Astronomy Picture of the Day — a new image or photograph of our universe every day.",
    color: 'var(--gold)',
    badge: 'DAILY',
  },
  {
    href:  '/live/deep-space',
    icon:  <Globe size={28} />,
    label: 'Deep Space',
    desc:  'Live telemetry for Voyager 1, Voyager 2, Europa Clipper, Parker Solar Probe and more.',
    color: 'rgba(180,140,255,0.9)',
    badge: 'LIVE',
  },
]

export default function LivePage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--green)' }}>
            Live Systems
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, color: 'var(--white)', margin: '0 0 14px' }}>
          Space Intelligence
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(240,244,250,0.6)', margin: 0, maxWidth: '520px', lineHeight: 1.7 }}>
          Real-time data systems tracking the ISS, rocket launches, NASA imagery and deep-space probes.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {LIVE_PAGES.map(page => {
          const isSoon = page.badge === 'SOON'
          return (
            <Link
              key={page.href}
              href={isSoon ? '#' : page.href}
              style={{
                display: 'block', textDecoration: 'none',
                background: 'var(--surface)',
                border: `1px solid var(--border)`,
                borderRadius: '12px', overflow: 'hidden',
                opacity: isSoon ? 0.5 : 1,
                cursor: isSoon ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Top accent line */}
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${page.color}, transparent)` }} />

              <div style={{ padding: '24px' }}>
                {/* Icon + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ color: page.color }}>
                    {page.icon}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: '3px',
                    color: page.color,
                    background: `${page.color}18`,
                    border: `1px solid ${page.color}35`,
                  }}>
                    {page.badge}
                  </span>
                </div>

                {/* Label */}
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: 'var(--white)', margin: '0 0 8px' }}>
                  {page.label}
                </h2>

                {/* Description */}
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.7, color: 'rgba(240,244,250,0.55)', margin: '0 0 20px' }}>
                  {page.desc}
                </p>

                {/* CTA */}
                {!isSoon && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: page.color }}>
                    Open →
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}
