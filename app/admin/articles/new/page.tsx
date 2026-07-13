import Link                from 'next/link'
import { getFormOptions } from '@/modules/admin/services/adminArticles'
import { ArticleForm }    from '@/modules/admin/components/ArticleForm'
import { ChevronLeft }    from 'lucide-react'

export const revalidate = 0

export default async function NewArticlePage() {
  const { categories, tags, authors } = await getFormOptions()

  return (
    <div>

      {/* ── Page header ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <Link
          href="/admin/articles"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '6px',
            border: '1px solid var(--border)', color: 'rgba(var(--ink),0.5)',
            textDecoration: 'none', flexShrink: 0, transition: 'all 0.15s',
          }}
          title="Back to Articles"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
            New Article
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
            Create Article
          </h1>
        </div>
      </div>

      {/* ── Form ────────────────────────────────── */}
      <ArticleForm
        mode="new"
        categories={categories}
        tags={tags}
        authors={authors}
      />

    </div>
  )
}
