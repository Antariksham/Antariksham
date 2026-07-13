import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Privacy Policy — ${siteConfig.name}`,
  description: 'Antariksham\'s privacy policy — what data we collect, how we use it, and your rights.',
}

const prose: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   '17px',
  color:      'rgba(var(--ink),0.78)',
  lineHeight: 1.85,
  margin:     '0 0 20px',
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize:   '26px',
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

export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--black)', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          Privacy Policy
        </div>

        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 6vw, 54px)', color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.12, fontWeight: 800 }}>
          Privacy Policy
        </h1>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.35)', letterSpacing: '0.08em', marginBottom: '36px' }}>
          Last updated: June 2026
        </p>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(var(--ink),0.85)', marginBottom: '36px' }}>
          Antariksham is built to inform, not to surveil. We collect the minimum data necessary to operate the platform and we do not sell, share, or monetise your personal information.
        </p>

        <hr style={divider} />

        <h2 style={{ ...h2, marginTop: 0 }}>What We Collect</h2>
        <p style={prose}>
          <strong style={{ color: 'rgba(var(--ink),0.9)', fontWeight: 600 }}>Usage data.</strong> When you visit Antariksham, standard server logs are automatically generated including your IP address, browser type, pages visited, and time of visit. This data is used solely for performance monitoring and security. It is not linked to any personal profile.
        </p>
        <p style={prose}>
          <strong style={{ color: 'rgba(var(--ink),0.9)', fontWeight: 600 }}>Article view counts.</strong> We count page views per article to understand which content is most useful. This count is anonymous — we do not track which individual visited which article.
        </p>
        <p style={prose}>
          <strong style={{ color: 'rgba(var(--ink),0.9)', fontWeight: 600 }}>Contact enquiries.</strong> If you contact us via email, we retain your message and email address solely to respond to your enquiry. We do not add you to any mailing list without your explicit consent.
        </p>

        <h2 style={h2}>What We Do Not Collect</h2>
        <p style={prose}>
          We do not use advertising trackers, third-party analytics scripts, social media pixels, or behavioural profiling tools. We do not currently require account creation, so we do not collect names, passwords, or personal profiles from general visitors.
        </p>
        <p style={prose}>
          We do not use cookies for tracking or advertising. The platform may use a session cookie solely for internal operational purposes, which is never set for general visitors.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Third-Party Services</h2>
        <p style={prose}>
          To operate the platform, Antariksham uses a small number of third-party services for infrastructure, live space data, and typography. These services may process limited technical data such as IP addresses as part of standard internet operations. We do not share any personal visitor information with these providers beyond what is technically necessary to serve the platform.
        </p>
        <p style={prose}>
          We do not use advertising networks, social media tracking pixels, or behavioural analytics platforms of any kind.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Your Rights</h2>
        <p style={prose}>
          You have the right to request access to any personal data we hold about you, and to request its deletion. Since we collect minimal data and do not build personal profiles, most requests will result in confirmation that we hold no data linked to your identity.
        </p>
        <p style={prose}>
          To make a data request, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} style={{ color: '#4f8ef7', textDecoration: 'none' }}>
            {siteConfig.email}
          </a>
          . We will respond within 30 days.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Changes to This Policy</h2>
        <p style={prose}>
          If we make material changes to this policy — for example, if we introduce user accounts or analytics — we will update this page with a new date and a summary of what changed. We will not reduce your privacy rights without clear notice.
        </p>

        <hr style={divider} />

        <div style={{ padding: '20px 24px', background: 'rgba(79,142,247,0.05)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: '10px', marginBottom: '32px' }}>
          <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
            Questions about this policy:{' '}
            <a href={`mailto:${siteConfig.email}`} style={{ color: '#4f8ef7', textDecoration: 'none' }}>
              {siteConfig.email}
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'Terms',            href: '/terms'            },
            { label: 'Editorial Policy', href: '/editorial-policy' },
            { label: 'Contact',          href: '/contact'          },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-flex', padding: '9px 16px', borderRadius: '6px',
                background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)',
                color: '#4f8ef7', fontFamily: 'var(--font-mono)', fontSize: '11px',
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
