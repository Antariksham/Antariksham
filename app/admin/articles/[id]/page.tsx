import Link                                  from 'next/link'
import { notFound }                          from 'next/navigation'
import { getAdminArticleById, getFormOptions } from '@/modules/admin/services/adminArticles'
import { ArticleForm }                       from '@/modules/admin/components/ArticleForm'
import { formatDate }                        from '@/lib/utils'
import { ChevronLeft, Eye }                  from 'lucide-react'

export const revalidate = 0

export default async function EditArticlePage({
  params,
}: {
  params: { id: string }
}) {
  const [article, { categories, tags, authors }] = await Promise.all([
    getAdminArticleById(params.id),
    getFormOptions(),
  ])

  if (!article) notFound()

  return (
    <div>

      {/* ── Page header ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/admin/articles"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid var(--border)', color: 'rgba(var(--ink),0.5)',
              textDecoration: 'none', flexShrink: 0,
            }}
            title="Back to Articles"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
              Edit Article
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--white)', margin: 0, maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {article.title || 'Untitled'}
            </h1>
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Status badge */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px',
            background: article.status === 'published' ? 'rgba(46,204,113,0.1)' : 'rgba(243,156,18,0.1)',
            color:      article.status === 'published' ? 'var(--green)'         : 'var(--gold)',
            border:     `1px solid ${article.status === 'published' ? 'rgba(46,204,113,0.25)' : 'rgba(243,156,18,0.25)'}`,
          }}>
            {article.status}
          </span>

          {/* Views */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.4)' }}>
            <Eye size={11} />
            {article.views.toLocaleString()} views
          </span>

          {/* View live */}
          {article.status === 'published' && (
            <a
              href={`/news/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none',
                padding: '5px 12px', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '5px',
              }}
            >
              View Live →
            </a>
          )}
        </div>
      </div>

      {/* ── Meta row ─────────────────────────────── */}
      {article.publishedAt && (
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(var(--ink),0.3)', letterSpacing: '0.06em' }}>
            Published {formatDate(article.publishedAt)} · {article.readingTime} min read
          </span>
        </div>
      )}

      {/* ── Form ─────────────────────────────────── */}
      <ArticleForm
        mode="edit"
        article={article}
        categories={categories}
        tags={tags}
        authors={authors}
      />

    </div>
  )
}
