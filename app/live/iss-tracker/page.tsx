import { ISSTracker } from '@/modules/iss/components/ISSTracker'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'ISS Live Tracker',
  description: 'Track the International Space Station in real-time. Live position, altitude, velocity and current crew.',
}

// Static shell (SSR-fallback → client-refresh pattern, MIGRATION.md §4). The live
// position and crew stream in client-side from the /api/iss proxy, so the server
// render does no network — previously it did a no-store fetch here, which threw
// DYNAMIC_SERVER_USAGE during static generation.
export default function ISSTrackerPage() {
  return <ISSTracker initialPosition={null} crew={[]} />
}
