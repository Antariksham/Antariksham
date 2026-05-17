import { fetchISSPosition, getISSCrew } from '@/modules/iss/services/getISS'
import { ISSTracker } from '@/modules/iss/components/ISSTracker'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'ISS Live Tracker',
  description: 'Track the International Space Station in real-time. Live position, altitude, velocity and current crew.',
}

export const revalidate = 30

export default async function ISSTrackerPage() {
  const [initialPosition, crew] = await Promise.all([
    fetchISSPosition(),
    getISSCrew(),
  ])

  return (
    <ISSTracker
      initialPosition={initialPosition}
      crew={crew}
    />
  )
}
