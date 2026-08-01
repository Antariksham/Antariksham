'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { mainNav, desktopNav, isCurrent, sectionIsCurrent, type NavItem } from '@/config/navigation'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from './ThemeToggle'
import { MegaMenu } from './MegaMenu'

/** How long the pointer must rest on a trigger before the panel opens, and how
 *  long it may be outside both trigger and panel before it closes. The close
 *  delay is the one that matters: it is the grace period for moving diagonally
 *  from a trigger down into the panel without cutting the corner. */
const OPEN_DELAY_MS  = 110
const CLOSE_DELAY_MS = 220

export function Navbar() {
  const pathname = usePathname() ?? ''
  const [menuOpen, setMenuOpen] = useState(false)

  /* Desktop mega-menu: which section's panel is open, or null. */
  const [mega, setMega] = useState<NavItem | null>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const megaBarRef = useRef<HTMLUListElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  /* The trigger that opened the panel, so Escape can hand focus back. */
  const megaTriggerRef = useRef<HTMLElement | null>(null)

  /* The drawer is a stack of panels on a sliding track, nesting as deep as the
     config does (Explore → Topic Hubs → the nine hubs is three levels).
     `stack` is the drilled path that is *rendered*; `depth` is how far along it
     we are *showing*. They are separate on purpose: on the way back out, the
     panel being left keeps its contents through the slide instead of going
     blank halfway. */
  const [stack, setStack] = useState<NavItem[]>([])
  const [depth, setDepth] = useState(0)

  const drawerRef = useRef<HTMLDivElement>(null)
  /* The row that opened each level, so stepping back returns focus to it. */
  const openerRefs = useRef<(HTMLElement | null)[]>([])

  // Panel 0 is the top-level list; every panel after it is one drilled section.
  const panels = [{ section: null as NavItem | null, items: mainNav }].concat(
    stack.map((section) => ({ section, items: section.children ?? [] })),
  )

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  /** Move focus into the panel that is now on screen, without letting the
   *  browser scroll the drawer sideways to "reveal" an off-screen target. */
  const focusVisiblePanelBack = useCallback(() => {
    requestAnimationFrame(() => {
      drawerRef.current
        ?.querySelector<HTMLElement>('.nav-drawer__panel[aria-hidden="false"] .nav-drawer__back')
        ?.focus({ preventScroll: true })
    })
  }, [])

  const toggleMenu = useCallback(() => {
    const next = !menuOpen
    setMenuOpen(next)
    // Reopening always lands on the top-level list. Done on open (not close) so
    // the drilled panel does not flicker away behind the closing drawer.
    if (next) setDepth(0)
  }, [menuOpen])

  const drillInto = useCallback((item: NavItem) => {
    openerRefs.current[depth] = document.activeElement as HTMLElement | null
    // Truncate at the current depth first: drilling into a different section
    // after stepping back replaces the old branch rather than growing the track.
    setStack((prev) => [...prev.slice(0, depth), item])
    setDepth(depth + 1)
    focusVisiblePanelBack()
  }, [depth, focusVisiblePanelBack])

  const drillBack = useCallback(() => {
    if (depth === 0) return
    const opener = openerRefs.current[depth - 1]
    setDepth(depth - 1)
    requestAnimationFrame(() => opener?.focus({ preventScroll: true }))
  }, [depth])

  /* ── Desktop mega-menu ─────────────────────────────────────────────────
     Hover and click both open it, as does Enter/Space on a trigger. Hover uses
     timers so brushing past a trigger on the way to another does not flash the
     panel open, and so the pointer can cut the corner from trigger to panel. */

  const cancelHoverTimer = useCallback(() => clearTimeout(hoverTimer.current), [])

  const closeMega = useCallback(() => {
    cancelHoverTimer()
    setMega(null)
  }, [cancelHoverTimer])

  const scheduleOpen = useCallback((item: NavItem) => {
    cancelHoverTimer()
    // Already open on some section: re-point immediately, since the panel is
    // on screen and waiting would just feel laggy.
    hoverTimer.current = setTimeout(() => setMega(item), mega ? 0 : OPEN_DELAY_MS)
  }, [cancelHoverTimer, mega])

  const scheduleClose = useCallback(() => {
    cancelHoverTimer()
    hoverTimer.current = setTimeout(() => setMega(null), CLOSE_DELAY_MS)
  }, [cancelHoverTimer])

  /** Click/keyboard open — unlike hover, this moves focus into the panel. */
  const toggleMega = useCallback((item: NavItem, trigger: HTMLElement) => {
    cancelHoverTimer()
    if (mega?.href === item.href) {
      setMega(null)
      return
    }
    megaTriggerRef.current = trigger
    setMega(item)
    requestAnimationFrame(() => {
      megaRef.current?.querySelector<HTMLElement>('.mega__title')?.focus()
    })
  }, [cancelHoverTimer, mega])

  // Close on route change, and clear any timer still pending on unmount.
  useEffect(() => { setMenuOpen(false); setMega(null) }, [pathname])
  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  useEffect(() => {
    if (!mega) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      closeMega()
      megaTriggerRef.current?.focus()
    }

    /* Pointer or focus leaving both the bar and the panel closes it. Focus is
       the important half for keyboards: tabbing out of the last link in the
       panel should not leave it hanging open behind the page. */
    const onOutside = (e: Event) => {
      const target = e.target as Node | null
      if (!target) return
      if (megaRef.current?.contains(target) || megaBarRef.current?.contains(target)) return
      closeMega()
    }

    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
    }
  }, [mega, closeMega])

  // Close the drawer whenever the route changes.

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (e: KeyboardEvent) => {
      // Escape steps back one level at a time, then closes the drawer.
      if (e.key === 'Escape') {
        if (depth > 0) drillBack()
        else setMenuOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      /* Keep Tab inside the open drawer. It covers the viewport and locks page
         scroll, so tabbing past the last link used to drop focus into page
         content nobody can see. The cycle is the bar (logo, theme, search,
         hamburger) then the on-screen panel — so "close" is always one Tab
         away, and off-screen panels never appear because they are
         visibility:hidden and their links report no offsetParent. */
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
  }, [menuOpen, depth, drillBack])

  // The drawer covers the viewport — don't let the page scroll behind it.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  /** One drawer row. Level 0 rows are the section type; deeper rows step down a
   *  size. A row with children drills (button + chevron); one without
   *  navigates (link + arrow), so the two read differently at a glance. */
  const renderRow = (item: NavItem, level: number, panelIndex: number) => {
    const hasChildren = Boolean(item.children?.length)
    const className = level === 0 ? 'nav-drawer__row' : 'nav-drawer__row nav-drawer__row--sub'
    const current = hasChildren
      ? sectionIsCurrent(pathname, item)
      : isCurrent(pathname, item.href)

    const label = (
      <span className="nav-drawer__label">
        {item.isLive && <span className="nav-drawer__dot" aria-hidden="true" />}
        {item.label}
      </span>
    )
    const Icon = hasChildren ? ChevronRight : ArrowRight
    const icon = <Icon className="nav-drawer__chevron" size={level === 0 ? 18 : 16} aria-hidden="true" />

    return (
      <li key={item.href}>
        {hasChildren ? (
          <button
            type="button"
            className={className}
            data-live={item.isLive ? 'true' : undefined}
            aria-current={current ? 'page' : undefined}
            aria-expanded={depth > panelIndex && stack[panelIndex]?.href === item.href}
            aria-controls={`site-menu-panel-${panelIndex + 1}`}
            onClick={() => drillInto(item)}
          >
            {label}
            {icon}
          </button>
        ) : (
          <Link
            href={item.href}
            className={className}
            data-live={item.isLive ? 'true' : undefined}
            aria-current={current ? 'page' : undefined}
            onClick={closeMenu}
          >
            {label}
            {icon}
          </Link>
        )}
      </li>
    )
  }

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

        {/* DESKTOP NAV — `desktopNav`, not `mainNav`: this is one horizontal
            line with no room to spare, so Home (the logo already goes there)
            and Missions are not on it. Both are in the mega-menu's left column,
            which is where the desktop finally reaches them.

            Every section is a link that goes to its own page — clicking the
            label navigates, it never just opens a menu. A section with
            sub-pages gets a separate caret button beside it that toggles the
            panel, so the two actions have their own hit areas and their own
            accessible names. Hovering anywhere on the pair opens the panel. */}
        <ul ref={megaBarRef} style={{ display: 'flex', alignItems: 'center', gap: '36px', listStyle: 'none', margin: 0, padding: 0 }} className="desktop-nav">
          {desktopNav.map((item) => {
            const hasChildren = Boolean(item.children?.length)
            const open = mega?.href === item.href
            const inner = (
              <>
                {item.isLive && <span className="nav-bar__dot" aria-hidden="true" />}
                {item.label}
              </>
            )

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <div
                    className="nav-bar__group"
                    onMouseEnter={() => scheduleOpen(item)}
                    onMouseLeave={scheduleClose}
                  >
                    <Link
                      href={item.href}
                      className="nav-bar__item press"
                      data-live={item.isLive ? 'true' : undefined}
                      data-open={open}
                      aria-current={sectionIsCurrent(pathname, item) ? 'page' : undefined}
                    >
                      {inner}
                    </Link>
                    <button
                      type="button"
                      className="nav-bar__caret-btn"
                      data-live={item.isLive ? 'true' : undefined}
                      data-open={open}
                      aria-label={`${item.label} submenu`}
                      aria-expanded={open}
                      aria-haspopup="true"
                      aria-controls="site-mega"
                      onClick={(e) => toggleMega(item, e.currentTarget)}
                    >
                      <ChevronDown className="nav-bar__caret" size={13} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="nav-bar__item press"
                    data-live={item.isLive ? 'true' : undefined}
                    aria-current={sectionIsCurrent(pathname, item) ? 'page' : undefined}
                    onMouseEnter={scheduleClose}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            )
          })}
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
            above the 24px minimum touch target. Search stays an always-visible
            icon here rather than a drawer row — it is one tap either way. */}
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

      {/* DESKTOP MEGA-MENU — sits directly under the bar, hidden below 1100px
          where the drawer takes over. Rendered outside <nav> so it can span the
          full viewport width, and after it in the DOM so Tab flows bar → panel.
          Kept mounted only while open: unlike the drawer it has no closing
          animation to wait for, and it fetches on mount. */}
      <div
        id="site-mega"
        className="mega-wrap"
        data-open={Boolean(mega)}
        onMouseEnter={cancelHoverTimer}
        onMouseLeave={scheduleClose}
      >
        {mega && (
          <MegaMenu
            section={mega}
            pathname={pathname}
            onSectionChange={setMega}
            onNavigate={closeMega}
            panelRef={megaRef}
          />
        )}
      </div>

      {/* MOBILE DRAWER — a stack of panels on a sliding track. Always mounted
          (hidden by CSS) so opening AND closing animate, and so `aria-controls`
          on the hamburger always resolves. Styles: .nav-drawer* in globals.css.
          The track's geometry is the only thing that cannot be static CSS: two
          numbers drive width, panel size and offset through custom properties. */}
      <div className="nav-drawer" id="site-menu" ref={drawerRef} data-open={menuOpen} aria-hidden={!menuOpen}>
        <div
          className="nav-drawer__track"
          style={{ '--panels': panels.length, '--depth': depth } as React.CSSProperties}
        >
          {panels.map((panel, i) => (
            <nav
              key={panel.section ? `${i}-${panel.section.href}` : 'root'}
              className="nav-drawer__panel"
              id={`site-menu-panel-${i}`}
              aria-label={panel.section ? `${panel.section.label} section` : 'Main'}
              aria-hidden={i !== depth}
            >
              {panel.section && (
                <>
                  <button type="button" className="nav-drawer__back" onClick={drillBack}>
                    <ChevronLeft size={15} aria-hidden="true" />
                    Back
                  </button>

                  {/* The section's own landing page. A parent row drills in, so
                      this is how you still reach the section itself. */}
                  <Link
                    href={panel.section.href}
                    className="nav-drawer__section"
                    aria-label={`${panel.section.label} — section overview`}
                    aria-current={isCurrent(pathname, panel.section.href) ? 'page' : undefined}
                    onClick={closeMenu}
                  >
                    {panel.section.label}
                    <span className="nav-drawer__section-go" aria-hidden="true">
                      <ArrowRight size={15} />
                    </span>
                  </Link>
                </>
              )}

              <ul className="nav-drawer__list">
                {panel.items.map((item) => renderRow(item, i, i))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </>
  )
}
