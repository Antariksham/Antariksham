import { getAnalytics } from '@/modules/admin/analytics/getAnalytics'
import { AnalyticsDashboard } from '@/modules/admin/analytics/AnalyticsDashboard'

// Dynamic: reads live event data via the service-role client, so it must render
// per request rather than be statically prerendered at build time.
export const revalidate = 0

export default async function AnalyticsPage() {
  // SSR fallback — the client shell hydrates with this and refreshes from
  // /api/admin/analytics when the range changes.
  const initial = await getAnalytics('week')
  return <AnalyticsDashboard initial={initial} />
}
