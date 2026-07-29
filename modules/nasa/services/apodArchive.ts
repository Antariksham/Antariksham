/**
 * APOD archive — date-window paging over NASA's Astronomy Picture of the Day.
 *
 * All date handling is plain ISO strings in UTC: APOD is keyed by calendar
 * date, never by an instant, so parsing into local `Date`s would shift
 * entries across midnight for some readers and break SSR/hydration parity.
 *
 * Pure and DOM-free (unit-tested with node:test); the fetching lives in
 * `app/api/apod`.
 */

import type { GalleryImage } from '@/modules/gallery/services/nasaImages'

/** The first Astronomy Picture of the Day. */
export const APOD_EPOCH = '1995-06-16'

/** Entries per archive page. */
export const PAGE_DAYS = 24

export interface ApodItem extends GalleryImage {
  /** 'image' | 'video' | (anything else NASA introduces). */
  mediaType: string
  /** Full-resolution still, when NASA published one. */
  hdurl: string | null
}

export interface ApodWindow {
  /** Inclusive ISO start date. */
  start: string
  /**
   * Inclusive ISO end date, or null to mean "through the latest available".
   * Requesting a future end_date makes the API 400, so the newest window
   * deliberately leaves it open.
   */
  end: string | null
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export const isIsoDate = (s: unknown): s is string =>
  typeof s === 'string' && ISO_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

/** Shift an ISO date by whole days (UTC), returning an ISO date. */
export function shiftIso(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`)
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10)
}

/** Whole days from `a` to `b` (negative when `b` precedes `a`). */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  )
}

/** Clamp an ISO date into the archive's valid span. */
export function clampIso(iso: string, latest: string): string {
  if (iso < APOD_EPOCH) return APOD_EPOCH
  if (iso > latest) return latest
  return iso
}

/**
 * The newest window: `PAGE_DAYS` back from today, with an open end so the
 * API returns everything through the most recent entry (its idea of "today"
 * follows US Eastern, which can lag UTC).
 */
export function latestWindow(todayIso: string, days = PAGE_DAYS): ApodWindow {
  const start = shiftIso(todayIso, -(days - 1))
  return { start: start < APOD_EPOCH ? APOD_EPOCH : start, end: null }
}

/**
 * The window immediately older than `oldestIso`, or null once the archive
 * has been walked back to the first APOD. Both bounds are in the past, so
 * the end date is safe to send.
 */
export function olderWindow(oldestIso: string, days = PAGE_DAYS): ApodWindow | null {
  if (oldestIso <= APOD_EPOCH) return null
  const end = shiftIso(oldestIso, -1)
  if (end < APOD_EPOCH) return null
  const start = shiftIso(end, -(days - 1))
  return { start: start < APOD_EPOCH ? APOD_EPOCH : start, end }
}

/** A window ending at a chosen date (the "jump to date" control). */
export function windowEndingAt(iso: string, latest: string, days = PAGE_DAYS): ApodWindow {
  const end = clampIso(iso, latest)
  const start = shiftIso(end, -(days - 1))
  return {
    start: start < APOD_EPOCH ? APOD_EPOCH : start,
    // Leave the end open when it reaches the newest date, so a reader who
    // jumps to today still gets today's entry.
    end: end >= latest ? null : end,
  }
}

/** Canonical apod.nasa.gov permalink, e.g. 2026-07-20 → …/ap260720.html */
export function apodPageUrl(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `https://apod.nasa.gov/apod/ap${y.slice(2)}${m}${d}.html`
}

/**
 * NASA's `copyright` field arrives with embedded newlines and stray labels
 * ("Monica Mesa\n Text: \nCecilia Ch…"); collapse it to one tidy line.
 */
export function cleanCredit(raw: unknown): string {
  if (typeof raw !== 'string') return 'NASA'
  const s = raw.replace(/\s+/g, ' ').trim()
  return s || 'NASA'
}

/**
 * Map an APOD API payload (a single object or a date-range array) into the
 * gallery's image shape, newest first. Defensive: entries without a usable
 * still are skipped rather than throwing, so one odd day can't blank a page.
 */
export function slimApodResponse(json: unknown): ApodItem[] {
  const rows: any[] = Array.isArray(json) ? json : json && typeof json === 'object' ? [json] : []
  const items: ApodItem[] = []

  for (const r of rows) {
    if (!r || !isIsoDate(r.date)) continue
    // Videos have no `url` image; `thumbs=true` supplies `thumbnail_url`.
    const thumb: unknown = r.media_type === 'video' ? r.thumbnail_url || r.url : r.url
    if (typeof thumb !== 'string' || !/^https?:\/\//.test(thumb)) continue

    items.push({
      id:          r.date,
      title:       typeof r.title === 'string' && r.title ? r.title : r.date,
      thumb:       thumb.replace(/^http:\/\//, 'https://'),
      date:        r.date,
      center:      'APOD',
      credit:      cleanCredit(r.copyright),
      description: typeof r.explanation === 'string' ? r.explanation : '',
      mediaType:   typeof r.media_type === 'string' ? r.media_type : 'image',
      hdurl:       typeof r.hdurl === 'string' ? r.hdurl : null,
      sourceUrl:   apodPageUrl(r.date),
      sourceLabel: 'View on apod.nasa.gov',
    })
  }

  // The API returns oldest → newest; the archive reads newest → oldest.
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

/** Merge a newly fetched page into the list, de-duped by date, newest first. */
export function mergeApodPages(existing: ApodItem[], incoming: ApodItem[]): ApodItem[] {
  const byDate = new Map<string, ApodItem>()
  for (const item of existing.concat(incoming)) byDate.set(item.date, item)
  // Array.from, not spread: the project targets ES5, where spreading a Map
  // iterator needs downlevelIteration.
  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date))
}
