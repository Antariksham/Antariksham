import type { Metadata } from 'next'
import { LaunchesAdmin } from '@/modules/admin/components/LaunchesAdmin'

export const metadata: Metadata = {
  title: 'Launch Tracker — Admin',
}

export const revalidate = 0

export default function AdminLaunchesPage() {
  return <LaunchesAdmin />
}
