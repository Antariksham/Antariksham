'use client'

import { usePathname } from 'next/navigation'
import { LANGUAGE_LIST, swapLangPath, pathLanguage, type LanguageCode } from '@/lib/i18n'
import { translator } from '@/lib/dictionaries'

// The site-wide language switch.
//
// Replaces the old per-article toggle, which lived inside the article body and
// hid itself unless that specific article had a published translation. That
// made Hindi unreachable from the home page, Explore, Live, Gallery and Search
// — a Hindi reader had no front door and no way to stay in Hindi. This one is
// chrome: always present, on every public page.
//
// PLAIN <a>, NOT next/link — deliberately. A language change must be a full
// document load, because `<html lang>` is set by the root layout from the
// request path, and the root layout does NOT re-render on a client-side
// navigation. A soft nav across the language boundary would leave the document
// declaring the wrong language, which breaks screen-reader pronunciation, the
// `:lang(hi)` typography rules, and hyphenation. The full load also re-renders
// metadata and hreflang for the new language. Do not "optimise" this to Link.
//
// `variant` controls density, not behaviour: the desktop nav is tight enough
// that the full endonyms would crowd six nav items, a search box and the theme
// toggle, so it shows short codes; the mobile drawer has room for the full
// name and uses it.
export function LanguageToggle({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const pathname = usePathname() || '/'
  const current  = pathLanguage(pathname)
  const t        = translator(current)

  return (
    <div
      role="group"
      aria-label={t('lang.choose')}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '2px',
        border:       '1px solid rgba(var(--ink),0.14)',
        borderRadius: '999px',
        padding:      '3px',
        flexShrink:   0,
      }}
    >
      {LANGUAGE_LIST.map(l => {
        const active = l.code === current
        return (
          <a
            key={l.code}
            href={swapLangPath(pathname, l.code)}
            hrefLang={l.code}
            lang={l.code}
            aria-current={active ? 'true' : undefined}
            // The visible label is an abbreviation in compact mode, so name the
            // language in full for screen readers either way.
            aria-label={l.label}
            className="press"
            style={{
              fontFamily:     'var(--font-mono)',
              fontSize:       '12px',
              letterSpacing:  '0.06em',
              textDecoration: 'none',
              padding:        variant === 'full' ? '8px 18px' : '5px 12px',
              borderRadius:   '999px',
              // NOT line-height:1. Devanagari stacks matras above the शिरोरेखा
              // and below the baseline; a 1em line box clips them — which is
              // exactly what the previous toggle did to its own हिन्दी label.
              lineHeight:     1.5,
              whiteSpace:     'nowrap',
              background:     active ? 'var(--accent)' : 'transparent',
              color:          active ? 'var(--black)' : 'rgba(var(--ink),0.7)',
              transition:     'background 0.15s, color 0.15s',
            }}
          >
            {variant === 'full' ? l.native : l.short}
          </a>
        )
      })}
    </div>
  )
}
