import Link from 'next/link'

export function AboutSection() {
  return (
    <section style={{ padding: '64px 0' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', marginBottom: '20px' }}>Our Mission</div>
            <blockquote style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.45, color: '#ffffff', marginBottom: '24px', padding: 0, border: 'none' }}>
              "Antariksham is built on a simple belief — that space belongs to everyone, and understanding it should be <strong style={{ fontStyle: 'normal', fontWeight: 400 }}>accessible, scientific, and deeply honest.</strong>"
            </blockquote>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', marginBottom: '32px' }}>
              An independent platform committed to scientific accuracy, editorial integrity, and building the most credible space knowledge ecosystem on the web. Not a news portal. Not a blog. A space intelligence organization.
            </p>
            <Link href="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
              Our Mission →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { num: '47',   label: 'Missions\nTracked' },
              { num: '6',    label: 'Live\nSystems' },
              { num: '.org', label: 'Trust\nFirst' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, color: '#ffffff', lineHeight: 1, marginBottom: '10px' }}>{stat.num}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
