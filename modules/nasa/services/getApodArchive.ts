import { slimApodResponse, type ApodItem, type ApodWindow } from './apodArchive'

/**
 * Server-side APOD window fetch, used to SSR the first page of the archive
 * (so the route ships indexable content rather than an empty shell). The
 * client pages backwards through `/api/apod` from there.
 *
 * Never throws: a missing key, an outage or a bad payload yields an empty
 * list and the page renders its unavailable state.
 */
export async function getApodWindow(win: ApodWindow): Promise<ApodItem[]> {
  const apiKey = process.env.NASA_API_KEY
  if (!apiKey) {
    console.error('getApodWindow: NASA_API_KEY not set')
    return []
  }

  try {
    const url = new URL('https://api.nasa.gov/planetary/apod')
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('start_date', win.start)
    if (win.end) url.searchParams.set('end_date', win.end)
    // Supplies `thumbnail_url` for video entries, which have no still image.
    url.searchParams.set('thumbs', 'true')

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.error('getApodWindow: NASA API error', res.status)
      return []
    }
    return slimApodResponse(await res.json())
  } catch (err) {
    console.error('getApodWindow error:', err)
    return []
  }
}
