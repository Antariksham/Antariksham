import type { NASAApod } from '@/types/api'

// Fetch APOD directly from NASA — runs server-side only
// NASA_API_KEY is never exposed to the browser
export async function getAPOD(): Promise<NASAApod | null> {
  const NASA_KEY = process.env.NASA_API_KEY
  if (!NASA_KEY) {
    console.error('NASA_API_KEY not set')
    return null
  }

  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`,
      {
        next: { revalidate: 3600 }, // Next.js caches this for 1 hour automatically
      }
    )

    if (!res.ok) {
      console.error('NASA API error:', res.status)
      return null
    }

    const data = await res.json()

    // Map NASA's snake_case to our camelCase type
    return {
      date:           data.date,
      title:          data.title,
      explanation:    data.explanation,
      url:            data.url,
      hdurl:          data.hdurl || null,
      mediaType:      data.media_type,
      copyright:      data.copyright || null,
      serviceVersion: data.service_version || 'v1',
    }

  } catch (err) {
    console.error('getAPOD error:', err)
    return null
  }
}
