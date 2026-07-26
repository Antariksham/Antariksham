'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

/**
 * Admin chrome shell — owns the collapsible-sidebar state and lays out the
 * fixed, independently-scrolling sidebar next to the scrolling content.
 * ─────────────────────────────────────────────────────────────────
 * Two behaviours, chosen by viewport (CSS drives which one applies):
 *   • Desktop (≥900px): the sidebar collapses/expands — sliding off-canvas and
 *     letting the content reclaim the full width. The choice persists in
 *     localStorage. A floating button re-opens it.
 *   • Mobile (<900px): the sidebar is an off-canvas drawer over a scrim; the
 *     hamburger opens it, a nav tap / scrim tap / Escape closes it.
 * The sidebar is `position: fixed` with its own overflow, so it scrolls
 * independently of the page and never moves as the content scrolls.
 */

const COLLAPSE_KEY = 'antariksham.admin.sidebar.collapsed'
const DESKTOP = '(min-width: 900px)'

const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia(DESKTOP).matches

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ready, setReady] = useState(false) // gates transitions until after mount

  // Restore the desktop collapse preference, then enable transitions next frame
  // (so a restored "collapsed" state snaps into place instead of animating).
  useEffect(() => {
    try { if (localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true) } catch { /* ignore */ }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const setCollapsedPersist = useCallback((next: boolean) => {
    setCollapsed(next)
    try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0') } catch { /* ignore */ }
  }, [])

  // The floating opener: expand on desktop, open the drawer on mobile.
  const handleOpen = useCallback(() => {
    if (isDesktop()) setCollapsedPersist(false)
    else setMobileOpen(true)
  }, [setCollapsedPersist])

  // The in-sidebar toggle: collapse on desktop, close the drawer on mobile.
  const handleToggle = useCallback(() => {
    if (isDesktop()) setCollapsedPersist(true)
    else setMobileOpen(false)
  }, [setCollapsedPersist])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className={`admin-shell${ready ? ' is-ready' : ''}`}>

      {/* Floating opener — desktop when collapsed, always on mobile (hamburger) */}
      <button
        type="button"
        className="admin-open-btn"
        data-collapsed={collapsed}
        data-hidden={mobileOpen}
        onClick={handleOpen}
        aria-label="Open navigation"
        title="Open navigation"
      >
        <PanelLeft size={18} aria-hidden />
      </button>

      {/* Scrim behind the mobile drawer */}
      <div className="admin-scrim" data-open={mobileOpen} onClick={closeMobile} aria-hidden />

      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onNavigate={closeMobile}
      />

      <div className="admin-main" data-collapsed={collapsed}>
        <main className="admin-main__content">{children}</main>
      </div>

    </div>
  )
}
