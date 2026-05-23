import type { Metadata }          from 'next'
import { getUpcomingLaunches, getRecentLaunches } from '@/modules/launches/services/getLaunches'
import { LaunchTracker }           from '@/modules/launches/components/LaunchTracker'
import { siteConfig }              from '@/config/site'

export const revalidate = 300 // 5 minutes

export const metadata: Metadata = {
  title:       `Launch Tracker — ${siteConfig.name}`,
  description: 'Live rocket launch tracker. Upcoming and recent space launches with countdown timers, launch windows, and livestream links.',
}

export default async function LaunchesPage() {
  const [upcoming, recent] = await Promise.all([
    getUpcomingLaunches(10),
    getRecentLaunches(5),
  ])

  return <LaunchTracker initialUpcoming={upcoming} initialRecent={recent} />
}
