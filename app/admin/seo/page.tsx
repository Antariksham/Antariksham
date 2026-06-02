import type { Metadata } from 'next'
import { SEOCenter }     from '@/modules/admin/components/SEOCenter'

export const metadata: Metadata = {
  title: 'SEO Center — Admin',
}

export const revalidate = 0

export default function AdminSEOPage() {
  return <SEOCenter />
}
