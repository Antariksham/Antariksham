import type { Metadata } from 'next'
import { TagsAdmin } from '@/modules/admin/tags/TagsAdmin'

export const metadata: Metadata = {
  title: 'Tags — Admin',
}

export const revalidate = 0

export default function AdminTagsPage() {
  return <TagsAdmin />
}
