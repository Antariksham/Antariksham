'use client'

import { useState, useRef, useCallback } from 'react'
import { MediaGrid } from './MediaGrid'
import { MediaSearchBar } from './MediaSearchBar'
import { MediaUploadDialog } from './MediaUploadDialog'
import { useMediaSearch } from './useMediaSearch'
import { SUPABASE_BUCKETS, type SupabaseBucket, type MediaItem } from './types'

// Supabase Storage tab. Listing no longer walks the bucket — it queries the
// media_assets index through /api/admin/media, so search runs in Postgres over
// the whole library instead of over the 200 filenames that happened to be
// loaded. Buckets: Article Images / Mission Images.

interface Props {
  pickerMode?:   boolean
  onPick?:       (url: string) => void
  defaultBucket?: SupabaseBucket
}

interface SyncState {
  running:  boolean
  imported: number
  message:  string | null
}

export function SupabaseMediaPanel({ pickerMode, onPick, defaultBucket = 'article-images' }: Props) {
  const [bucket,      setBucket]      = useState<SupabaseBucket>(defaultBucket)
  const [staged,      setStaged]      = useState<File[] | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadNote,  setUploadNote]  = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [dragOver,    setDragOver]    = useState(false)
  const [sync,        setSync]        = useState<SyncState>({ running: false, imported: 0, message: null })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    items, total, loading, loadingMore, error, setError,
    hasMore, search, setSearch, isSearching, refresh, loadMore, removeItem,
  } = useMediaSearch({ provider: 'supabase', bucket })

  // Files are staged, not uploaded. The dialog collects the title, alt text and
  // tags that make them findable — metadata asked for afterwards never arrives.
  const stageFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploadError(null); setUploadNote(null)

    const images = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (images.length === 0) {
      setUploadError('Only image files are allowed (jpg, png, webp, gif)')
      return
    }
    if (images.length < fileList.length) {
      setUploadError(`${fileList.length - images.length} non-image file(s) were ignored`)
    }
    setStaged(images)
  }, [])

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(item.id)
    try {
      const res = await fetch(`/api/admin/media?bucket=${bucket}&id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      if (res.ok) removeItem(item.id)
      else {
        const data = await res.json()
        setError(data.error || 'Delete failed')
      }
    } catch {
      setError('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  // Imports Storage objects uploaded before the index existed. Resumable: each
  // request handles a slice and hands back the offset to continue from, so a
  // bucket with tens of thousands of objects cannot time out mid-run.
  async function runSync() {
    setSync({ running: true, imported: 0, message: null })
    let offset   = 0
    let imported = 0
    try {
      for (;;) {
        const res  = await fetch(`/api/admin/media/sync?bucket=${bucket}&offset=${offset}`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Sync failed')
        imported += data.imported || 0
        offset    = data.nextOffset
        setSync({ running: true, imported, message: null })
        if (data.done) break
      }
      setSync({
        running: false, imported,
        message: imported > 0
          ? `Indexed ${imported} file${imported !== 1 ? 's' : ''} from Storage.`
          : 'Everything in Storage is already indexed.',
      })
      if (imported > 0) refresh()
    } catch (e: any) {
      setSync({ running: false, imported, message: null })
      setError(e.message || 'Sync failed')
    }
  }

  const countLabel = total === null
    ? `${items.length} shown`
    : `${items.length} of ${total} ${isSearching ? 'match' : 'file'}${total !== 1 ? 'es' : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Bucket switcher */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {SUPABASE_BUCKETS.map(b => (
          <button
            key={b.key}
            onClick={() => { setBucket(b.key); setSearch(''); setSync({ running: false, imported: 0, message: null }) }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.15em',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: '6px',
              border: '1px solid', cursor: 'pointer',
              background:  bucket === b.key ? 'var(--accent)' : 'transparent',
              borderColor: bucket === b.key ? 'var(--accent)' : 'rgba(var(--ink),0.12)',
              color:       bucket === b.key ? 'var(--black)'  : 'rgba(var(--ink),0.82)',
              transition: 'all 0.15s',
            }}
          >
            {b.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)' }}>
          {countLabel}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); stageFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'rgba(var(--ink),0.12)'}`,
          borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'rgba(var(--accent-rgb),0.05)' : 'rgba(var(--ink),0.02)', transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef} type="file" multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={e => { stageFiles(e.target.files); e.target.value = '' }}
        />
        <div style={{ fontSize: '26px', marginBottom: '8px', opacity: 0.5 }}>📁</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)', marginBottom: '4px' }}>
          Drop images here or click to upload
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)' }}>
          JPG, PNG, WebP, GIF · Max 5MB each · you&apos;ll add a title and tags next
        </div>
      </div>

      {uploadError && (
        <div style={{ padding: '12px 16px', background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--red)' }}>
          {uploadError}
        </div>
      )}

      {uploadNote && (
        <div style={{ padding: '10px 14px', background: 'rgba(var(--green-rgb),0.08)', border: '1px solid rgba(var(--green-rgb),0.22)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--green)' }}>
          {uploadNote}
        </div>
      )}

      {staged && (
        <MediaUploadDialog
          files={staged}
          bucket={bucket}
          onCancel={() => setStaged(null)}
          onDone={uploaded => {
            setStaged(null)
            setUploadNote(
              uploaded > 0
                ? `Added ${uploaded} image${uploaded !== 1 ? 's' : ''} to the library.`
                : 'Nothing new to add — those images were already in the library.',
            )
            if (uploaded > 0) refresh()
          }}
        />
      )}

      <MediaSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search title, filename, caption, credit…"
        busy={loading && !!search}
        action={{
          label:   sync.running ? `Indexing… ${sync.imported}` : 'Sync from Storage',
          title:   'Import files uploaded before the media index existed',
          onClick: runSync,
          disabled: sync.running,
        }}
      />

      {sync.message && (
        <div style={{ padding: '10px 14px', background: 'rgba(var(--green-rgb),0.08)', border: '1px solid rgba(var(--green-rgb),0.22)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--green)' }}>
          {sync.message}
        </div>
      )}

      <MediaGrid
        items={items}
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
            : 'No images indexed yet — upload one above, or Sync from Storage if you have existing files'
        }
      />
    </div>
  )
}
