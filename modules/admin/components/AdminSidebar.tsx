'use client'

import Link        from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  LayoutDashboard,
  FileText,
  Rocket,
  Globe,
  Image,
  Search,
  LogOut,
  ChevronRight,
  Users,
  GraduationCap,
  BarChart3,
  PanelLeftClose,
} from 'lucide-react'

interface NavItem {
  label:    string
  href:     string
  icon:     React.ReactNode
  badge?:   string   // e.g. 'Soon' for stubs
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        href: '/admin',           icon: <LayoutDashboard size={15} /> },
  { label: 'Articles',         href: '/admin/articles',  icon: <FileText        size={15} /> },
  { label: 'Analytics',        href: '/admin/analytics', icon: <BarChart3       size={15} /> },
  { label: 'Missions',         href: '/admin/missions',  icon: <Rocket          size={15} /> },
  { label: 'Learn',            href: '/admin/learn',     icon: <GraduationCap   size={15} /> },
  { label: 'Authors',          href: '/admin/authors',   icon: <Users           size={15} /> },
  { label: 'Homepage',         href: '/admin/homepage',  icon: <Globe           size={15} /> },
  { label: 'Launches',         href: '/admin/launches',  icon: <Rocket          size={15} /> },
  { label: 'Media Library',    href: '/admin/media',     icon: <Image           size={15} /> },
  { label: 'SEO Center',       href: '/admin/seo',       icon: <Search          size={15} /> },
]

interface AdminSidebarProps {
  collapsed:   boolean
  mobileOpen:  boolean
  onToggle:    () => void   // collapse (desktop) / close drawer (mobile)
  onNavigate:  () => void   // close the mobile drawer after tapping a link
}

export function AdminSidebar({ collapsed, mobileOpen, onToggle, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar" data-collapsed={collapsed} data-mobile-open={mobileOpen}>

      {/* Brand + collapse toggle */}
      <div className="admin-sidebar__head">
        <div className="admin-brand">
          <div className="admin-brand__mark" aria-hidden />
          <div>
            <div className="admin-brand__name">Antariksham</div>
            <div className="admin-brand__sub">Mission Control</div>
          </div>
        </div>
        <button
          type="button"
          className="admin-iconbtn"
          onClick={onToggle}
          aria-label="Collapse navigation"
          title="Collapse navigation"
        >
          <PanelLeftClose size={16} aria-hidden />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '10px 20px',
                margin:         '1px 8px',
                borderRadius:   '6px',
                background:     active ? 'var(--accent-dim)' : 'transparent',
                color:          active ? 'var(--accent)' : 'rgba(var(--ink),0.72)',
                textDecoration: 'none',
                transition:     'all 0.15s',
                fontFamily:     'var(--font-mono)',
                fontSize: '14px',
                letterSpacing:  '0.08em',
                borderLeft:     active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(var(--ink),0.04)'
                  e.currentTarget.style.color = 'rgba(var(--ink),0.8)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(var(--ink),0.72)'
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '3px', background: 'rgba(var(--ink),0.06)', color: 'rgba(var(--ink),0.78)', border: '1px solid var(--border)' }}>
                  {item.badge}
                </span>
              )}
              {active && !item.badge && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '10px',
            padding:     '10px 20px',
            width:       '100%',
            borderRadius:'6px',
            background:  'transparent',
            border:      'none',
            color:       'rgba(var(--ink),0.78)',
            fontFamily:  'var(--font-mono)',
            fontSize: '14px',
            letterSpacing:'0.08em',
            cursor:      'pointer',
            transition:  'all 0.15s',
            textAlign:   'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(var(--red-rgb),0.08)'
            e.currentTarget.style.color = 'var(--red)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(var(--ink),0.78)'
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

    </aside>
  )
}
