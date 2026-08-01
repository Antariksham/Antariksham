import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoMark } from '@/components/brand/Logo'
import { mainNav } from '@/config/navigation'
import { translator } from '@/lib/dictionaries'
import { DEFAULT_LANGUAGE } from '@/lib/i18n'

// not-found renders for paths that matched no route, so there is no reliable
// language to read from the URL — it stays in the default language.
const enT = translator(DEFAULT_LANGUAGE)

/**
 * The site-wide 404.
 *
 * Renders inside the root layout, so it inherits the nav, the footer and the
 * theme toggle — the thing Next's built-in 404 has none of. `app/article/not-found.tsx`
 * still handles a missing article specifically; this catches everything else,
 * including mistyped URLs and dead inbound links, which on a site inheriting
 * search traffic is a page real people land on.
 *
 * **Deliberately does not touch the database.** Showing "recent articles" here
 * would be nice, but the most likely reason someone is looking at an error page
 * is that something is already wrong — an error surface that depends on Supabase
 * can fail in exactly the situation it exists to handle. The search box and the
 * nav links are enough to get anyone moving again, and they cannot break.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  // The 404 status is the real signal to crawlers; this is belt-and-braces so a
  // soft-404 never gets indexed.
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container section" style={{ textAlign: 'center' }}>

        <LogoMark size={72} style={{ margin: '0 auto 28px', opacity: 0.22 }} />

        <span className="hero-badge" style={{ marginBottom: '20px' }}>404 — Page not found</span>

        <h1 className="page-title" style={{ margin: '0 0 14px' }}>
          This page isn&rsquo;t here
        </h1>

        <p className="page-lede" style={{ margin: '0 auto 34px', maxWidth: '520px' }}>
          The link may be out of date, or the page may have moved. Search the
          archive below, or pick up from one of the main sections.
        </p>

        {/* A plain GET form: no JavaScript required, which is the right call on a
            page that exists because something already went wrong. */}
        <form
          action="/search"
          method="get"
          role="search"
          style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', margin: '0 0 40px' }}
        >
          <label htmlFor="nf-q" className="sr-only">Search Antariksham</label>
          <input
            id="nf-q"
            name="q"
            type="search"
            placeholder="Search articles, missions, topics…"
            style={{
              flex: '1 1 320px', maxWidth: '420px', padding: '12px 16px',
              fontFamily: 'var(--font-sans)', fontSize: '15px',
              color: 'var(--text-primary)', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '6px',
            }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <nav aria-label="Main sections" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-outline press">Home</Link>
          {/* Driven by the same config the navbar uses, so a new section shows up
              here automatically instead of silently going missing. */}
          {mainNav.map(item => (
            <Link key={item.href} href={item.href} className="btn btn-outline press">
              {enT(item.labelKey)}
            </Link>
          ))}
        </nav>

      </div>
    </div>
  )
}
