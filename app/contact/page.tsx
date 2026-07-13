import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Contact — ${siteConfig.name}`,
  description: 'Get in touch with the Antariksham team — for corrections, tips, collaborations, or general enquiries.',
}

const prose: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '17px',
  color:      'rgba(var(--ink),0.78)',
  lineHeight: 1.85,
  margin:     '0 0 20px',
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '26px',
  color:      'var(--white)',
  margin:     '48px 0 14px',
  lineHeight: 1.3,
  fontWeight: 700,
}

const divider: React.CSSProperties = {
  border:    'none',
  borderTop: '1px solid rgba(var(--ink),0.07)',
  margin:    '48px 0',
}

const contactCard: React.CSSProperties = {
  display:      'flex',
  flexDirection:'column',
  gap:          '6px',
  padding:      '22px 26px',
  background:   'rgba(var(--ink),0.02)',
  border:       '1px solid rgba(var(--ink),0.07)',
  borderRadius: '10px',
}

export default function ContactPage() {
  return (
    <main style={{ background: 'var(--black)', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Label */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          Contact
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 6vw, 54px)', color: 'var(--white)', margin: '0 0 28px', lineHeight: 1.12, fontWeight: 800 }}>
          Get In Touch
        </h1>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(var(--ink),0.85)', marginBottom: '36px' }}>
          We read every message. Whether you have spotted an error, have a story tip, or want to collaborate — reach out using the relevant contact below.
        </p>

        <hr style={divider} />

        {/* Contact cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>

          <div style={contactCard}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4f8ef7' }}>
              General Enquiries
            </div>
            <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
              Questions about the platform, feedback, or anything else.
            </p>
            <a href={`mailto:${siteConfig.email}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#4f8ef7', textDecoration: 'none', marginTop: '4px' }}>
              {siteConfig.email}
            </a>
          </div>

          <div style={contactCard}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(231,76,60,0.8)' }}>
              Corrections & Factual Errors
            </div>
            <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
              If you believe something we have published is factually incorrect, please tell us. Include the article URL and the specific claim in question. We take corrections seriously and act on them promptly.
            </p>
            <a href={`mailto:${siteConfig.email}?subject=Correction`} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#4f8ef7', textDecoration: 'none', marginTop: '4px' }}>
              {siteConfig.email}
            </a>
          </div>

          <div style={contactCard}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(46,204,113,0.8)' }}>
              Story Tips & Press Releases
            </div>
            <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
              Have a space mission update, discovery, or announcement you think we should cover? Send it our way. We review all tips but cannot guarantee coverage.
            </p>
            <a href={`mailto:${siteConfig.email}?subject=Story+Tip`} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#4f8ef7', textDecoration: 'none', marginTop: '4px' }}>
              {siteConfig.email}
            </a>
          </div>

          <div style={contactCard}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(243,156,18,0.8)' }}>
              Collaboration & Partnerships
            </div>
            <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
              We are open to editorial collaborations with researchers, scientists, and educators who want to contribute original content. We are not open to sponsored content or paid placements.
            </p>
            <a href={`mailto:${siteConfig.email}?subject=Collaboration`} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#4f8ef7', textDecoration: 'none', marginTop: '4px' }}>
              {siteConfig.email}
            </a>
          </div>

        </div>

        <hr style={divider} />

        <h2 style={h2}>Response Times</h2>
        <p style={prose}>
          We aim to respond to all messages within 5 business days. Correction requests are prioritised and typically addressed within 48 hours. We are a small team — we appreciate your patience.
        </p>

        <p style={prose}>
          For urgent factual corrections on actively circulating articles, please mark your subject line <strong style={{ color: 'rgba(var(--ink),0.9)', fontWeight: 600 }}>URGENT CORRECTION</strong> and we will respond as soon as possible.
        </p>

        <hr style={divider} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'About',            href: '/about'            },
            { label: 'Editorial Policy', href: '/editorial-policy' },
            { label: 'Sources',          href: '/sources'          },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-flex', padding: '9px 16px', borderRadius: '6px',
                background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)',
                color: '#4f8ef7', fontFamily: 'var(--font-mono)', fontSize: '12px',
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
