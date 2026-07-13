import Link from 'next/link'
import { LearnForm } from '@/modules/admin/components/LearnForm'
import { ChevronLeft } from 'lucide-react'

export const revalidate = 0

export default function NewLearnPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/admin/learn" title="Back to Learn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', flexShrink: 0 }}>
          <ChevronLeft size={16} />
        </Link>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>New Topic</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>Create Learn Topic</h1>
        </div>
      </div>

      <LearnForm mode="new" />
    </div>
  )
}
