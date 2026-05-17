import { getMissionBySlug, getAllMissionSlugs, getRelatedMissions } from '@/modules/missions/services/getMissions'
import { MissionSlugPage } from '@/modules/missions/components/MissionSlugPage'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 600

export async function generateStaticParams() {
  const slugs = await getAllMissionSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const mission = await getMissionBySlug(params.slug)
  if (!mission) return { title: 'Mission Not Found' }
  return {
    title:       mission.name,
    description: mission.description,
    openGraph: {
      title:       mission.name,
      description: mission.description,
      images:      mission.featuredImage ? [mission.featuredImage] : [],
    },
  }
}

export default async function MissionPage(
  { params }: { params: { slug: string } }
) {
  const mission = await getMissionBySlug(params.slug)
  if (!mission) notFound()

  const related = await getRelatedMissions(mission.id, 3)

  return <MissionSlugPage mission={mission} related={related} />
}
