import Link from 'next/link'
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import { strings, type UIKey } from '@/lib/ui'

const STATS: { num: UIKey | string; numKey?: UIKey; label: UIKey }[] = [
  { num: '47', label: 'about.statMissions' },
  { num: '6',  label: 'about.statSystems' },
  { num: '',   numKey: 'about.statTrust', label: 'about.statTrustSub' },
]

export function AboutSection({ lang = DEFAULT_LANGUAGE }: { lang?: LanguageCode } = {}) {
  const ui = strings(lang)
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <div>
          <p className="card-category" style={{ marginBottom: '1rem' }}>{ui('about.eyebrow')}</p>
          <p style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: '1rem', textWrap: 'balance' }}>
            {ui('about.headline')}
          </p>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '520px' }}>
            {ui('about.body')}
          </p>
          <Link href="/about" className="btn btn-outline">{ui('about.cta')}</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem 0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
                {stat.numKey ? ui(stat.numKey) : stat.num}
              </div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {ui(stat.label)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
