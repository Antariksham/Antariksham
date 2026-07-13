'use client'

import Link        from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Rocket,
  Globe,
  Image,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Users,
  GraduationCap,
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
  { label: 'Missions',         href: '/admin/missions',  icon: <Rocket          size={15} /> },
  { label: 'Learn',            href: '/admin/learn',     icon: <GraduationCap   size={15} /> },
  { label: 'Authors',          href: '/admin/authors',   icon: <Users           size={15} /> },
  { label: 'Homepage',         href: '/admin/homepage',  icon: <Globe           size={15} /> },
  { label: 'Launches',         href: '/admin/launches',  icon: <Rocket          size={15} /> },
  { label: 'Media Library',    href: '/admin/media',     icon: <Image           size={15} /> },
  { label: 'SEO Center',       href: '/admin/seo',       icon: <Search          size={15} /> },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside style={{
      position:   'fixed',
      top:        0,
      left:       0,
      bottom:     0,
      width:      '240px',
      background: 'var(--black)',
      borderRight:'1px solid var(--border)',
      display:    'flex',
      flexDirection: 'column',
      zIndex:     100,
      overflowY:  'auto',
    }}>

      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #232338, #0a0a0f)', border: '1px solid rgba(79,142,247,0.3)', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--white)', lineHeight: 1 }}>Antariksham</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', marginTop: '3px' }}>Mission Control</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '10px 20px',
                margin:         '1px 8px',
                borderRadius:   '6px',
                background:     active ? 'rgba(79,142,247,0.1)' : 'transparent',
                color:          active ? 'var(--accent)' : 'rgba(var(--ink),0.5)',
                textDecoration: 'none',
                transition:     'all 0.15s',
                fontFamily:     'var(--font-mono)',
                fontSize: '12px',
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
                  e.currentTarget.style.color = 'rgba(var(--ink),0.5)'
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '3px', background: 'rgba(var(--ink),0.06)', color: 'rgba(var(--ink),0.55)', border: '1px solid var(--border)' }}>
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
            color:       'rgba(var(--ink),0.55)',
            fontFamily:  'var(--font-mono)',
            fontSize: '12px',
            letterSpacing:'0.08em',
            cursor:      'pointer',
            transition:  'all 0.15s',
            textAlign:   'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(231,76,60,0.08)'
            e.currentTarget.style.color = '#e74c3c'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(var(--ink),0.35)'
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

    </aside>
  )
}
