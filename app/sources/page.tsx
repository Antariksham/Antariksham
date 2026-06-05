import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Sources — ${siteConfig.name}`,
  description: 'The primary sources, APIs, and data providers that power Antariksham\'s journalism, live data, and educational content.',
}

const prose: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontSize:   '17px',
  color:      'rgba(240,244,250,0.78)',
  lineHeight: 1.85,
  margin:     '0 0 20px',
}

const h2: React.CSSProperties = {
  fontFamily: 'Crimson Pro, Georgia, serif',
  fontSize:   '26px',
  color:      '#f0f4fa',
  margin:     '48px 0 14px',
  lineHeight: 1.25,
}

const divider: React.CSSProperties = {
  border:    'none',
  borderTop: '1px solid rgba(255,255,255,0.07)',
  margin:    '48px 0',
}

interface SourceEntry {
  name:        string
  url:         string
  description: string
  type:        'agency' | 'api' | 'data' | 'reference'
}

const TYPE_COLOR: Record<SourceEntry['type'], string> = {
  agency:    'rgba(59,158,255,0.8)',
  api:       'rgba(52,216,151,0.8)',
  data:      'rgba(201,169,110,0.8)',
  reference: 'rgba(240,244,250,0.4)',
}

const TYPE_LABEL: Record<SourceEntry['type'], string> = {
  agency:    'Agency',
  api:       'Live API',
  data:      'Data Provider',
  reference: 'Reference',
}

const SOURCES: { category: string; items: SourceEntry[] }[] = [
  {
    category: 'Space Agencies',
    items: [
      { name: 'NASA',  url: 'https://www.nasa.gov',  description: 'Primary source for all NASA mission coverage, press releases, scientific announcements, and imagery.', type: 'agency' },
      { name: 'ISRO',  url: 'https://www.isro.gov.in', description: 'Primary source for Indian Space Research Organisation missions, launch updates, and announcements.', type: 'agency' },
      { name: 'ESA',   url: 'https://www.esa.int',   description: 'Primary source for European Space Agency missions, science, and Earth observation coverage.', type: 'agency' },
      { name: 'JAXA',  url: 'https://www.jaxa.jp',   description: 'Primary source for Japan Aerospace Exploration Agency missions and scientific results.', type: 'agency' },
      { name: 'SpaceX',url: 'https://www.spacex.com', description: 'Primary source for Falcon 9, Falcon Heavy, and Starship mission data and announcements.', type: 'agency' },
      { name: 'CNSA',  url: 'http://www.cnsa.gov.cn', description: 'China National Space Administration. Consulted for Tianwen, Chang\'e, and Tiangong mission updates.', type: 'agency' },
    ],
  },
  {
    category: 'Live Data APIs',
    items: [
      { name: 'NASA Open APIs',         url: 'https://api.nasa.gov',                  description: 'Powers our NASA Astronomy Picture of the Day (APOD), Near-Earth Object data, and Mars Rover imagery.', type: 'api' },
      { name: 'NASA JPL Horizons',      url: 'https://ssd.jpl.nasa.gov/horizons/',    description: 'Provides real-time ephemeris data for our Deep Space Tracker — Voyager 1, Voyager 2, Parker Solar Probe, Europa Clipper, and Lucy.', type: 'api' },
      { name: 'Launch Library 2',       url: 'https://thespacedevs.com/llapi',        description: 'Powers our Launch Tracker with upcoming and recent launch data across all agencies and providers.', type: 'api' },
      { name: 'Where the ISS At?',      url: 'https://wheretheiss.at',               description: 'Provides real-time ISS position coordinates for our ISS Tracker, updated every 5 seconds.', type: 'api' },
    ],
  },
  {
    category: 'Scientific & Reference Sources',
    items: [
      { name: 'NASA Scientific and Technical Information', url: 'https://www.sti.nasa.gov',           description: 'Used for technical papers, mission documentation, and historical mission archives.', type: 'reference' },
      { name: 'arXiv',                                     url: 'https://arxiv.org',                  description: 'Preprint server consulted for astrophysics, planetary science, and cosmology research papers.', type: 'reference' },
      { name: 'NASA JPL',                                  url: 'https://www.jpl.nasa.gov',           description: 'Jet Propulsion Laboratory. Primary source for planetary mission data, deep space operations, and solar system science.', type: 'data' },
      { name: 'NSSDC — NASA Space Science Data Center',   url: 'https://nssdc.gsfc.nasa.gov',        description: 'Reference archive for historical mission data, spacecraft specifications, and science results.', type: 'data' },
      { name: 'Space Weather Prediction Center (NOAA)',   url: 'https://www.swpc.noaa.gov',          description: 'Consulted for solar activity data, geomagnetic storm alerts, and space weather reports.', type: 'data' },
      { name: 'Heavens Above',                             url: 'https://www.heavens-above.com',      description: 'Reference source for satellite passes, ISS visibility, and night sky data.', type: 'reference' },
    ],
  },
]

function SourceCard({ source }: { source: SourceEntry }) {
  return (
    <div style={{
      display:       'grid',
      gridTemplateColumns: '1fr auto',
      gap:           '12px',
      alignItems:    'start',
      padding:       '18px 0',
      borderBottom:  '1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '18px', color: '#f0f4fa', lineHeight: 1.2 }}>
            {source.name}
          </span>
          <span style={{
            fontFamily:    'DM Mono, monospace',
            fontSize:      '9px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         TYPE_COLOR[source.type],
            padding:       '2px 7px',
            borderRadius:  '4px',
            background:    `${TYPE_COLOR[source.type].replace('0.8', '0.08')}`,
            border:        `1px solid ${TYPE_COLOR[source.type].replace('0.8', '0.2')}`,
          }}>
            {TYPE_LABEL[source.type]}
          </span>
        </div>
        <p style={{ ...prose, margin: 0, fontSize: '14px', color: 'rgba(240,244,250,0.55)' }}>
          {source.description}
        </p>
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily:    'DM Mono, monospace',
          fontSize:      '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         '#3b9eff',
          textDecoration:'none',
          padding:       '6px 12px',
          borderRadius:  '5px',
          background:    'rgba(59,158,255,0.07)',
          border:        '1px solid rgba(59,158,255,0.15)',
          whiteSpace:    'nowrap',
          flexShrink:    0,
        }}
      >
        Visit ↗
      </a>
    </div>
  )
}

export default function SourcesPage() {
  return (
    <main style={{ background: '#07090c', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Label */}
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '20px' }}>
          Sources & Data
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 6vw, 54px)', color: '#f0f4fa', margin: '0 0 28px', lineHeight: 1.15, fontWeight: 400 }}>
          Our Sources
        </h1>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(240,244,250,0.85)', marginBottom: '36px' }}>
          Every fact on Antariksham traces back to a primary source. This page lists the agencies, APIs, and scientific institutions we rely on for our journalism, live data systems, and educational content.
        </p>

        <hr style={divider} />

        <h2 style={{ ...h2, marginTop: '0' }}>Source Philosophy</h2>
        <p style={prose}>
          We do not treat other news websites as primary sources. We go directly to agency announcements, mission pages, official press conferences, and peer-reviewed papers. When we cannot verify a claim through a primary source, we either omit it or clearly label it as unverified.
        </p>
        <p style={prose}>
          Our live data systems — ISS tracking, Deep Space telemetry, launch countdowns, NASA APOD — pull directly from official APIs maintained by NASA, JPL, and The Space Devs. When any API is temporarily unavailable, we display the last verified data rather than blank pages or fabricated estimates.
        </p>

        <hr style={divider} />

        {/* Source categories */}
        {SOURCES.map(section => (
          <section key={section.category}>
            <h2 style={h2}>{section.category}</h2>
            <div>
              {section.items.map(source => (
                <SourceCard key={source.name} source={source} />
              ))}
            </div>
          </section>
        ))}

        <hr style={divider} />

        {/* Note */}
        <div style={{ padding: '20px 24px', background: 'rgba(59,158,255,0.05)', border: '1px solid rgba(59,158,255,0.12)', borderRadius: '10px', marginBottom: '32px' }}>
          <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
            If you believe we have cited a source incorrectly or misrepresented information from any of these providers, please{' '}
            <Link href="/contact" style={{ color: '#3b9eff', textDecoration: 'none' }}>contact us</Link>
            {' '}with the specific article and claim. We review all corrections.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'About',            href: '/about'            },
            { label: 'Editorial Policy', href: '/editorial-policy' },
            { label: 'Contact',          href: '/contact'          },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-flex', padding: '9px 16px', borderRadius: '6px',
                background: 'rgba(59,158,255,0.07)', border: '1px solid rgba(59,158,255,0.18)',
                color: '#3b9eff', fontFamily: 'DM Mono, monospace', fontSize: '11px',
                letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
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
