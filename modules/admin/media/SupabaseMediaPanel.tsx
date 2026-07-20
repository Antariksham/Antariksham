'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MediaGrid } from './MediaGrid'
import { SUPABASE_BUCKETS, type SupabaseBucket, type MediaItem } from './types'

// Supabase Storage tab — same behaviour as the original Media Library (lists a
// bucket directly from Storage via /api/admin/media), now rendered through the
// shared MediaGrid. Buckets: Article Images / Mission Images.

interface Props {
  pickerMode?:   boolean
  onPick?:       (url: string) => void
  defaultBucket?: SupabaseBucket
}

interface RawFile {
  name: string
  url:  string
  size: number
}

function formatName(name: string) {
  return name.replace(/^\d{13}-/, '')
}

export function SupabaseMediaPanel({ pickerMode, onPick, defaultBucket = 'article-images' }: Props) {
  const [bucket,     setBucket]     = useState<SupabaseBucket>(defaultBucket)
  const [files,      setFiles]      = useState<RawFile[]>([])
  const [loading,    setLoading]    = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [uploadError,setUploadError]= useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [search,     setSearch]     = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async (b: SupabaseBucket) => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/admin/media?bucket=${b}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setFiles(data.files || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles(bucket) }, [bucket, fetchFiles])

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploadError(null); setUploading(true)
    let anyError = false
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res  = await fetch(`/api/admin/media?bucket=${bucket}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { anyError = true; setUploadError(data.error || 'Upload failed') }
      } catch {
        anyError = true; setUploadError('Upload failed — check your connection')
      }
    }
    setUploading(false)
    if (!anyError) fetchFiles(bucket)
  }, [bucket, fetchFiles])

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(item.id)
    try {
      const res = await fetch(`/api/admin/media?bucket=${bucket}&name=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      if (res.ok) setFiles(prev => prev.filter(f => f.name !== item.id))
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

  const items: MediaItem[] = files
    .filter(f => !search.trim() || formatName(f.name).toLowerCase().includes(search.toLowerCase()))
    .map(f => ({
      id: f.name, url: f.url, name: formatName(f.name),
      sizeBytes: f.size, provider: 'supabase', kind: 'image',
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Bucket switcher */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {SUPABASE_BUCKETS.map(b => (
          <button
            key={b.key}
            onClick={() => { setBucket(b.key); setSearch('') }}
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
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'rgba(var(--ink),0.12)'}`,
          borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'rgba(79,142,247,0.05)' : 'rgba(var(--ink),0.02)', transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef} type="file" multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)' }}>Uploading…</div>
        ) : (
          <>
            <div style={{ fontSize: '26px', marginBottom: '8px', opacity: 0.5 }}>📁</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)', marginBottom: '4px' }}>
              Drop images here or click to upload
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.72)' }}>
              JPG, PNG, WebP, GIF, SVG · Max 5MB each
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--red)' }}>
          {uploadError}
        </div>
      )}

      {files.length > 6 && (
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by filename…"
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(var(--ink),0.04)', border: '1px solid rgba(var(--ink),0.1)', borderRadius: '8px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
        />
      )}

      <MediaGrid
        items={items}
        loading={loading}
        error={error}
        pickerMode={pickerMode}
        deletingId={deleting}
        onPick={it => onPick?.(it.url)}
        onDelete={handleDelete}
        emptyLabel={search ? `No images match "${search}"` : 'No images yet — upload your first one above'}
      />
    </div>
  )
}
