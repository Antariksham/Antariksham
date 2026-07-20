import type { Metadata } from 'next'
import { headers }        from 'next/headers'
import { redirect }       from 'next/navigation'
import { AdminSidebar }   from '@/modules/admin/components/AdminSidebar'
import { getAdminUser }   from '@/modules/admin/services/getAdminUser'

export const metadata: Metadata = {
  title: {
    default:  'Mission Control',
    template: '%s — Antariksham Admin',
  },
  robots: { index: false, follow: false },
}

// Auth pages render standalone (no sidebar, no gate).
const AUTH_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = headers().get('x-pathname') || ''
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isAuthPage) {
    return <>{children}</>
  }

  // Every other /admin page requires an active admin. Middleware already
  // guarantees a session; this adds the membership/role check.
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login?error=not_admin')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--black)' }}>

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '240px' }}>
        <main style={{ flex: 1, padding: 'clamp(24px, 3vw, 40px)', maxWidth: '1100px' }}>
          {children}
        </main>
      </div>

    </div>
  )
}
