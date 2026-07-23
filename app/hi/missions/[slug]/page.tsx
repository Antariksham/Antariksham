import { getMissionBySlug, getRelatedMissions } from '@/modules/missions/services/getMissions'
import { buildMissionMetadata } from '@/modules/missions/services/missionMetadata'
import { MissionSlugPage } from '@/modules/missions/components/MissionSlugPage'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANG = 'hi' as const

// Dynamic: which Hindi slugs exist depends on which translations are published,
// and the root layout reads headers() (see /articles/[slug] for the full note).
export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const mission = await getMissionBySlug(params.slug, LANG)
  if (!mission) return { title: 'मिशन नहीं मिला' }
  return buildMissionMetadata(mission, LANG)
}

export default async function HindiMissionPage(
  { params }: { params: { slug: string } }
) {
  const mission = await getMissionBySlug(params.slug, LANG)
  if (!mission) notFound()

  const related = await getRelatedMissions(mission.id, 3, LANG)

  return <MissionSlugPage mission={mission} related={related} lang={LANG} />
}
