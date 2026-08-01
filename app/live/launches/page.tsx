import type { Metadata }          from 'next'
import { buildPageMetadata } from '@/modules/seo/pageMetadata'
import { getUpcomingLaunches, getRecentLaunches } from '@/modules/launches/services/getLaunches'
import { LaunchTracker }           from '@/modules/launches/components/LaunchTracker'

export const revalidate = 300 // 5 minutes

export const metadata: Metadata = buildPageMetadata({
  path:        '/live/launches',
  title:       'Launch Tracker',
  description: 'Live rocket launch tracker. Upcoming and recent space launches with countdown timers, launch windows, and livestream links.',
})

export default async function LaunchesPage() {
  const [upcoming, recent] = await Promise.all([
    getUpcomingLaunches(10),
    getRecentLaunches(5),
  ])

  return <LaunchTracker initialUpcoming={upcoming} initialRecent={recent} />
}
