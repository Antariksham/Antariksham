'use client'

import { useState, useMemo } from 'react'
import { MediaGrid } from './MediaGrid'
import { MediaSearchBar } from './MediaSearchBar'
import { CloudinaryButton } from './CloudinaryButton'
import { useMediaSearch } from './useMediaSearch'
import { deleteCloudinaryMedia } from '@/actions/cloudinary-media'
import type { MediaItem } from './types'

// Cloudinary tab. Reads the same media_assets index as the Supabase tab through
// /api/admin/media, so it gains the search and pagination it never had —
// previously it loaded 200 rows with no way to search them at all. Deletion
// still goes through the server action, which also destroys the remote asset.

// Builds an optimized preview derivative (resized + AVIF/WebP via f_auto) so the
// grid never downloads full-size originals.
function thumb(url: string): string {
  return url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_400,h_250,c_fill,f_auto,q_auto/')
    : url
}

interface Props {
  pickerMode?: boolean
  onPick?:     (url: string) => void
}

export function CloudinaryMediaPanel({ pickerMode, onPick }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    items, total, loading, loadingMore, error, setError,
    hasMore, search, setSearch, isSearching, refresh, loadMore, removeItem,
  } = useMediaSearch({ provider: 'cloudinary' })

  // thumb_url is not populated for Cloudinary rows — the derivative is a pure
  // URL transform, so it is cheaper to build here than to store.
  const withThumbs = useMemo(
    () => items.map(item => ({ ...item, thumbUrl: item.thumbUrl || thumb(item.url) })),
    [items],
  )

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.name}" from Cloudinary? This cannot be undone.`)) return
    setDeleting(item.id)
    const res = await deleteCloudinaryMedia(item.id)
    if (res.error) setError(res.error)
    else removeItem(item.id)
    setDeleting(null)
  }

  const countLabel = total === null
    ? `${items.length} shown`
    : `${items.length} of ${total} ${isSearching ? 'match' : 'image'}${total !== 1 ? 'es' : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>
          Optimized delivery · AVIF/WebP auto · {countLabel}
        </span>
        <CloudinaryButton onDone={refresh} />
      </div>

      <MediaSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search title, filename, caption, credit…"
        busy={loading && !!search}
      />

      <MediaGrid
        items={withThumbs}
        loading={loading}
        error={error}
        pickerMode={pickerMode}
        deletingId={deleting}
        onPick={it => onPick?.(it.url)}
        onDelete={handleDelete}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        emptyLabel={
          isSearching
            ? `No images match "${search}"`
            : 'No Cloudinary images yet — upload one above'
        }
      />
    </div>
  )
}
