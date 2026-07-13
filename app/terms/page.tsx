import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Terms & Conditions — ${siteConfig.name}`,
  description: 'The terms and conditions governing your use of Antariksham.org.',
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

export default function TermsPage() {
  return (
    <main style={{ background: 'var(--black)', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Label */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>
          Terms & Conditions
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 6vw, 54px)', color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.12, fontWeight: 800 }}>
          Terms & Conditions
        </h1>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.35)', letterSpacing: '0.08em', marginBottom: '36px' }}>
          Last updated: June 2026
        </p>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(var(--ink),0.85)', marginBottom: '36px' }}>
          By accessing or using Antariksham.org, you agree to be bound by these terms. Please read them carefully. If you do not agree, please do not use the platform.
        </p>

        <hr style={divider} />

        <h2 style={{ ...h2, marginTop: 0 }}>Use of the Platform</h2>
        <p style={prose}>
          Antariksham.org is an independent space intelligence and knowledge platform. You may access and read content on this platform for personal, non-commercial, and educational purposes. You may share links to our articles and pages freely.
        </p>
        <p style={prose}>
          You may not copy, reproduce, republish, scrape, or redistribute our original editorial content — including articles, explainers, mission analyses, and educational material — without prior written permission. This applies regardless of whether attribution is provided.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Intellectual Property</h2>
        <p style={prose}>
          All original content on Antariksham — including articles, educational content, mission analyses, platform design, and written copy — is the intellectual property of Antariksham and its contributors. All rights are reserved unless explicitly stated otherwise.
        </p>
        <p style={prose}>
          Space imagery, photographs, and scientific data displayed on this platform may originate from third-party sources including NASA, ISRO, ESA, and other agencies. These are used in accordance with their respective open media and licensing policies. Credit and attribution are provided where required.
        </p>
        <p style={prose}>
          Live data displayed on the platform — including ISS position, launch schedules, deep space telemetry, and NASA APOD — is sourced from official public APIs. This data belongs to its respective providers and is not proprietary to Antariksham.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Accuracy of Information</h2>
        <p style={prose}>
          We make every effort to ensure the accuracy of information published on this platform. However, space missions, launch schedules, and scientific data can change rapidly. Information on this platform may not always reflect the latest developments.
        </p>
        <p style={prose}>
          Live data systems — including the ISS tracker, deep space telemetry, and launch countdowns — display data fetched from third-party APIs. Antariksham is not responsible for inaccuracies originating from these external data sources.
        </p>
        <p style={prose}>
          Content on Antariksham is intended for informational and educational purposes only. It should not be relied upon for critical decisions, professional use, or applications where accuracy is essential.
        </p>

        <hr style={divider} />

        <h2 style={h2}>No Advertising or Sponsored Content</h2>
        <p style={prose}>
          Antariksham does not display advertising, accept sponsored content, or take payments to influence editorial coverage. All content is produced independently and represents our genuine editorial judgment.
        </p>

        <hr style={divider} />

        <h2 style={h2}>External Links</h2>
        <p style={prose}>
          This platform may contain links to external websites including space agency pages, scientific papers, and data providers. These links are provided for reference and convenience. Antariksham is not responsible for the content, accuracy, or privacy practices of any external website.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Limitation of Liability</h2>
        <p style={prose}>
          Antariksham is provided on an &quot;as is&quot; basis. We make no warranties, express or implied, regarding the availability, accuracy, or completeness of the platform or its content. We are not liable for any loss or damage arising from your use of or reliance on the platform.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Prohibited Conduct</h2>
        <p style={prose}>
          You agree not to use this platform to:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            'Scrape, harvest, or systematically collect content or data without permission',
            'Reproduce or republish our original editorial content on any other platform',
            'Attempt to gain unauthorised access to any part of the platform',
            'Use the platform in any way that violates applicable laws or regulations',
            'Impersonate Antariksham or misrepresent an affiliation with this platform',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(var(--ink),0.05)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ ...prose, margin: 0, fontSize: '15px' }}>{item}</p>
            </div>
          ))}
        </div>

        <hr style={divider} />

        <h2 style={h2}>Changes to These Terms</h2>
        <p style={prose}>
          We may update these terms from time to time. When we do, we will update the date at the top of this page. Continued use of the platform after any changes constitutes your acceptance of the revised terms.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Contact</h2>
        <p style={prose}>
          If you have questions about these terms or wish to request permission to republish our content, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} style={{ color: '#4f8ef7', textDecoration: 'none' }}>
            {siteConfig.email}
          </a>.
        </p>

        <hr style={divider} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {[
            { label: 'Privacy Policy',   href: '/privacy'          },
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
