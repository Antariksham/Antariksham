import Link                  from 'next/link'
import { getAgencyOptions }  from '@/modules/admin/services/adminMissions'
import { MissionForm }       from '@/modules/admin/components/MissionForm'
import { ChevronLeft }       from 'lucide-react'

export const revalidate = 0

export default async function NewMissionPage() {
  const agencies = await getAgencyOptions()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <Link
          href="/admin/missions"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', color: 'rgba(var(--ink),0.85)', textDecoration: 'none', flexShrink: 0 }}
          title="Back to Missions"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
            New Mission
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 300, color: 'var(--white)', margin: 0 }}>
            Add Mission
          </h1>
        </div>
      </div>

      <MissionForm mode="new" agencies={agencies} />
    </div>
  )
}
