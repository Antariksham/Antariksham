import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { sectionHref, sectionListHref, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import type { MissionCard } from '@/types/mission'
import { SmartImage, CARD_IMAGE_SIZES, CARD_IMAGE_W, CARD_IMAGE_H } from '@/components/ui/SmartImage'

const STATUS_COLOR: Record<string, string> = {
  active:           'var(--green)',
  upcoming:         'var(--accent)',
  'in-development': 'var(--gold)',
  completed:        'var(--text-muted)',
  failed:           'var(--red)',
  cancelled:        'var(--red)',
}

const TYPE_LABEL: Record<string, string> = {
  crewed: 'Crewed', robotic: 'Robotic', flyby: 'Flyby', orbiter: 'Orbiter',
  lander: 'Lander', rover: 'Rover', 'sample-return': 'Sample Return', telescope: 'Telescope',
}

interface Props { missions: MissionCard[]; lang?: LanguageCode }

export function MissionsSection({ missions, lang = DEFAULT_LANGUAGE }: Props) {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Active &amp; Upcoming Missions</h2>
          <span className="section-eyebrow">Mission tracking</span>
        </div>
        <Link href={sectionListHref('missions', lang)} className="btn btn-outline">All missions</Link>
      </div>

      {missions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No missions tracked yet.</p>
      ) : (
        <div className="grid-3 home-missions">
          {missions.map(mission => {
            const statusColor = STATUS_COLOR[mission.status] || 'var(--text-muted)'
            return (
              <Link key={mission.id} href={sectionHref('missions', mission.slug, lang)} className="card">
                {mission.featuredImage
                  ? <SmartImage className="card-image" src={mission.featuredImage} alt={mission.name}
                    width={CARD_IMAGE_W} height={CARD_IMAGE_H} sizes={CARD_IMAGE_SIZES} />
                  : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🛸</div>}
                <div className="card-body">
                  <p className="card-category">
                    {mission.agency?.shortName || 'Mission'}
                    {mission.destination ? ` · ${mission.destination}` : ''}
                  </p>
                  <h3 className="card-title" lang={lang}>{mission.name}</h3>
                  {mission.description && <p className="card-excerpt" lang={lang}>{mission.description}</p>}
                  <div className="card-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                      {mission.status.replace('-', ' ')}
                    </span>
                    {mission.launchDate && <span>{formatDate(mission.launchDate)}</span>}
                    {mission.missionType && TYPE_LABEL[mission.missionType] && (
                      <span>{TYPE_LABEL[mission.missionType]}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
