import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { ArticleCard } from '@/types/article'

const TYPE_LABEL: Record<string, string> = {
  'breaking-news':      'Breaking',
  analysis:             'Analysis',
  editorial:            'Editorial',
  'research-breakdown': 'Research',
  explainer:            'Explainer',
  guide:                'Guide',
  'mission-update':     'Mission',
}

interface Props { articles: ArticleCard[] }

export function LatestNewsSection({ articles }: Props) {
  const items = articles.slice(0, 6)

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2 className="section-title">Latest Articles</h2>
          <span className="section-eyebrow">Space intelligence &amp; journalism</span>
        </div>
        <Link href="/news" className="btn btn-outline">View all</Link>
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No articles published yet.</p>
      ) : (
        <div className="grid-3">
          {items.map(a => (
            <Link key={a.id} href={`/news/${a.slug}`} className="card">
              {a.featuredImage
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img className="card-image" src={a.featuredImage} alt={a.title} loading="lazy" />
                : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🪐</div>}
              <div className="card-body">
                <p className="card-category">{a.categories?.[0] || 'Space'}</p>
                <h3 className="card-title">{a.title}</h3>
                {a.excerpt && <p className="card-excerpt">{a.excerpt}</p>}
                <div className="card-meta">
                  <span>{a.readingTime ? `${a.readingTime} min read` : timeAgo(a.publishedAt || '')}</span>
                  {a.articleType && TYPE_LABEL[a.articleType] && (
                    <span style={{ color: 'var(--accent)' }}>{TYPE_LABEL[a.articleType]}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
