import Link                    from 'next/link'
import { getAdminArticles, getFormOptions } from '@/modules/admin/services/adminArticles'
import { ArticleBrowser }       from '@/modules/admin/search/ArticleBrowser'
import { Plus }                 from 'lucide-react'

export const revalidate = 0

// The Article Browser (Feature 8) runs search / filter / sort / pagination in
// the database, so we only load the first page here (SSR snapshot); the browser
// refetches a single page at a time from /api/admin/articles/list. This keeps
// the page fast no matter how large the library grows.
const PER_PAGE = 25

export default async function AdminArticlesPage() {
  const [first, options] = await Promise.all([
    getAdminArticles({ page: 1, perPage: PER_PAGE, status: 'all' }),
    getFormOptions(),
  ])
  const { rows, total } = first

  return (
    <div style={{ maxWidth: '1080px' }}>

      {/* ── Page header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', paddingBottom: '22px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
            Content
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
            Articles
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'rgba(var(--ink),0.82)', margin: '4px 0 0', letterSpacing: '0.06em' }}>
            {total.toLocaleString()} article{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '6px',
            background: 'var(--accent)', color: 'var(--black)',
            fontFamily: 'var(--font-mono)', fontSize: '14px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 700, textDecoration: 'none', flexShrink: 0,
          }}
        >
          <Plus size={13} />
          New Article
        </Link>
      </div>

      <ArticleBrowser
        initialRows={rows}
        initialTotal={total}
        perPage={PER_PAGE}
        categories={options.categories.map(c => ({ id: c.id, name: c.name }))}
        tags={options.tags.map(t => ({ id: t.id, name: t.name }))}
        authors={options.authors}
      />
    </div>
  )
}
