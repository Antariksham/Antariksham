import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Editorial Policy — ${siteConfig.name}`,
  description: 'Antariksham\'s editorial standards, sourcing policy, correction process, and publishing guidelines.',
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

const h3: React.CSSProperties = {
  fontFamily: 'DM Mono, monospace',
  fontSize:   '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color:      'rgba(255,255,255,0.55)',
  margin:     '28px 0 8px',
}

const divider: React.CSSProperties = {
  border:     'none',
  borderTop:  '1px solid rgba(255,255,255,0.07)',
  margin:     '48px 0',
}

export default function EditorialPolicyPage() {
  return (
    <main style={{ background: '#0a0a0f', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          Editorial Policy
        </div>

        <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 6vw, 54px)', color: '#ffffff', margin: '0 0 28px', lineHeight: 1.15, fontWeight: 400 }}>
          Our Editorial Standards
        </h1>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(255,255,255,0.85)', marginBottom: '36px' }}>
          Antariksham is committed to accurate, independent, and transparent scientific journalism. This page describes the standards every piece of content on this platform must meet.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Sourcing Standards</h2>
        <p style={prose}>
          All factual claims in our articles must be traceable to at least one primary source. Primary sources we accept include official agency press releases and mission pages, peer-reviewed scientific papers, direct API data from NASA, ESA, ISRO, JPL, or Launch Library 2, and transcripts or recordings of official press conferences.
        </p>
        <p style={prose}>
          We do not treat other news outlets as primary sources. We do not publish second-hand reports without independent verification. When a claim cannot be verified through a primary source, it is either omitted or clearly labelled as unverified or speculative.
        </p>

        <h2 style={h2}>Article Types</h2>
        <p style={prose}>
          Every article on Antariksham is labelled with its type so readers understand what they are reading:
        </p>

        {[
          { type: 'Breaking News',        desc: 'Rapidly developing events. Sourced from official agency channels. Updated as information becomes available.' },
          { type: 'Mission Update',       desc: 'Status reports on ongoing missions. Based on official mission data and agency communications.' },
          { type: 'Analysis',             desc: 'Deeper examination of a development, trend, or mission outcome. May include editorial perspective.' },
          { type: 'Explainer',            desc: 'Scientific or technical concepts explained accessibly. Based on established science.' },
          { type: 'Research Breakdown',   desc: 'Summary and analysis of peer-reviewed papers. The original paper is always cited and linked.' },
          { type: 'Editorial',            desc: 'Opinion or perspective piece. Clearly labelled. Represents the view of the named author, not the platform.' },
          { type: 'Guide',                desc: 'Evergreen how-to or reference content. Reviewed for accuracy before publication.' },
        ].map(item => (
          <div key={item.type} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', paddingTop: '2px' }}>
              {item.type}
            </span>
            <p style={{ ...prose, margin: 0, fontSize: '15px' }}>{item.desc}</p>
          </div>
        ))}

        <hr style={divider} />

        <h2 style={h2}>What We Do Not Publish</h2>
        <p style={prose}>
          We do not publish unverified rumours, speculative leaks, or anonymous claims about upcoming missions or launches unless they have been officially confirmed. We do not republish or paraphrase content from other outlets without independent verification of the underlying facts. We do not publish AI-generated content without human editorial review, fact-checking, and attribution.
        </p>
        <p style={prose}>
          We do not accept sponsored content, advertiser influence, or paid placements of any kind. No organisation can pay to appear on Antariksham or to receive favourable coverage.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Corrections Policy</h2>
        <p style={prose}>
          When we make an error — factual, scientific, or contextual — we correct it promptly and transparently. Corrections are noted at the top of the affected article with the date of correction and a brief description of what was changed. We do not silently edit articles to remove errors.
        </p>
        <p style={prose}>
          To report a factual error, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} style={{ color: '#4f8ef7', textDecoration: 'none' }}>
            {siteConfig.email}
          </a>
          {' '}with the article URL and the specific claim in question.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Images & Media</h2>
        <p style={prose}>
          All images used on Antariksham are either in the public domain, licensed under Creative Commons, provided under NASA&apos;s open media policy, or used with explicit permission. Every image includes a source credit and copyright information where applicable. We do not use AI-generated imagery as documentary or editorial illustration.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Independence</h2>
        <p style={prose}>
          Antariksham has no financial relationships with any space agency, aerospace company, or technology organisation. We receive no funding, grants, or sponsorship that could influence our editorial decisions. Our coverage is determined solely by editorial merit and public interest.
        </p>

        <hr style={divider} />

        <div style={{ padding: '20px 24px', background: 'rgba(79,142,247,0.05)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: '10px', marginBottom: '32px' }}>
          <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
            Questions about our editorial standards or to report an error:{' '}
            <a href={`mailto:${siteConfig.email}`} style={{ color: '#4f8ef7', textDecoration: 'none' }}>
              {siteConfig.email}
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'About',       href: '/about'   },
            { label: 'Sources',     href: '/sources' },
            { label: 'Contact',     href: '/contact' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-flex', padding: '9px 16px', borderRadius: '6px',
                background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)',
                color: '#4f8ef7', fontFamily: 'DM Mono, monospace', fontSize: '11px',
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
