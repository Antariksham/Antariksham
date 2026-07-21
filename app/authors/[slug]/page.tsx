import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAuthorBySlug, getAllAuthorSlugs } from '@/modules/authors/services/getAuthors'
import { getArticles } from '@/modules/articles/services/getArticles'
import { timeAgo } from '@/lib/utils'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getAllAuthorSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const author = await getAuthorBySlug(params.slug)
  if (!author) return { title: 'Author Not Found' }
  return {
    title:       author.name,
    description: author.bio || `Articles and analysis by ${author.name}.`,
    openGraph: {
      title:       author.name,
      description: author.bio || undefined,
      images:      author.avatar ? [author.avatar] : [],
      type:        'profile',
    },
  }
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AuthorProfilePage(
  { params }: { params: { slug: string } }
) {
  const author = await getAuthorBySlug(params.slug)
  if (!author) notFound()

  const { articles, total } = await getArticles({ authorId: author.id, perPage: 24 })

  const socials = [
    { key: 'twitter',  label: '𝕏',        url: author.socialLinks?.twitter },
    { key: 'linkedin', label: 'LinkedIn', url: author.socialLinks?.linkedin },
    { key: 'website',  label: 'Website',  url: author.socialLinks?.website },
  ].filter(s => s.url)

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      {/* Author header */}
      <header className="page-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {author.avatar
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={author.avatar} alt={author.name}
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
            : <div style={{ width: 84, height: 84, borderRadius: '50%', flexShrink: 0, background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                {initials(author.name)}
              </div>}

          <div style={{ minWidth: 0 }}>
            <p className="card-category" style={{ marginBottom: '0.4rem' }}>Author</p>
            <h1 className="page-title" style={{ margin: 0 }}>{author.name}</h1>
            {author.bio && <p className="page-lede" style={{ marginTop: '0.6rem' }}>{author.bio}</p>}

            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: '14px', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                {socials.map(s => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer nofollow"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none' }}>
                    {s.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Their articles */}
      <main className="container section">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {total} article{total !== 1 ? 's' : ''}
        </p>

        {articles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No published articles yet.</p>
        ) : (
          <div className="grid-3">
            {articles.map(article => (
              <a key={article.id} href={`/articles/${article.slug}`} className="card">
                {article.featuredImage
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="card-image" src={article.featuredImage} alt={article.title} loading="lazy" />
                  : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🪐</div>}
                <div className="card-body">
                  <p className="card-category">{article.categories[0] || 'Space'}</p>
                  <h3 className="card-title">{article.title}</h3>
                  {article.excerpt && <p className="card-excerpt">{article.excerpt}</p>}
                  <div className="card-meta">
                    {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
                    {article.readingTime ? <span>{article.readingTime} min read</span> : null}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
