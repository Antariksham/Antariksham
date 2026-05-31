import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/modules/search/services/search'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  try {
    const results = await search(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('search route error:', error)
    return NextResponse.json(
      { articles: [], missions: [], learn: [], total: 0, query },
      { status: 500 }
    )
  }
}
