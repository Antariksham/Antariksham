// Live ISS position and crew are fetched client-side from the /api/iss proxy
// (see ISSTracker + app/api/iss/route.ts). Server-side live fetches used to live
// here but did no-store network at build time, throwing DYNAMIC_SERVER_USAGE
// during static generation — they were removed in favor of the client-refresh
// pattern (MIGRATION.md §4).

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
