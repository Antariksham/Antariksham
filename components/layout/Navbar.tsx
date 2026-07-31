'use client'

import Link from 'next/link'
import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { mainNav } from '@/config/navigation'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Horizontal padding lives in CSS (.site-nav) so it can match .container
          on small screens — see the style block below. */}
      <nav className="site-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)' }}>

        {/* LOGO — mark + wordmark, no .org. Both inherit var(--white), so the
            mark is white in dark mode and near-black in light mode. */}
        <Link
          href="/"
          className="press"
          aria-label={`${siteConfig.name} — home`}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
        >
          {/* Fluid so the full lockup — mark AND name — fits every phone down
              to 320px without ever being hidden. Caps at the desktop size. */}
          <Logo
            size="clamp(24px, 7vw, 30px)"
            wordmarkSize="clamp(15px, 4.4vw, 21px)"
            gap="clamp(7px, 2vw, 10px)"
            className="nav-logo"
          />
        </Link>

        {/* DESKTOP NAV */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '36px', listStyle: 'none', margin: 0, padding: 0 }} className="desktop-nav">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="press" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: item.isLive ? '#2ecc71' : 'var(--white)', display: 'flex', alignItems: 'center', gap: '7px', opacity: item.isLive ? 1 : 0.9 }}>
                {item.isLive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px #2ecc71', display: 'inline-block', flexShrink: 0, animation: 'blink 2s infinite' }} />
                )}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* DESKTOP RIGHT — search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav">
          <Link href="/search" className="press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(var(--ink),0.2)', borderRadius: '6px', background: 'rgba(var(--ink),0.05)', color: 'rgba(var(--ink),0.75)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </Link>
          <ThemeToggle />
        </div>

        {/* MOBILE RIGHT — theme toggle + search icon + hamburger.
            36px rather than 38 and a 6px gap: that reclaims 10px for the logo,
            which is what lets the full wordmark fit at 320px. Still comfortably
            above the 24px minimum touch target. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} className="mobile-nav">
          <ThemeToggle size={36} />
          <Link href="/search" aria-label="Search" className="press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', flexShrink: 0, border: '1px solid rgba(var(--ink),0.15)', borderRadius: '6px', background: 'rgba(var(--ink),0.04)', color: 'var(--white)', textDecoration: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', flexShrink: 0, background: 'none', border: '1px solid rgba(var(--ink),0.15)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}>
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>

      </nav>

      {/* MOBILE MENU OVERLAY */}
      {menuOpen && (
        <div className="nav-menu" style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 49, background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="press" onClick={() => setMenuOpen(false)} style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 700, color: item.isLive ? '#2ecc71' : 'var(--white)', textDecoration: 'none', padding: '16px 0', borderBottom: '1px solid rgba(var(--ink),0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              {item.isLive && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px #2ecc71', display: 'inline-block', flexShrink: 0 }} />}
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        /* 1100, not 900. The full desktop row is logo + wordmark + six links +
           the search pill + the toggle; below about 1080px they collide — the
           wordmark ran into "ARTICLES" and at 900px the toggle was clipped off
           the right edge. The compact row handles that band comfortably, so it
           owns everything up to 1100. */
        @media (min-width: 1100px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 1099px) {
          .mobile-nav { display: flex !important; }
          .desktop-nav { display: none !important; }
        }

        /* The bar's horizontal padding. Below the desktop breakpoint it drops to
           1.5rem so the logo lines up exactly with .container (padding: 0 1.5rem),
           which is what every page's content sits in. At 32px the logo was
           indented 8px further than the headline beneath it, which read as the
           mark being pushed off the left edge. */
        .site-nav  { padding: 0 32px; }
        .nav-menu  { padding: 24px 32px; }
        @media (max-width: 1099px) {
          .site-nav { padding: 0 1.5rem; }
          .nav-menu { padding: 24px 1.5rem; }
        }

        /* The logo never shrinks below the space its siblings leave, and the
           wordmark is never hidden — the name is part of the identity. Sizing is
           fluid (clamp) instead, so the full lockup fits from 320px up.
           Note: no "＞" child combinators anywhere in this block — React escapes
           that character inside a <style> template literal, silently breaking
           any rule that uses one. */
        .nav-logo { min-width: 0; }
      `}</style>
    </>
  )
      }
