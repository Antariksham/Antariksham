'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { mainNav, type NavItem } from '@/config/navigation'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from './ThemeToggle'

/** A link is "current" for its own page and for anything nested under it. */
function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** A section is current for its landing page, its sub-pages, or any child. */
function sectionIsCurrent(pathname: string, item: NavItem) {
  return (
    isCurrent(pathname, item.href) ||
    (item.children?.some((child) => isCurrent(pathname, child.href)) ?? false)
  )
}

export function Navbar() {
  const pathname = usePathname() ?? ''
  const [menuOpen, setMenuOpen] = useState(false)

  /* The drawer is a two-panel drill-down. `section` is what the sub-panel
     renders, `drilled` is whether it is on screen — they are separate so the
     sub-panel keeps its contents while it slides back out instead of going
     blank mid-animation. */
  const [section, setSection] = useState<NavItem | null>(null)
  const [drilled, setDrilled] = useState(false)

  const backRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const toggleMenu = useCallback(() => {
    const next = !menuOpen
    setMenuOpen(next)
    // Reopening always lands on the top-level list. Done on open (not close)
    // so the sub-panel does not flicker away behind the closing drawer.
    if (next) setDrilled(false)
  }, [menuOpen])

  const drillInto = useCallback((item: NavItem) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null
    setSection(item)
    setDrilled(true)
    // Focus follows the panel, so a keyboard or screen-reader user lands on
    // "Back" rather than being stranded on a row that just slid off screen.
    // preventScroll matters: the target is off-screen at this instant, and
    // scrolling it into view would slide the drawer sideways under the track.
    requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }))
  }, [])

  const drillBack = useCallback(() => {
    const returnTo = returnFocusRef.current
    setDrilled(false)
    requestAnimationFrame(() => returnTo?.focus({ preventScroll: true }))
  }, [])

  // Close the drawer whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (e: KeyboardEvent) => {
      // Escape steps back out of a sub-panel first, then closes the drawer.
      if (e.key === 'Escape') {
        if (drilled) drillBack()
        else setMenuOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      /* Keep Tab inside the open drawer. It covers the viewport and locks page
         scroll, so tabbing past the last link used to drop focus into page
         content nobody can see. The cycle is the bar (logo, theme, search,
         hamburger) then the on-screen panel — so "close" is always one Tab
         away, and the off-screen panel never appears because it is
         visibility:hidden and its links report no offsetParent. */
      const bar = document.querySelector('.site-nav')
      const panel = document.querySelector('.nav-drawer__panel[aria-hidden="false"]')
      if (!bar || !panel) return

      const focusable = (root: Element) =>
        Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
          // offsetParent is null for anything inside a display:none subtree,
          // which is exactly how the desktop row is hidden at this width.
          .filter((el) => el.offsetParent !== null)

      const items = [...focusable(bar), ...focusable(panel)]
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, drilled, drillBack])

  // The drawer covers the viewport — don't let the page scroll behind it.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  return (
    <>
      {/* Every class on this component (.site-nav, .desktop-nav, .mobile-nav,
          .nav-logo, .nav-drawer*) is styled in globals.css. Nothing here may go
          back into an inline <style>{`…`}</style> block: React escapes ", ' and
          < inside one on the server but not on the client, so the CSS text
          mismatches, hydration fails, and React throws away and re-renders the
          whole document. That is what used to happen on every page load. */}
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

        {/* DESKTOP NAV — deliberately flat. Sub-sections are a mobile-drawer
            affordance; on desktop each section's own page lists them. */}
        <ul style={{ display: 'flex', alignItems: 'center', gap: '36px', listStyle: 'none', margin: 0, padding: 0 }} className="desktop-nav">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="press" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: item.isLive ? 'var(--green)' : 'var(--white)', display: 'flex', alignItems: 'center', gap: '7px', opacity: item.isLive ? 1 : 0.9 }}>
                {item.isLive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block', flexShrink: 0, animation: 'blink 2s infinite' }} />
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
          <button onClick={toggleMenu} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="site-menu" style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', flexShrink: 0, background: 'none', border: '1px solid rgba(var(--ink),0.15)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}>
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: '16px', height: '1.5px', background: 'var(--white)', display: 'block', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>

      </nav>

      {/* MOBILE DRAWER — two panels on a sliding track. Always mounted (hidden
          by CSS) so opening AND closing animate, and so `aria-controls` on the
          hamburger always resolves. Styles: .nav-drawer* in globals.css. */}
      <div className="nav-drawer" id="site-menu" data-open={menuOpen} aria-hidden={!menuOpen}>
        <div className="nav-drawer__track" data-drilled={drilled}>

          {/* PANEL 1 — the top-level sections */}
          <nav className="nav-drawer__panel" aria-label="Main" aria-hidden={drilled}>
            <ul className="nav-drawer__list">
              {mainNav.map((item) => {
                const current = sectionIsCurrent(pathname, item)
                const label = (
                  <span className="nav-drawer__label">
                    {item.isLive && <span className="nav-drawer__dot" aria-hidden="true" />}
                    {item.label}
                  </span>
                )

                return (
                  <li key={item.href}>
                    {item.children?.length ? (
                      <button
                        type="button"
                        className="nav-drawer__row"
                        data-live={item.isLive ? 'true' : undefined}
                        aria-current={current ? 'page' : undefined}
                        aria-expanded={drilled && section?.href === item.href}
                        aria-controls="site-menu-section"
                        onClick={() => drillInto(item)}
                      >
                        {label}
                        <ChevronRight className="nav-drawer__chevron" size={18} aria-hidden="true" />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="nav-drawer__row"
                        data-live={item.isLive ? 'true' : undefined}
                        aria-current={current ? 'page' : undefined}
                        onClick={closeMenu}
                      >
                        {label}
                        <ChevronRight className="nav-drawer__chevron" size={18} aria-hidden="true" />
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* PANEL 2 — whichever section was drilled into. Its contents persist
              after `drilled` flips back to false so the slide-out is not blank. */}
          <nav
            className="nav-drawer__panel"
            id="site-menu-section"
            aria-label={section ? `${section.label} section` : 'Section'}
            aria-hidden={!drilled}
          >
            {section && (
              <>
                <button type="button" ref={backRef} className="nav-drawer__back" onClick={drillBack}>
                  <ChevronLeft size={15} aria-hidden="true" />
                  Back
                </button>

                {/* The section's own landing page — a parent row drills in, so
                    this is how you still reach the section itself. */}
                <Link
                  href={section.href}
                  className="nav-drawer__section"
                  aria-label={`${section.label} — section overview`}
                  aria-current={isCurrent(pathname, section.href) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {section.label}
                  <span className="nav-drawer__section-go" aria-hidden="true">
                    <ArrowRight size={15} />
                  </span>
                </Link>

                <ul className="nav-drawer__list">
                  {section.children?.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="nav-drawer__row nav-drawer__row--sub"
                        aria-current={isCurrent(pathname, child.href) ? 'page' : undefined}
                        onClick={closeMenu}
                      >
                        <span className="nav-drawer__label">{child.label}</span>
                        <ArrowRight className="nav-drawer__chevron" size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>

        </div>
      </div>
    </>
  )
}
