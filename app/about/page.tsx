import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `About — ${siteConfig.name}`,
  description: 'Antariksham is an independent space intelligence and knowledge platform combining scientific journalism, live mission tracking, and deep educational content.',
}

const prose: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontSize:   '17px',
  color:      'rgba(255,255,255,0.78)',
  lineHeight: 1.85,
  margin:     '0 0 20px',
}

const h2: React.CSSProperties = {
  fontFamily: 'Crimson Pro, Georgia, serif',
  fontSize:   '26px',
  color:      '#ffffff',
  margin:     '48px 0 14px',
  lineHeight: 1.25,
}

const divider: React.CSSProperties = {
  border:     'none',
  borderTop:  '1px solid rgba(255,255,255,0.07)',
  margin:     '48px 0',
}

export default function AboutPage() {
  return (
    <main style={{ background: '#0a0a0f', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Page label */}
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          About Antariksham
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 6vw, 54px)', color: '#ffffff', margin: '0 0 28px', lineHeight: 1.15, fontWeight: 400 }}>
          An Independent Space Intelligence Platform
        </h1>

        {/* Lead */}
        <p style={{ ...prose, fontSize: '20px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, marginBottom: '36px' }}>
          Antariksham is built on a simple belief: space exploration is one of the most important endeavours in human history, and it deserves serious, credible, and accessible coverage — not clickbait headlines or sensational news cycles.
        </p>

        <hr style={divider} />

        <h2 style={h2}>What We Are</h2>
        <p style={prose}>
          Antariksham.org is an independent space intelligence and knowledge platform. We combine original scientific journalism, live mission tracking systems, deep-space telemetry, launch intelligence, and an educational knowledge engine — all in one place.
        </p>
        <p style={prose}>
          We track everything from the ISS passing overhead to Voyager 1 at the edge of the solar system. We cover missions from NASA, ISRO, ESA, JAXA, SpaceX, and beyond. And we build educational content designed to explain the science — not just the headlines.
        </p>

        <h2 style={h2}>What We Are Not</h2>
        <p style={prose}>
          We are not a news aggregator. We do not copy or republish content from other outlets. Every article on Antariksham is original, written to a clear editorial standard, and sourced from primary scientific and agency sources.
        </p>
        <p style={prose}>
          We are not entertainment. We do not optimise for engagement metrics, viral potential, or advertising revenue. We optimise for accuracy, depth, and trust.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Our Standards</h2>
        <p style={prose}>
          Every claim on this platform is traceable to a primary source — agency announcements, peer-reviewed papers, official mission data, or direct API feeds from NASA and other institutions. We correct errors promptly and transparently. We do not publish rumours or unverified reports.
        </p>
        <p style={prose}>
          Our live data systems — ISS tracking, deep-space telemetry, launch countdowns — pull directly from authoritative official sources. When data is temporarily unavailable, we show the last verified data rather than blank pages or estimates.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Who Builds This</h2>
        <p style={prose}>
          Antariksham is currently built and maintained by a solo founder with a vision to create a platform that treats its audience as intelligent, curious people — not pageview statistics.
        </p>
        <p style={prose}>
          The platform is designed from the ground up to grow — from a single founder to a full editorial team — without ever needing to be rebuilt. Every feature is built to last.
        </p>

        <hr style={divider} />

        {/* Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'Our Mission',      href: '/mission'          },
            { label: 'Editorial Policy', href: '/editorial-policy' },
            { label: 'Sources',          href: '/sources'          },
            { label: 'Contact',          href: '/contact'          },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display:       'inline-flex',
                padding:       '9px 16px',
                borderRadius:  '6px',
                background:    'rgba(79,142,247,0.07)',
                border:        '1px solid rgba(79,142,247,0.18)',
                color:         '#4f8ef7',
                fontFamily:    'DM Mono, monospace',
                fontSize:      '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration:'none',
                transition:    'all 0.15s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
