export default function NotFound() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '56px', marginBottom: '24px' }}>📡</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '16px' }}>
          404 — Not Found
        </span>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--white)', margin: '0 0 16px' }}>
          Article Not Found
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--dim)', margin: '0 0 36px', maxWidth: '400px' }}>
          This article may have been removed or the link is incorrect.
        </p>
        <a href="/articles" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--black)', background: 'var(--accent)', padding: '12px 24px', borderRadius: '5px', textDecoration: 'none', fontWeight: 700 }}>
          ← Back to Articles
        </a>
      </div>
    </div>
  )
}
