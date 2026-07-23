import { LANGUAGE_LIST, type LanguageCode } from '@/lib/i18n'

// A small "English | हिन्दी" switch shown on any localized page that exists in
// more than one language. Pure links (no client JS) — `hrefFor` returns the URL
// for a given language, so this works for articles, learn, missions, etc.
export function LanguageToggle({
  current, available, hrefFor,
}: {
  current:   LanguageCode
  available: LanguageCode[]
  hrefFor:   (code: LanguageCode) => string
}) {
  if (available.length < 2) return null

  const langs = LANGUAGE_LIST.filter(l => available.includes(l.code))

  return (
    <div
      role="group"
      aria-label="Choose language"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '2px',
        border: '1px solid rgba(var(--ink),0.14)', borderRadius: '999px',
        padding: '3px', marginBottom: '24px',
      }}
    >
      {langs.map(l => {
        const active = l.code === current
        return (
          <a
            key={l.code}
            href={hrefFor(l.code)}
            hrefLang={l.code}
            aria-current={active ? 'true' : undefined}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '12px',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              padding:       '5px 14px',
              borderRadius:  '999px',
              lineHeight:    1,
              background:    active ? 'var(--accent)' : 'transparent',
              color:         active ? 'var(--black)' : 'rgba(var(--ink),0.7)',
              transition:    'background 0.15s, color 0.15s',
            }}
          >
            {l.native}
          </a>
        )
      })}
    </div>
  )
}
