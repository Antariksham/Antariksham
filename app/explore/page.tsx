import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Orbit, MoonStar, Compass } from 'lucide-react'

const TITLE = `Explore — ${siteConfig.name}`
const DESCRIPTION =
  'Interactive gateways to the cosmos — an explorable Solar System map with live planet positions, mission cross-links and more discovery tools on the way.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| Antariksham".
  title: 'Explore',
  description: DESCRIPTION,
  alternates: { canonical: '/explore' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/explore',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [siteConfig.seo.defaultImage],
  },
  twitter: {
    card: siteConfig.seo.twitterCard,
    title: TITLE,
    description: DESCRIPTION,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Explore',
  url: `${siteConfig.url}/explore`,
  description: DESCRIPTION,
  isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
}

// One live experience + the roadmap teasers. A teaser is NOT a link (nothing
// on this site may navigate to a 404) — it becomes one when its page ships.
const EXPLORE_PAGES = [
  {
    href:  '/explore/solar-system',
    icon:  <Orbit size={26} />,
    label: 'Solar System Explorer',
    desc:  'An interactive map of the Solar System — true planet positions for any date, time travel, and every world linked to its missions and coverage.',
    color: 'var(--accent)',
    badge: 'INTERACTIVE',
  },
  {
    href:  null,
    icon:  <MoonStar size={26} />,
    label: 'Sky Tonight',
    desc:  'What is above you right now — tonight’s Moon phase, visible planets and upcoming ISS passes for your location.',
    color: 'var(--gold)',
    badge: 'SOON',
  },
  {
    href:  null,
    icon:  <Compass size={26} />,
    label: 'Topic Hubs',
    desc:  'Curated gateways to Mars, the Moon, black holes, exoplanets and more — every article, mission and tool on a topic in one place.',
    color: 'var(--green)',
    badge: 'SOON',
  },
]

export default function ExplorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ paddingTop: 'var(--nav-height)' }}>

        <header className="page-header">
          <div className="container">
            <span className="hero-badge">Discovery Systems</span>
            <h1 className="page-title">Explore the Cosmos</h1>
            <p className="page-lede">
              Interactive gateways to the Solar System and beyond — visual tools that
              connect every world to its missions, articles and live data.
            </p>
          </div>
        </header>

        <main className="container section">
          <div className="grid-3">
            {EXPLORE_PAGES.map(page => {
              const body = (
                <>
                  <div style={{ height: '3px', background: `linear-gradient(90deg, ${page.color}, transparent)` }} />
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ color: page.color }}>{page.icon}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', color: page.color, background: `color-mix(in srgb, ${page.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${page.color} 35%, transparent)` }}>
                        {page.badge}
                      </span>
                    </div>
                    <h2 className="card-title" style={{ fontSize: '1.2rem' }}>{page.label}</h2>
                    <p className="card-excerpt" style={{ WebkitLineClamp: 3 }}>{page.desc}</p>
                    <div className="card-meta">
                      <span style={{ color: page.href ? page.color : 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.78rem' }}>
                        {page.href ? 'Open →' : 'In development'}
                      </span>
                    </div>
                  </div>
                </>
              )
              return page.href ? (
                <Link key={page.label} href={page.href} className="card">{body}</Link>
              ) : (
                <div key={page.label} className="card" style={{ opacity: 0.72, cursor: 'default' }} aria-disabled>
                  {body}
                </div>
              )
            })}
          </div>

          <p style={{ marginTop: '32px', fontSize: '0.88rem', color: 'var(--faint)' }}>
            Looking for real-time data instead? Head to the{' '}
            <Link href="/live" style={{ color: 'var(--accent)' }}>Live systems</Link>{' '}
            or browse{' '}
            <Link href="/missions" style={{ color: 'var(--accent)' }}>all missions</Link>.
          </p>
        </main>
      </div>
    </>
  )
}
