import type { Metadata } from 'next'
import { CategoriesAdmin } from '@/modules/admin/categories/CategoriesAdmin'

export const metadata: Metadata = {
  title: 'Categories — Admin',
}

export const revalidate = 0

export default function AdminCategoriesPage() {
  return <CategoriesAdmin />
}
