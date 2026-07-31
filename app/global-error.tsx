'use client'

import { useEffect } from 'react'
import '@/styles/globals.css'

/**
 * Last-resort boundary: catches failures in the **root layout itself**, which
 * app/error.tsx cannot, because that boundary lives inside the layout it would
 * need in order to render.
 *
 * It therefore replaces the root layout entirely and must supply its own
 * <html> and <body> — no nav, no footer, no theme script. globals.css is
 * imported here so the design tokens are available, but every colour is written
 * as `var(--token, <dark value>)`: if the stylesheet is itself part of what
 * failed, the page still renders in the brand's dark palette rather than as
 * unstyled black-on-white. With no theme script there is no saved light/dark
 * choice to honour, so the dark default is the correct fallback (CLAUDE.md
 * rule 2 applies to the themed site; this page deliberately sits outside it).
 *
 * Kept dependency-free and layout-free on purpose — anything it imports is
 * another thing that can be broken at the moment it is needed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--black, #0a0a0f)',
          color: 'var(--white, #ffffff)',
          fontFamily: 'var(--font-sans, "Segoe UI", system-ui, -apple-system, sans-serif)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '520px' }}>
          {/* The mark inlined rather than imported — see the note above. */}
          <svg width="64" height="64" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" style={{ display: 'block', margin: '0 auto 26px', opacity: 0.22 }}>
            <path d="M50 5C44.5 32 33 62 7 92L28 84C48 56 50.5 30 50 5Z" />
            <path d="M50 5C55.5 32 67 62 93 92L72 84C52 56 49.5 30 50 5Z" />
            <path d="M24 83Q52 101 80 80Q52 92 24 83Z" />
            <path d="M50 58C50.4 62.2 53.4 64.6 56.5 65C53.4 65.4 50.4 67.8 50 72C49.6 67.8 46.6 65.4 43.5 65C46.6 64.6 49.6 62.2 50 58Z" />
          </svg>

          <p style={{
            fontFamily: 'var(--font-mono, system-ui, sans-serif)', fontSize: '11px',
            letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'var(--accent, #4f8ef7)', margin: '0 0 16px',
          }}>
            Antariksham — Service error
          </p>

          {/* font-family repeated here on purpose: globals.css styles bare
              h1–h6 with --font-serif, and serif is reserved for article and
              learn reading bodies (CLAUDE.md rule 3). Inheriting from <body>
              is not enough — the element rule wins. */}
          <h1 style={{
            fontFamily: 'var(--font-sans, "Segoe UI", system-ui, -apple-system, sans-serif)',
            fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 14px',
          }}>
            The site failed to load
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--dim, #b4b4c2)', margin: '0 0 32px' }}>
            Something went wrong before the page could be built. Reloading usually
            fixes it.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '12px 26px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                borderRadius: '6px', border: 'none',
                background: 'var(--accent, #4f8ef7)', color: '#ffffff',
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: '12px 26px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                borderRadius: '6px', border: '1px solid var(--border, rgba(255,255,255,0.14))',
                color: 'var(--white, #ffffff)',
              }}
            >
              Go home
            </a>
          </div>

          {error.digest && (
            <p style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: '11px',
              letterSpacing: '0.12em', color: 'var(--dim, #b4b4c2)',
              opacity: 0.6, marginTop: '28px',
            }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
