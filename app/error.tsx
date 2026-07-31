'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { LogoMark } from '@/components/brand/Logo'

/**
 * The site-wide error boundary — a rendering or data failure anywhere under the
 * root layout lands here instead of on Next's unstyled default page. It keeps
 * the nav, footer and theme, and offers a retry rather than a dead end.
 *
 * `reset()` re-renders the failed segment without a full page load, which is
 * enough to recover from a transient failure (a Supabase hiccup, a timed-out
 * upstream API) — the common case on a site whose live surfaces proxy third
 * parties.
 *
 * Errors in the *root layout itself* never reach this boundary; those are caught
 * by app/global-error.tsx.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Vercel captures this in the function logs; `digest` is the id the user can
    // quote when reporting it, since the message itself is redacted in prod.
    console.error('[app error]', error)
  }, [error])

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container section" style={{ textAlign: 'center' }}>

        <LogoMark size={72} style={{ margin: '0 auto 28px', opacity: 0.22 }} />

        <span className="hero-badge" style={{ marginBottom: '20px' }}>Something went wrong</span>

        <h1 className="page-title" style={{ margin: '0 0 14px' }}>
          This page didn&rsquo;t load
        </h1>

        <p className="page-lede" style={{ margin: '0 auto 34px', maxWidth: '520px' }}>
          The problem is on our side, not yours. Trying again often clears it —
          most failures here are a data source being briefly unavailable.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reset} className="btn btn-primary press">Try again</button>
          <Link href="/" className="btn btn-outline press">Go home</Link>
          <Link href="/contact" className="btn btn-outline press">Report it</Link>
        </div>

        {error.digest && (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em',
            color: 'rgba(var(--ink),0.45)', marginTop: '28px',
          }}>
            Reference: {error.digest}
          </p>
        )}

      </div>
    </div>
  )
}
