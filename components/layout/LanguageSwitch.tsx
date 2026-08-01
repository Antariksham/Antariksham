'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Languages } from 'lucide-react'
import {
  LANGUAGE_LIST, langFromPathname, counterpartPath, langSans, type LanguageCode,
} from '@/lib/i18n'

/**
 * Site-wide language switch — "the Hindi version of the page you are on",
 * which is what the single hardcoded drawer link to `/hi/articles` never was.
 *
 * Renders one link per language you are *not* currently reading, so with two
 * languages it is a single control and with three it is two, without either
 * case being special-cased. Where the current route has no counterpart the
 * link falls back to that language's home rather than disappearing — see
 * `counterpartPath` for why.
 *
 * The accessible name is written in the target language on purpose: it is read
 * by someone who wants that language, and `lang`/`hrefLang` let a screen
 * reader switch voice for it. These two strings are deliberately here rather
 * than in a chrome dictionary — translating the rest of the UI is its own
 * piece of work (docs/NEXT-STEPS.md §2.2), and a switch nobody can operate
 * with a screen reader should not wait on it.
 */
const SWITCH_LABEL: Record<LanguageCode, string> = {
  en: 'Read this site in English',
  hi: 'यह साइट हिन्दी में पढ़ें',
}

export function LanguageSwitch({
  variant = 'bar',
  onNavigate,
}: {
  /** `bar` is the desktop pill beside Search; `drawer` is a mobile menu row. */
  variant?:    'bar' | 'drawer'
  /** Lets the drawer close itself when a row is followed. */
  onNavigate?: () => void
}) {
  const pathname = usePathname() ?? ''
  const current  = langFromPathname(pathname)
  const others   = LANGUAGE_LIST.filter(l => l.code !== current)

  if (others.length === 0) return null

  if (variant === 'drawer') {
    return (
      <>
        {others.map(l => (
          <li key={l.code}>
            <Link
              href={counterpartPath(pathname, l.code)}
              hrefLang={l.code}
              lang={l.code}
              aria-label={SWITCH_LABEL[l.code]}
              className="nav-drawer__row"
              onClick={onNavigate}
            >
              <span className="nav-drawer__label" style={{ fontFamily: langSans(l.code) }}>
                <Languages size={16} aria-hidden="true" style={{ marginRight: '8px', verticalAlign: '-3px' }} />
                {l.native}
              </span>
              <ArrowRight className="nav-drawer__chevron" size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </>
    )
  }

  return (
    <>
      {others.map(l => (
        <Link
          key={l.code}
          href={counterpartPath(pathname, l.code)}
          hrefLang={l.code}
          lang={l.code}
          aria-label={SWITCH_LABEL[l.code]}
          className="press"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 14px',
            border: '1px solid rgba(var(--ink),0.2)',
            borderRadius: '6px',
            background: 'rgba(var(--ink),0.05)',
            color: 'rgba(var(--ink),0.75)',
            fontFamily: langSans(l.code),
            fontSize: '13px',
            lineHeight: 1,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Languages size={13} aria-hidden="true" />
          {l.native}
        </Link>
      ))}
    </>
  )
}
