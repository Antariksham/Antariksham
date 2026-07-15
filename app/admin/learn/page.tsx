import Link from 'next/link'
import { getAdminKnowledge } from '@/modules/admin/services/adminKnowledge'
import { LearnRowActions } from '@/modules/admin/components/LearnRowActions'
import { formatDate } from '@/lib/utils'
import { Plus, GraduationCap, Star, ImageIcon } from 'lucide-react'

export const revalidate = 0

const DIFF_COLOR: Record<string, string> = {
  beginner:     'var(--green)',
  intermediate: 'var(--gold)',
  advanced:     'var(--red)',
}

export default async function AdminLearnPage() {
  const rows = await getAdminKnowledge()

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>Content</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>Learn</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.82)', margin: '4px 0 0', letterSpacing: '0.06em' }}>
            {rows.length} topic{rows.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/learn/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '6px', background: 'var(--accent)', color: 'var(--black)', fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
          <Plus size={13} /> New Topic
        </Link>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '60px', textAlign: 'center' }}>
          <GraduationCap size={32} style={{ color: 'rgba(var(--ink),0.72)', marginBottom: '12px' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>No topics yet</p>
          <Link href="/admin/learn/new" style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.08em' }}>Create your first topic →</Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px', gap: '0', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
            {['Topic', 'Difficulty', 'Thumbnail', 'Actions'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.78)' }}>{h}</span>
            ))}
          </div>

          {rows.map((row, i) => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px', gap: '0', padding: '14px 20px', alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ minWidth: 0, paddingRight: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{row.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.featured && <Star size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                    /learn/{row.slug}{row.updatedAt ? ` · ${formatDate(row.updatedAt)}` : ''}
                  </p>
                </div>
              </div>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: DIFF_COLOR[row.difficultyLevel] || 'rgba(var(--ink),0.62)' }}>
                {row.difficultyLevel}
              </span>

              <span title={row.hasThumbnail ? 'Custom thumbnail' : 'Generated cover'} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: row.hasThumbnail ? 'var(--green)' : 'rgba(var(--ink),0.55)' }}>
                <ImageIcon size={11} />
                {row.hasThumbnail ? 'Custom' : 'Generated'}
              </span>

              <LearnRowActions id={row.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
