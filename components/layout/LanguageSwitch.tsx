'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Sections that have a Hindi (/hi/...) counterpart. Anywhere else, the switch
// points into the Hindi content hub (/hi/articles) rather than a dead /hi URL.
const TRANSLATABLE = ['/articles', '/learn', '/missions']

// A global English ⇄ हिन्दी switch for the nav. On a translatable page it swaps
// the same URL between languages; elsewhere it routes into Hindi articles.
export function LanguageSwitch({ big = false, onNavigate }: { big?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname() || '/'
  const isHi = pathname === '/hi' || pathname.startsWith('/hi/')

  // English form of the current path (strip a leading /hi segment).
  const enPath = isHi ? (pathname.replace(/^\/hi(?=\/|$)/, '') || '/') : pathname
  const inTranslatable = TRANSLATABLE.some(s => enPath === s || enPath.startsWith(s + '/'))

  const target = isHi
    ? enPath
    : (inTranslatable ? '/hi' + enPath : '/hi/articles')

  const label = isHi ? 'EN' : 'हिन्दी'
  const title = isHi ? 'Read in English' : 'हिन्दी में पढ़ें'

  return (
    <Link
      href={target}
      onClick={onNavigate}
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: big ? '12px 16px' : '8px 13px',
        border: '1px solid rgba(var(--ink),0.2)', borderRadius: '6px',
        background: 'rgba(var(--ink),0.05)', color: 'rgba(var(--ink),0.75)',
        fontFamily: 'var(--font-mono)', fontSize: big ? '15px' : '12px',
        letterSpacing: '0.08em', textDecoration: 'none', whiteSpace: 'nowrap',
      }}
    >
      <svg width={big ? 16 : 13} height={big ? 16 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {label}
    </Link>
  )
}
