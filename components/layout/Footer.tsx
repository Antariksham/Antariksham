import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { footerNav, footerColumns, footerLegal } from '@/config/navigation'
import { swapLangPath, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import { translator } from '@/lib/dictionaries'
import { Logo } from '@/components/brand/Logo'

// `lang` comes from the layout, which reads it from the request path. That is
// correct here because every language change is a FULL document load (the
// switch is a plain <a>, see LanguageToggle), so this never renders against a
// stale language the way a client-side navigation would.
export function Footer({ lang = DEFAULT_LANGUAGE }: { lang?: LanguageCode }) {
  const year = new Date().getFullYear()
  const t    = translator(lang)

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
            {t('site.positioning')}
          </div>
          <p style={{ fontSize: '15px', color: 'rgba(var(--ink),0.75)', lineHeight: 1.7, maxWidth: '440px', marginBottom: '0' }}>
            {t('site.description')}
          </p>
        </div>

        {/* NAV GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '36px', marginBottom: '40px' }}>

          {footerColumns.map((col) => (
            <div key={col.key}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid rgba(var(--ink),0.08)' }}>
                {t(col.titleKey)}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {footerNav[col.key].map((item) => (
                  <li key={item.href}>
                    <Link href={swapLangPath(item.href, lang)} className="footer-link press" style={{ fontSize: '15px', fontWeight: 400 }}>
                      {t(item.labelKey)}
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
            © {year} {siteConfig.domain} — {t('site.positioning')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {footerLegal.map((item) => (
              <Link key={item.href} href={swapLangPath(item.href, lang)} className="footer-link footer-link--muted press" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
