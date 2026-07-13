import { getHomepageSections, getHeroConfig } from '@/modules/admin/services/adminHomepage'
import { HomepageAdmin }                       from '@/modules/admin/components/HomepageAdmin'

export const revalidate = 0

export default async function AdminHomepagePage() {
  const [sections, heroConfig] = await Promise.all([
    getHomepageSections(),
    getHeroConfig(),
  ])

  return (
    <div>

      {/* ── Page header ─────────────────────────── */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
          Layout
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 300, color: 'var(--white)', margin: '0 0 6px' }}>
          Homepage
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', margin: 0, letterSpacing: '0.06em' }}>
          Control which sections appear and what the hero card shows
        </p>
      </div>

      {/* ── Main component ──────────────────────── */}
      <HomepageAdmin sections={sections} heroConfig={heroConfig} />

    </div>
  )
}
