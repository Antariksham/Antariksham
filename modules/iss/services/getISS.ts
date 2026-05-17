import type { ISSPosition, ISSCrew } from '@/types/api'

// Fetch real-time ISS position — called client-side every 5 seconds
export async function fetchISSPosition(): Promise<ISSPosition | null> {
  try {
    const res = await fetch('https://api.open-notify.org/iss-now.json', {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('ISS API error')
    const data = await res.json()

    return {
      latitude:  parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      altitude:  408, // ISS average altitude in km
      velocity:  27600, // ISS average velocity in km/h
      timestamp: data.timestamp,
    }
  } catch (err) {
    console.error('fetchISSPosition error:', err)
    return null
  }
}

// Fetch current ISS crew — called server-side, revalidates every hour
export async function getISSCrew(): Promise<ISSCrew[]> {
  try {
    const res = await fetch('https://api.open-notify.org/astros.json', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('Crew API error')
    const data = await res.json()

    // Filter only ISS crew
    return (data.people as ISSCrew[]).filter(
      (p: any) => p.craft === 'ISS'
    )
  } catch (err) {
    console.error('getISSCrew error:', err)
    return []
  }
}

// Convert lat/lng to SVG x/y coordinates on a 1000x500 world map
export function latLngToSVG(
  lat: number,
  lng: number,
  width = 1000,
  height = 500
): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}
