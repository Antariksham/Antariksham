import type { NASAApod } from '@/types/api'

interface Props {
  apod: NASAApod | null
}

export function APODSection({ apod }: Props) {

  // No cache yet — show placeholder
  if (!apod) {
    return (
      <div style={{ background: 'var(--black)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔭</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            APOD not synced yet
          </span>
          <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '12px', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
            Trigger a sync by calling the API endpoint.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* ── Page header ─────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px) 28px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '10px' }}>
            NASA
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 300, color: '#ffffff', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Astronomy Picture of the Day
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', margin: 0 }}>
            {apod.date}
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px)' }}>

        {/* Image or Video */}
        {apod.mediaType === 'image' ? (
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '36px', background: '#12121a' }}>
            <img
              src={apod.hdurl || apod.url}
              alt={apod.title}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '70vh', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', marginBottom: '36px', background: '#12121a' }}>
            <iframe
              src={apod.url}
              title={apod.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        )}

        {/* Title */}
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px,3vw,34px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          {apod.title}
        </h2>

        {/* Copyright */}
        {apod.copyright && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
            © {apod.copyright.trim()}
          </p>
        )}

        {/* Explanation */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '16px' }}>
            Explanation
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(15px,1.8vw,17px)', color: 'rgba(255,255,255,0.9)', lineHeight: 1.85, margin: 0 }}>
            {apod.explanation}
          </p>
        </div>

        {/* Back link */}
        <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <a href="/live" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← Back to Live
          </a>
        </div>
      </div>
    </div>
  )
}
