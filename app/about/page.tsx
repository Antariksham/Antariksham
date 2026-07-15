import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `About — ${siteConfig.name}`,
  description: 'Antariksham is an independent space intelligence and knowledge platform combining scientific journalism, live mission tracking, and deep educational content.',
}

const LINKS = [
  { label: 'Our Mission',      href: '/mission'          },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Sources',          href: '/sources'          },
  { label: 'Contact',          href: '/contact'          },
]

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      <header className="page-header">
        <div className="container">
          <span className="hero-badge">About Antariksham</span>
          <h1 className="page-title">An Independent Space Intelligence Platform</h1>
          <p className="page-lede">
            Serious, credible, accessible coverage of space exploration — not clickbait headlines or sensational news cycles.
          </p>
        </div>
      </header>

      <main className="container section">
        <div className="prose">
          <p className="lead">
            Antariksham is built on a simple belief: space exploration is one of the most important endeavours
            in human history, and it deserves serious, credible, and accessible coverage.
          </p>

          <h2>What We Are</h2>
          <p>
            Antariksham is an independent space intelligence and knowledge platform. We combine original
            scientific journalism, live mission tracking systems, deep-space telemetry, launch intelligence, and
            an educational knowledge engine — all in one place.
          </p>
          <p>
            We track everything from the ISS passing overhead to Voyager 1 at the edge of the solar system. We
            cover missions from NASA, ISRO, ESA, JAXA, SpaceX, and beyond, and build educational content designed
            to explain the science — not just the headlines.
          </p>

          <h2>What We Are Not</h2>
          <p>
            We are not a news aggregator. We do not copy or republish content from other outlets. Every article on
            Antariksham is original, written to a clear editorial standard, and sourced from primary scientific and
            agency sources.
          </p>
          <p>
            We are not entertainment. We do not optimise for engagement metrics, viral potential, or advertising
            revenue. We optimise for accuracy, depth, and trust.
          </p>

          <hr />

          <h2>Our Standards</h2>
          <p>
            Every claim on this platform is traceable to a primary source — agency announcements, peer-reviewed
            papers, official mission data, or direct API feeds from NASA and other institutions. We correct errors
            promptly and transparently, and we do not publish rumours or unverified reports.
          </p>
          <p>
            Our live data systems — ISS tracking, deep-space telemetry, launch countdowns — pull directly from
            authoritative official sources. When data is temporarily unavailable, we show the last verified data
            rather than blank pages or estimates.
          </p>

          <h2>Who Builds This</h2>
          <p>
            Antariksham is currently built and maintained by a solo founder with a vision to create a platform that
            treats its audience as intelligent, curious people — not pageview statistics.
          </p>
          <p>
            The platform is designed from the ground up to grow — from a single founder to a full editorial team —
            without ever needing to be rebuilt. Every feature is built to last.
          </p>

          <hr />

          <div className="tags-row">
            {LINKS.map(link => (
              <Link key={link.href} href={link.href} className="tag">{link.label}</Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
