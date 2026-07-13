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
    icon:  <Satellite size={26} />,
    label: 'ISS Tracker',
    desc:  'Real-time position, altitude, velocity and crew of the International Space Station.',
    color: 'var(--green)',
    badge: 'LIVE',
  },
  {
    href:  '/live/launches',
    icon:  <Rocket size={26} />,
    label: 'Launch Tracker',
    desc:  'Upcoming and recent rocket launches with live countdown timers and livestream links.',
    color: 'var(--accent)',
    badge: 'LIVE',
  },
  {
    href:  '/live/apod',
    icon:  <Camera size={26} />,
    label: 'NASA APOD',
    desc:  "NASA's Astronomy Picture of the Day — a new image or photograph of our universe every day.",
    color: 'var(--gold)',
    badge: 'DAILY',
  },
  {
    href:  '/live/deep-space',
    icon:  <Globe size={26} />,
    label: 'Deep Space',
    desc:  'Live telemetry for Voyager 1, Voyager 2, Europa Clipper, Parker Solar Probe and more.',
    color: 'var(--accent)',
    badge: 'LIVE',
  },
]

export default function LivePage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      <header className="page-header">
        <div className="container">
          <span className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block' }} />
            Live Systems
          </span>
          <h1 className="page-title">Space Intelligence</h1>
          <p className="page-lede">
            Real-time data systems tracking the ISS, rocket launches, NASA imagery and deep-space probes.
          </p>
        </div>
      </header>

      <main className="container section">
        <div className="grid-3">
          {LIVE_PAGES.map(page => (
            <Link key={page.href} href={page.href} className="card">
              <div style={{ height: '3px', background: `linear-gradient(90deg, ${page.color}, transparent)` }} />
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: page.color }}>{page.icon}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', color: page.color, background: `color-mix(in srgb, ${page.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${page.color} 35%, transparent)` }}>
                    {page.badge}
                  </span>
                </div>
                <h2 className="card-title" style={{ fontSize: '1.2rem' }}>{page.label}</h2>
                <p className="card-excerpt" style={{ WebkitLineClamp: 3 }}>{page.desc}</p>
                <div className="card-meta">
                  <span style={{ color: page.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.72rem' }}>Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
