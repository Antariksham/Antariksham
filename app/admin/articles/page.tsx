import Link              from 'next/link'
import { ArticleBrowser } from '@/modules/admin/search/ArticleBrowser'
import { Plus }           from 'lucide-react'

// Client-rendered list: the page is just a static shell (no server data fetch,
// no SEO to worry about behind admin auth). The Article Browser fetches its
// first batch + filter options on mount and infinite-scrolls the rest, one
// capped batch per API call — so this route stays fast at any corpus size.
const PER_PAGE = 30

export default function AdminArticlesPage() {
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
            Search, filter &amp; manage your stories
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

      <ArticleBrowser perPage={PER_PAGE} />
    </div>
  )
}
