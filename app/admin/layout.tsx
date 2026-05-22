import type { Metadata } from 'next'
import { AdminSidebar }  from '@/modules/admin/components/AdminSidebar'

export const metadata: Metadata = {
  title: {
    default:  'Mission Control',
    template: '%s — Antariksham Admin',
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
