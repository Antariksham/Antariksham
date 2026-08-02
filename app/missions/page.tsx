import { getMissions, getFeaturedMissions } from '@/modules/missions/services/getMissions'
import { MissionsPage } from '@/modules/missions/components/MissionsPage'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'

export const metadata: Metadata = buildPageMetadata({
  path:        '/missions',
  title:       'Space Missions',
  description: 'Active, upcoming, and historic space missions from NASA, ISRO, SpaceX, ESA and all major agencies — tracked in one place.',
  languages: {
    en:          '/missions',
    hi:          '/hi/missions',
    'x-default': '/missions',
  },
})

export const revalidate = 600

export default async function MissionsRoute() {
  const [{ missions, total }, featured] = await Promise.all([
    getMissions({ page: 1, perPage: 12 }),
    getFeaturedMissions(4),
  ])

  return (
    <MissionsPage
      missions={missions}
      featured={featured}
      total={total}
    />
  )
}
