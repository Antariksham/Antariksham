/**
 * NASA Image and Video Library (images-api.nasa.gov) — pure response mapping
 * for the /gallery section.
 *
 * NOTE: this is NASA's official, actively-maintained library API (no key
 * required) — deliberately NOT the retired community Mars Rover Photos API.
 *
 * DOM-free and unit-tested; the fetching itself lives in /api/gallery
 * (server proxy with cache, per the house SSR-fallback → client-refresh
 * pattern).
 */

export interface GalleryImage {
  /** nasa_id — stable, used for de-dupe and the details link. */
  id:          string
  title:       string
  /** Preview asset URL (https, space-encoded). */
  thumb:       string
  /** YYYY-MM-DD ('' when absent). */
  date:        string
  center:      string
  credit:      string
  description: string
  /**
   * "View original" target for the lightbox. Defaults to the item's
   * images.nasa.gov details page; other sources (the APOD archive) point at
   * their own permalink instead.
   */
  sourceUrl?:   string
  sourceLabel?: string
}

export interface GallerySearchResult {
  images:    GalleryImage[]
  totalHits: number
  page:      number
}

/** Word-boundary truncation with an ellipsis. */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const at = cut.lastIndexOf(' ')
  return (at > max * 0.6 ? cut.slice(0, at) : cut).trimEnd() + '…'
}

/** Trim, collapse whitespace, cap length — for user queries and chip queries. */
export function sanitizeQuery(q: unknown): string {
  if (typeof q !== 'string') return ''
  return q.replace(/\s+/g, ' ').trim().slice(0, 80)
}

/** Public details page for an item on images.nasa.gov. */
export const nasaDetailsUrl = (id: string) =>
  `https://images.nasa.gov/details/${encodeURIComponent(id)}`

/**
 * Slim the library's search response down to what the gallery renders.
 * Defensive throughout — a malformed item is skipped, never thrown on.
 */
export function slimSearchResponse(json: any, page: number): GallerySearchResult {
  const collection = json?.collection
  const items: any[] = Array.isArray(collection?.items) ? collection.items : []
  const images: GalleryImage[] = []

  for (const item of items) {
    const d = item?.data?.[0]
    const href = item?.links?.find?.((l: any) => typeof l?.href === 'string')?.href
    if (!d?.nasa_id || d.media_type !== 'image' || !href) continue
    images.push({
      id:          String(d.nasa_id),
      title:       String(d.title || d.nasa_id),
      thumb:       href.replace(/^http:\/\//, 'https://').replace(/ /g, '%20'),
      date:        typeof d.date_created === 'string' ? d.date_created.slice(0, 10) : '',
      center:      String(d.center || ''),
      credit:      String(d.photographer || d.secondary_creator || (d.center ? `NASA/${d.center}` : 'NASA')),
      description: typeof d.description === 'string' ? truncate(d.description, 600) : '',
    })
  }

  const totalHits = Number(collection?.metadata?.total_hits) || images.length
  return { images, totalHits, page }
}
