'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { footerNav } from '@/config/navigation'
import { Logo } from '@/components/brand/Logo'
import { localizeHref, langFromPathname } from '@/lib/i18n'

/**
 * Every link runs through `localizeHref`, so following the footer from /hi
 * keeps you in Hindi — except sections that exist only in English, which keep
 * their own URLs.
 *
 * A client component purely to read the language off the live pathname. The
 * obvious cheaper design — have the root layout pass `lang` down from
 * `headers()` — is wrong here: the App Router does not re-render a shared
 * layout on client-side navigation, so the footer would keep whichever
 * language the *first* page load happened to have. Switching to Hindi on the
 * home page and then using the footer put you back in English, which is the
 * exact bug this component exists to not have.
 */
export function Footer() {
  const year = new Date().getFullYear()
  const lang = langFromPathname(usePathname() ?? '')
  const href = (h: string) => localizeHref(h, lang)

  return (
    <footer style={{ background: 'var(--black)', borderTop: '1px solid rgba(var(--ink),0.1)', padding: '56px 24px 36px' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto' }}>

        {/* BRAND */}
        <div style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid rgba(var(--ink),0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
            <Logo size={34} wordmarkSize={25} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)' }}>{siteConfig.tld}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.8, marginBottom: '16px' }}>
            {siteConfig.positioning}
          </div>
          <p style={{ fontSize: '15px', color: 'rgba(var(--ink),0.75)', lineHeight: 1.7, maxWidth: '440px', marginBottom: '0' }}>
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid rgba(var(--ink),0.08)' }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link href={href(item.href)} className="footer-link press" style={{ fontSize: '15px', fontWeight: 400 }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* BOTTOM */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
          <div style={{ fontSize: '13px', color: 'rgba(var(--ink),0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '12px' }}>
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
              <Link key={item.href} href={item.href} className="footer-link footer-link--muted press" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
