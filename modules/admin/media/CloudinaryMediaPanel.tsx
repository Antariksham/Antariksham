'use client'

import { useState, useEffect, useCallback } from 'react'
import { MediaGrid } from './MediaGrid'
import { CloudinaryButton } from './CloudinaryButton'
import { listCloudinaryMedia, deleteCloudinaryMedia } from '@/actions/cloudinary-media'
import type { MediaItem, CloudinaryItem } from './types'

// Builds an optimized preview derivative (resized + AVIF/WebP via f_auto) so the
// grid never downloads full-size originals.
function thumb(url: string): string {
  return url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_400,h_250,c_fill,f_auto,q_auto/')
    : url
}

function mapItem(c: CloudinaryItem): MediaItem {
  return {
    id: c.id, url: c.url, thumbUrl: thumb(c.url), name: c.filename,
    sizeBytes: c.sizeBytes, provider: 'cloudinary', kind: 'image',
  }
}

interface Props {
  pickerMode?: boolean
  onPick?:     (url: string) => void
}

export function CloudinaryMediaPanel({ pickerMode, onPick }: Props) {
  const [items,    setItems]    = useState<MediaItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    const res = await listCloudinaryMedia()
    if (res.error) setError(res.error)
    setItems((res.items || []).map(mapItem))
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.name}" from Cloudinary? This cannot be undone.`)) return
    setDeleting(item.id)
    const res = await deleteCloudinaryMedia(item.id)
    if (res.error) setError(res.error)
    else setItems(prev => prev.filter(i => i.id !== item.id))
    setDeleting(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>
          Optimized delivery · AVIF/WebP auto · {items.length} image{items.length !== 1 ? 's' : ''}
        </span>
        <CloudinaryButton onDone={refresh} />
      </div>

      <MediaGrid
        items={items}
        loading={loading}
        error={error}
        pickerMode={pickerMode}
        deletingId={deleting}
        onPick={it => onPick?.(it.url)}
        onDelete={handleDelete}
        emptyLabel="No Cloudinary images yet — upload one above"
      />
    </div>
  )
}
