import { NextResponse } from 'next/server'
import { getUpcomingLaunches, getRecentLaunches } from '@/modules/launches/services/getLaunches'

export const revalidate = 300 // 5 minutes

export async function GET() {
  try {
    const [upcoming, recent] = await Promise.all([
      getUpcomingLaunches(10),
      getRecentLaunches(5),
    ])

    return NextResponse.json(
      { upcoming, recent, total: upcoming.length + recent.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    console.error('launches route error:', err)
    return NextResponse.json(
      { upcoming: [], recent: [], total: 0 },
      { status: 500 }
    )
  }
}
