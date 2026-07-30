import type { Metadata } from 'next'
import { AgenciesAdmin } from '@/modules/admin/agencies/AgenciesAdmin'

export const metadata: Metadata = {
  title: 'Space Agencies — Admin',
}

export const revalidate = 0

export default function AdminAgenciesPage() {
  return <AgenciesAdmin />
}
