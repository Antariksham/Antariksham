import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { footerNav } from '@/config/navigation'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#0b0e13', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '56px 24px 36px' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto' }}>

        {/* BRAND */}
        <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '26px', fontWeight: 400, color: '#ffffff', marginBottom: '6px' }}>
            {siteConfig.name}<span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', color: '#3b9eff', marginLeft: '2px' }}>{siteConfig.tld}</span>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3b9eff', opacity: 0.8, marginBottom: '16px' }}>
            {siteConfig.positioning}
          </div>
          <p style={{ fontSize: '15px', color: 'rgba(240,244,250,0.75)', lineHeight: 1.7, maxWidth: '440px', marginBottom: '0' }}>
            {siteConfig.description}
          </p>
        </div>

        {/* NAV GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '36px', marginBottom: '40px' }}>

          {[
            { title: 'Platform', links: footerNav.platform },
            { title: 'Intelligence', links: footerNav.intelligence },
            { title: 'Organization', links: footerNav.organization },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.5)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(240,244,250,0.85)', textDecoration: 'none' }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* BOTTOM */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '13px', color: 'rgba(240,244,250,0.55)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginBottom: '12px' }}>
            © {year} {siteConfig.domain} — Independent Space Intelligence Organization
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { label: 'Privacy Policy',   href: '/privacy'          },
              { label: 'Terms',            href: '/terms'            },
              { label: 'Editorial Policy', href: '/editorial-policy' },
              { label: 'Sources',          href: '/sources'          },
              { label: 'Contact',          href: '/contact'          },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ fontSize: '13px', color: 'rgba(240,244,250,0.6)', textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
