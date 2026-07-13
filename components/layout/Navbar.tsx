'use client'

import Link from 'next/link'
import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { mainNav } from '@/config/navigation'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)' }}>

        {/* LOGO — no .org */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 700, color: 'var(--white)', letterSpacing: '0.02em' }}>
            {siteConfig.name}
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '36px', listStyle: 'none', margin: 0, padding: 0 }} className="desktop-nav">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: item.isLive ? '#2ecc71' : 'var(--white)', display: 'flex', alignItems: 'center', gap: '7px', opacity: item.isLive ? 1 : 0.9 }}>
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
          <Link href="/search" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1px solid rgba(var(--ink),0.2)', borderRadius: '6px', background: 'rgba(var(--ink),0.05)', color: 'rgba(var(--ink),0.75)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
            <span style={{ background: 'rgba(var(--ink),0.08)', borderRadius: '3px', padding: '1px 6px', fontSize: '11px', color: 'rgba(var(--ink),0.65)' }}>⌘K</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* MOBILE RIGHT — theme toggle + search icon + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-nav">
          <ThemeToggle />
          <Link href="/search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', border: '1px solid rgba(var(--ink),0.15)', borderRadius: '6px', background: 'rgba(var(--ink),0.04)', color: 'var(--white)', textDecoration: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', background: 'none', border: '1px solid rgba(var(--ink),0.15)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}>
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>

      </nav>

      {/* MOBILE MENU OVERLAY */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 49, background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', padding: '24px 32px', overflowY: 'auto' }}>
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 700, color: item.isLive ? '#2ecc71' : 'var(--white)', textDecoration: 'none', padding: '16px 0', borderBottom: '1px solid rgba(var(--ink),0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              {item.isLive && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px #2ecc71', display: 'inline-block', flexShrink: 0 }} />}
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 899px) {
          .mobile-nav { display: flex !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  )
      }
