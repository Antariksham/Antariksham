import Link                                          from 'next/link'
import { notFound }                                  from 'next/navigation'
import { getAdminMissionById, getAgencyOptions }     from '@/modules/admin/services/adminMissions'
import { MissionForm }                               from '@/modules/admin/components/MissionForm'
import { ChevronLeft, Globe }                        from 'lucide-react'

export const revalidate = 0

const STATUS_COLOR: Record<string, string> = {
  active: 'var(--green)', upcoming: 'var(--accent)',
  'in-development': 'var(--gold)', completed: 'rgba(255,255,255,0.35)',
  failed: 'var(--red)', cancelled: 'var(--red)',
}

export default async function EditMissionPage({ params }: { params: { id: string } }) {
  const [mission, agencies] = await Promise.all([
    getAdminMissionById(params.id),
    getAgencyOptions(),
  ])

  if (!mission) notFound()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/admin/missions"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', flexShrink: 0 }}
            title="Back to Missions"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
              Edit Mission
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
              {mission.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '4px',
            color: STATUS_COLOR[mission.status] || 'rgba(255,255,255,0.4)',
            border: `1px solid ${STATUS_COLOR[mission.status] || 'rgba(255,255,255,0.1)'}`,
            background: 'rgba(255,255,255,0.03)',
          }}>
            {mission.status.replace('-', ' ')}
          </span>
          <a
            href={`/missions/${mission.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '5px' }}
          >
            <Globe size={11} /> View Live
          </a>
        </div>
      </div>

      <MissionForm mode="edit" mission={mission} agencies={agencies} />
    </div>
  )
}
