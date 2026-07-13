import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Our Mission — ${siteConfig.name}`,
  description: 'The philosophy and long-term vision behind Antariksham — why we built it, what we stand for, and where we are going.',
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

const pillar: React.CSSProperties = {
  background:   'rgba(255,255,255,0.02)',
  border:       '1px solid rgba(255,255,255,0.07)',
  borderRadius: '10px',
  padding:      '24px 28px',
}

export default function MissionPage() {
  return (
    <main style={{ background: '#0a0a0f', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Label */}
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          Our Mission
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 6vw, 54px)', color: '#ffffff', margin: '0 0 16px', lineHeight: 1.15, fontWeight: 400 }}>
          Exploring Space Through Knowledge, Research & Discovery
        </h1>

        <p style={{ ...prose, fontSize: '20px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, marginBottom: '36px' }}>
          Space is the greatest frontier in human history. Our mission is to make that frontier — its science, its missions, its mathematics, its meaning — accessible to anyone with the curiosity to explore it.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Why Antariksham Exists</h2>
        <p style={prose}>
          Most space coverage today falls into two categories: sensational headlines optimised for clicks, or dense technical papers written for specialists. Neither serves the curious general reader who wants depth without confusion, accuracy without jargon, and genuine insight without entertainment packaging.
        </p>
        <p style={prose}>
          Antariksham exists to fill that gap. We believe there is a large audience — students, engineers, enthusiasts, educators — who want space coverage that respects their intelligence and rewards their curiosity.
        </p>

        <hr style={divider} />

        <h2 style={h2}>What We Stand For</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '0 0 32px' }}>
          {[
            {
              title: 'Scientific Accuracy',
              body:  'Every fact is traceable to a primary source. We do not publish estimates as conclusions, rumours as reports, or renderings as photographs. When we are uncertain, we say so.',
            },
            {
              title: 'Editorial Independence',
              body:  'Antariksham has no advertising relationships, no agency affiliations, and no commercial incentives that could compromise our coverage. Our only obligation is to our readers.',
            },
            {
              title: 'Depth Over Volume',
              body:  'We would rather publish one well-researched article than ten thin ones. Quality and trust compound over time. Quantity does not.',
            },
            {
              title: 'Education as a Core Product',
              body:  'Our Learn section is not supplementary content — it is central to what we are. We build educational resources that explain the mathematics and physics behind space exploration, not just the events.',
            },
            {
              title: 'Open and Transparent',
              body:  'We publish our editorial policy, source list, and correction process openly. When we get something wrong, we correct it publicly and promptly.',
            },
          ].map(p => (
            <div key={p.title} style={pillar}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '8px' }}>
                {p.title}
              </div>
              <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <hr style={divider} />

        <h2 style={h2}>Where We Are Going</h2>
        <p style={prose}>
          Antariksham is built to grow. Our roadmap includes a full public launches page, a deep explore section covering missions, agencies, astronauts, and rockets, a gallery of properly licensed space imagery, and eventually a contributor system that brings more expert voices to the platform.
        </p>
        <p style={prose}>
          We are also building towards multilingual coverage — starting with Hindi — to make space knowledge accessible to the hundreds of millions of Indian readers who follow ISRO and the broader space programme in their own language.
        </p>
        <p style={prose}>
          The pace is deliberate. We are building a foundation that does not need to be rebuilt. Every feature is added when it can be done right — not when it is merely possible.
        </p>

        <hr style={divider} />

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
