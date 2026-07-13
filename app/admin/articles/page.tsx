import Link                    from 'next/link'
import { getAdminArticles }    from '@/modules/admin/services/adminArticles'
import { formatDate }          from '@/lib/utils'
import {
  Plus, FileText, Eye, Star,
  CheckCircle, Clock, Archive, AlertCircle,
} from 'lucide-react'
import { ArticleRowActions }   from '@/modules/admin/components/ArticleRowActions'

export const revalidate = 0

const STATUS_TABS = [
  { value: 'all',       label: 'All'       },
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Drafts'    },
  { value: 'archived',  label: 'Archived'  },
] as const

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  published: { color: 'var(--green)',  icon: <CheckCircle size={10} /> },
  draft:     { color: 'var(--gold)',   icon: <Clock       size={10} /> },
  archived:  { color: 'rgba(255,255,255,0.3)', icon: <Archive   size={10} /> },
  scheduled: { color: 'var(--purple)', icon: <AlertCircle size={10} /> },
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; q?: string }
}) {
  const status  = (searchParams.status || 'all') as any
  const page    = parseInt(searchParams.page || '1', 10)
  const search  = searchParams.q || ''

  const { rows, total, totalPages } = await getAdminArticles({
    page, perPage: 20, status, search: search || undefined,
  })

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* ── Page header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
            Content
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
            Articles
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', letterSpacing: '0.06em' }}>
            {total} article{total !== 1 ? 's' : ''} total
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '6px',
            background: 'var(--accent)', color: '#0a0a0f',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 700, textDecoration: 'none', flexShrink: 0,
          }}
        >
          <Plus size={13} />
          New Article
        </Link>
      </div>

      {/* ── Status tabs + search ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '3px' }}>
          {STATUS_TABS.map(tab => {
            const active = status === tab.value
            return (
              <Link
                key={tab.value}
                href={`/admin/articles?status=${tab.value}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                style={{
                  padding: '6px 14px', borderRadius: '5px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: active ? 'var(--accent)'              : 'transparent',
                  color:      active ? '#0a0a0f'                    : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 700                          : 400,
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* Search */}
        <form action="/admin/articles" method="GET" style={{ display: 'flex', gap: '6px' }}>
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search articles…"
            style={{
              padding: '7px 12px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--white)', fontFamily: 'var(--font-mono)',
              fontSize: '11px', letterSpacing: '0.04em', outline: 'none',
              width: '200px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '7px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)',
              fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      {rows.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '60px', textAlign: 'center' }}>
          <FileText size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '12px' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {search ? 'No articles match your search' : 'No articles yet'}
          </p>
          <Link href="/admin/articles/new" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.08em' }}>
            Create your first article →
          </Link>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px 80px', gap: '0', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            {['Article', 'Type', 'Status', 'Views', 'Actions'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((article, i) => {
            const statusStyle = STATUS_STYLES[article.status] || STATUS_STYLES.draft
            return (
              <div
                key={article.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px 80px',
                  gap: '0', padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Title + meta */}
                <div style={{ minWidth: 0, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    {article.featured && (
                      <Star size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    )}
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 400,
                      color: 'var(--white)', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {article.title}
                    </p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: '0.04em' }}>
                    {article.authorName && <span style={{ marginRight: '8px' }}>{article.authorName}</span>}
                    {article.publishedAt
                      ? formatDate(article.publishedAt)
                      : <span style={{ color: 'var(--gold)' }}>Unpublished</span>
                    }
                    {article.categories.length > 0 && (
                      <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>
                        {article.categories[0]}
                      </span>
                    )}
                  </p>
                </div>

                {/* Type */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  {article.articleType.replace('-', ' ')}
                </span>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: statusStyle.color }}>{statusStyle.icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: statusStyle.color }}>
                    {article.status}
                  </span>
                </div>

                {/* Views */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.35)' }}>
                  <Eye size={10} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {article.views.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <ArticleRowActions id={article.id} slug={article.slug} />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
          {page > 1 && (
            <Link href={`/admin/articles?status=${status}&page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', letterSpacing: '0.08em' }}>
              ← Prev
            </Link>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/articles?status=${status}&page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', letterSpacing: '0.08em' }}>
              Next →
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
