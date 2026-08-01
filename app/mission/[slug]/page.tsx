import { getMissionBySlug, getRelatedMissions } from '@/modules/missions/services/getMissions'
import { buildMissionMetadata } from '@/modules/missions/services/missionMetadata'
import { MissionSlugPage } from '@/modules/missions/components/MissionSlugPage'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'en' as const

// Rendered dynamically (per request). The root layout reads headers(), so this
// route can't be statically pre-rendered/ISR-revalidated without throwing
// DYNAMIC_SERVER_USAGE — which meant a newly-published mission 500'd on-demand.
export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const mission = await getMissionBySlug(params.slug, LANG)
  if (!mission) return { title: 'Mission Not Found' }
  return buildMissionMetadata(mission, LANG)
}

export default async function MissionPage(
  { params }: { params: { slug: string } }
) {
  const mission = await getMissionBySlug(params.slug, LANG)
  if (!mission) notFound()

  const related = await getRelatedMissions(mission.id, 3)

  return <MissionSlugPage mission={mission} related={related} lang={LANG} />
}
