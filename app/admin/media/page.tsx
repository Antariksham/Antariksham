import type { Metadata }   from 'next'
import { MediaLibrary }    from '@/modules/admin/components/MediaLibrary'

export const metadata: Metadata = {
  title: 'Media Library — Admin',
}

export const revalidate = 0

export default function AdminMediaPage() {
  return (
    <div style={{ maxWidth: '1100px' }}>
      <MediaLibrary />
    </div>
  )
}
