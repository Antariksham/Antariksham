import type { Metadata } from 'next'
import { AuthorsAdmin } from '@/modules/admin/components/AuthorsAdmin'

export const metadata: Metadata = {
  title: 'Authors — Admin',
}

export const revalidate = 0

export default function AdminAuthorsPage() {
  return <AuthorsAdmin />
}
