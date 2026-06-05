import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title:       `Privacy Policy — ${siteConfig.name}`,
  description: 'Antariksham\'s privacy policy — what data we collect, how we use it, and your rights.',
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

export default function PrivacyPage() {
  return (
    <main style={{ background: '#07090c', minHeight: '100vh', padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Label */}
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '20px' }}>
          Privacy Policy
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 6vw, 54px)', color: '#f0f4fa', margin: '0 0 16px', lineHeight: 1.15, fontWeight: 400 }}>
          Privacy Policy
        </h1>

        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'rgba(240,244,250,0.35)', letterSpacing: '0.08em', marginBottom: '36px' }}>
          Last updated: June 2026
        </p>

        <p style={{ ...prose, fontSize: '19px', color: 'rgba(240,244,250,0.85)', marginBottom: '36px' }}>
          Antariksham is built to inform, not to surveil. We collect the minimum data necessary to operate the platform and we do not sell, share, or monetise your personal information.
        </p>

        <hr style={divider} />

        <h2 style={{ ...h2, marginTop: 0 }}>What We Collect</h2>
        <p style={prose}>
          <strong style={{ color: 'rgba(240,244,250,0.9)', fontWeight: 600 }}>Usage data.</strong> When you visit Antariksham, our hosting provider (Vercel) automatically collects standard server logs including your IP address, browser type, pages visited, and time of visit. This data is used solely for performance monitoring and security. It is not linked to any personal profile.
        </p>
        <p style={prose}>
          <strong style={{ color: 'rgba(240,244,250,0.9)', fontWeight: 600 }}>Article view counts.</strong> We count page views per article to understand which content is most useful. This count is anonymous — we do not track which individual visited which article.
        </p>
        <p style={prose}>
          <strong style={{ color: 'rgba(240,244,250,0.9)', fontWeight: 600 }}>Contact form data.</strong> If you contact us via email, we retain your message and email address solely to respond to your enquiry. We do not add you to any mailing list without your explicit consent.
        </p>

        <h2 style={h2}>What We Do Not Collect</h2>
        <p style={prose}>
          We do not use advertising trackers, third-party analytics scripts, social media pixels, or behavioural profiling tools. We do not currently require account creation, so we do not collect names, passwords, or personal profiles from general visitors.
        </p>
        <p style={prose}>
          We do not use cookies for tracking or advertising. The platform may use a session cookie solely for admin authentication purposes, which is never set for general visitors.
        </p>

        <hr style={divider} />

        <h2 style={h2}>Third-Party Services</h2>
        <p style={prose}>
          Antariksham uses the following third-party services to operate:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { name: 'Vercel',         purpose: 'Website hosting and deployment. Processes server request logs.',                                       link: 'https://vercel.com/legal/privacy-policy' },
            { name: 'Supabase',       purpose: 'Database and storage. Stores article, mission, and platform data. No personal visitor data stored.', link: 'https://supabase.com/privacy'           },
            { name: 'NASA Open APIs', purpose: 'Live space data (APOD, ISS, deep space). No visitor data is shared with NASA.',                       link: 'https://api.nasa.gov'                   },
            { name: 'Google Fonts',   purpose: 'Typography. Fonts are loaded from Google servers, which may log your IP address.',                    link: 'https://policies.google.com/privacy'    },
          ].map(item => (
            <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.5)', paddingTop: '2px' }}>
                {item.name}
              </span>
              <p style={{ ...prose, margin: 0, fontSize: '14px', color: 'rgba(240,244,250,0.55)' }}>
                {item.purpose}{' '}
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b9eff', textDecoration: 'none', fontSize: '12px' }}>
                  Privacy policy ↗
                </a>
              </p>
            </div>
          ))}
        </div>

        <hr style={divider} />

        <h2 style={h2}>Your Rights</h2>
        <p style={prose}>
          You have the right to request access to any personal data we hold about you, and to request its deletion. Since we collect minimal data and do not build personal profiles, most requests will result in confirmation that we hold no data linked to your identity.
        </p>
        <p style={prose}>
          To make a data request, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} style={{ color: '#3b9eff', textDecoration: 'none' }}>
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

        <div style={{ padding: '20px 24px', background: 'rgba(59,158,255,0.05)', border: '1px solid rgba(59,158,255,0.12)', borderRadius: '10px', marginBottom: '32px' }}>
          <p style={{ ...prose, margin: 0, fontSize: '15px' }}>
            Questions about this policy:{' '}
            <a href={`mailto:${siteConfig.email}`} style={{ color: '#3b9eff', textDecoration: 'none' }}>
              {siteConfig.email}
            </a>
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
