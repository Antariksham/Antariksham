import { Suspense }   from 'react'
import type { Metadata } from 'next'
import { SearchPage } from '@/modules/search/components/SearchPage'

export const metadata: Metadata = {
  title:       'Search',
  description: 'Search articles, missions, and space science topics on Antariksham.',
}

// SearchPage uses useSearchParams — must be wrapped in Suspense
export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.3)' }}>
          Loading…
        </span>
      </div>
    }>
      <SearchPage />
    </Suspense>
  )
}
