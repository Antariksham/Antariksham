import Link from 'next/link'
import { getFeaturedMissions } from '@/modules/missions/services/getMissions'
import { formatDate } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  active:          '#34d897',
  upcoming:        '#3b9eff',
  'in-development':'#c9a96e',
  completed:       'rgba(240,244,250,0.35)',
  failed:          '#f05a5a',
  cancelled:       '#f05a5a',
}

const TYPE_LABEL: Record<string, string> = {
  crewed:         'Crewed',
  robotic:        'Robotic',
  flyby:          'Flyby',
  orbiter:        'Orbiter',
  lander:         'Lander',
  rover:          'Rover',
  'sample-return':'Sample Return',
  telescope:      'Telescope',
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.25)' }}>
        No missions tracked yet
      </p>
    </div>
  )
}

export async function MissionsSection() {
  const missions = await getFeaturedMissions(4)

  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '8px' }}>Mission Tracking</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Active & Upcoming Missions</div>
          </div>
          <Link href="/missions" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            All missions →
          </Link>
        </div>

        {missions.length === 0 && <EmptyState />}

        {/* Mission cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {missions.map(mission => {
            const statusColor = STATUS_COLOR[mission.status] || 'rgba(240,244,250,0.35)'
            const agencyColor = mission.agency?.shortName === 'ISRO' ? '#c9a96e'
                              : mission.agency?.shortName === 'ESA'  ? '#e879f9'
                              : mission.agency?.shortName === 'SpaceX' ? '#9f7aea'
                              : '#3b9eff'

            return (
              <Link key={mission.id} href={`/missions/${mission.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>

                  {/* Image */}
                  {mission.featuredImage ? (
                    <div style={{ width: '100%', height: '140px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={mission.featuredImage} alt={mission.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg, #080f20 0%, #0c1830 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '24px', opacity: 0.2 }}>🛸</span>
                    </div>
                  )}

                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Agency + type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {mission.agency && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: agencyColor }}>
                          {mission.agency.shortName}
                        </span>
                      )}
                      {mission.destination && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)' }}>
                          · {mission.destination}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 400, color: '#ffffff', lineHeight: 1.15 }}>
                      {mission.name}
                    </div>

                    {/* Mission type */}
                    {mission.missionType && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.4)' }}>
                        {TYPE_LABEL[mission.missionType] || mission.missionType}
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, display: 'inline-block', boxShadow: mission.status === 'active' ? `0 0 8px ${statusColor}` : 'none' }} />
                      {mission.status.replace('-', ' ')}
                      {mission.launchDate && ` · ${formatDate(mission.launchDate)}`}
                    </div>

                    {/* Description */}
                    {mission.description && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,244,250,0.75)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {mission.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
