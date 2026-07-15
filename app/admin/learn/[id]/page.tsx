import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminKnowledgeById } from '@/modules/admin/services/adminKnowledge'
import { LearnForm } from '@/modules/admin/components/LearnForm'
import { ChevronLeft } from 'lucide-react'

export const revalidate = 0

export default async function EditLearnPage({ params }: { params: { id: string } }) {
  const article = await getAdminKnowledgeById(params.id)
  if (!article) notFound()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/learn" title="Back to Learn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', color: 'rgba(var(--ink),0.85)', textDecoration: 'none', flexShrink: 0 }}>
            <ChevronLeft size={16} />
          </Link>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>Edit Topic</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--white)', margin: 0, maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {article.title || 'Untitled'}
            </h1>
          </div>
        </div>

        <a href={`/learn/${article.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '5px' }}>
          View Live →
        </a>
      </div>

      <LearnForm mode="edit" article={article} />
    </div>
  )
}
