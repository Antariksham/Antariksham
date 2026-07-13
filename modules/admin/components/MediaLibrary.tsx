'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────

interface MediaFile {
  name:      string
  url:       string
  size:      number
  mimeType:  string
  createdAt: string
  bucket:    string
}

type Bucket = 'article-images' | 'mission-images'

// ── Helpers ───────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatName(name: string): string {
  // Strip the timestamp prefix (e.g. "1717123456789-my-image.jpg" → "my-image.jpg")
  return name.replace(/^\d{13}-/, '')
}

// ── Main component ────────────────────────────────────────────

interface Props {
  // When used as a picker inside ArticleForm / MissionForm
  pickerMode?:   boolean
  onPick?:       (url: string) => void
  defaultBucket?: Bucket
}

export function MediaLibrary({ pickerMode = false, onPick, defaultBucket = 'article-images' }: Props) {
  const [bucket,     setBucket]     = useState<Bucket>(defaultBucket)
  const [files,      setFiles]      = useState<MediaFile[]>([])
  const [loading,    setLoading]    = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [copiedUrl,  setCopiedUrl]  = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [uploadError,setUploadError]= useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [search,     setSearch]     = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchRef     = useRef<(b: Bucket) => Promise<void>>(async () => {})

  fetchRef.current = async (b: Bucket) => {
    setLoading(true)
    setError(null)
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
  }

  useEffect(() => {
    fetchRef.current(bucket)
  }, [bucket])

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploadError(null)
    setUploading(true)

    const uploads = Array.from(fileList)
    let anyError  = false

    for (const file of uploads) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res  = await fetch(`/api/admin/media?bucket=${bucket}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { anyError = true; setUploadError(data.error || 'Upload failed') }
      } catch {
        anyError = true
        setUploadError('Upload failed — check your connection')
      }
    }

    setUploading(false)
    if (!anyError) fetchRef.current(bucket)
  }, [bucket])

  async function handleDelete(file: MediaFile) {
    if (!confirm(`Delete "${formatName(file.name)}"? This cannot be undone.`)) return
    setDeleting(file.name)
    try {
      const res = await fetch(`/api/admin/media?bucket=${bucket}&name=${encodeURIComponent(file.name)}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.name !== file.name))
      } else {
        const data = await res.json()
        setError(data.error || 'Delete failed')
      }
    } catch {
      setError('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      // Fallback for older Android browsers
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    }
  }

  const filteredFiles = search.trim()
    ? files.filter(f => formatName(f.name).toLowerCase().includes(search.toLowerCase()))
    : files

  // ── Styles ────────────────────────────────────────────────

  const bucketBtnStyle = (active: boolean): React.CSSProperties => ({
    fontFamily:    'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    padding:       '6px 16px',
    borderRadius:  '6px',
    border:        '1px solid',
    cursor:        'pointer',
    background:    active ? 'var(--accent)' : 'transparent',
    borderColor:   active ? 'var(--accent)' : 'rgba(var(--ink),0.12)',
    color:         active ? 'var(--black)'       : 'rgba(var(--ink),0.6)',
    transition:    'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ────────────────────────────────────────── */}
      {!pickerMode && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
            Admin
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, color: 'var(--white)', margin: '0 0 4px' }}>
            Media Library
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.6)', margin: 0 }}>
            Upload and manage images for articles and missions
          </p>
        </div>
      )}

      {/* ── Bucket switcher ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button style={bucketBtnStyle(bucket === 'article-images')} onClick={() => { setBucket('article-images'); setSearch('') }}>
          Article Images
        </button>
        <button style={bucketBtnStyle(bucket === 'mission-images')} onClick={() => { setBucket('mission-images'); setSearch('') }}>
          Mission Images
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', alignSelf: 'center' }}>
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Drop zone / Upload area ───────────────────────── */}
      <div
        onDragOver={e  => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleUpload(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border:        `2px dashed ${dragOver ? 'var(--accent)' : 'rgba(var(--ink),0.12)'}`,
          borderRadius:  '10px',
          padding:       '32px',
          textAlign:     'center',
          cursor:        'pointer',
          background:    dragOver ? 'rgba(79,142,247,0.05)' : 'rgba(var(--ink),0.02)',
          transition:    'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Uploading…
          </div>
        ) : (
          <>
            <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.5 }}>📁</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', marginBottom: '4px' }}>
              Drop images here or click to upload
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.5)' }}>
              JPG, PNG, WebP, GIF, SVG · Max 5MB each
            </div>
          </>
        )}
      </div>

      {/* Upload error */}
      {uploadError && (
        <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--red)' }}>
          {uploadError}
        </div>
      )}

      {/* ── Search ────────────────────────────────────────── */}
      {files.length > 6 && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by filename…"
          style={{
            width:        '100%',
            padding:      '10px 14px',
            background:   'rgba(var(--ink),0.04)',
            border:       '1px solid rgba(var(--ink),0.1)',
            borderRadius: '8px',
            color:        'var(--white)',
            fontFamily:   'var(--font-sans)',
            fontSize: '13px',
            outline:      'none',
            boxSizing:    'border-box',
          }}
        />
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)' }}>
          Loading…
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!loading && files.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>🖼️</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)' }}>
            No images yet — upload your first one above
          </div>
        </div>
      )}

      {/* ── Image grid ────────────────────────────────────── */}
      {!loading && filteredFiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {filteredFiles.map(file => (
            <MediaCard
              key={file.name}
              file={file}
              pickerMode={pickerMode}
              copied={copiedUrl === file.url}
              deleting={deleting === file.name}
              onCopy={() => handleCopy(file.url)}
              onDelete={() => handleDelete(file)}
              onPick={() => onPick?.(file.url)}
            />
          ))}
        </div>
      )}

      {/* No search results */}
      {!loading && search && filteredFiles.length === 0 && files.length > 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)' }}>
          No images match &ldquo;{search}&rdquo;
        </div>
      )}

    </div>
  )
}

// ── Media card ────────────────────────────────────────────────

interface CardProps {
  file:       MediaFile
  pickerMode: boolean
  copied:     boolean
  deleting:   boolean
  onCopy:     () => void
  onDelete:   () => void
  onPick:     () => void
}

function MediaCard({ file, pickerMode, copied, deleting, onCopy, onDelete, onPick }: CardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   'rgba(var(--ink),0.03)',
        border:       `1px solid ${hovered ? 'rgba(var(--ink),0.16)' : 'rgba(var(--ink),0.08)'}`,
        borderRadius: '10px',
        overflow:     'hidden',
        transition:   'border-color 0.2s',
        display:      'flex',
        flexDirection:'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', aspectRatio: '16/10', background: 'var(--surface)', overflow: 'hidden', position: 'relative' }}>
        <img
          src={file.url}
          alt={formatName(file.name)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          fontFamily:  'var(--font-sans)',
          fontSize: '12px',
          color:       'rgba(var(--ink),0.8)',
          overflow:    'hidden',
          whiteSpace:  'nowrap',
          textOverflow:'ellipsis',
        }}>
          {formatName(file.name)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)' }}>
          {formatBytes(file.size)}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          {pickerMode ? (
            <button
              onClick={onPick}
              style={{
                flex:          1,
                fontFamily:    'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding:       '5px 0',
                borderRadius:  '5px',
                border:        '1px solid var(--accent)',
                background:    'rgba(79,142,247,0.12)',
                color:         'var(--accent)',
                cursor:        'pointer',
              }}
            >
              Use this
            </button>
          ) : (
            <button
              onClick={onCopy}
              style={{
                flex:          1,
                fontFamily:    'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding:       '5px 0',
                borderRadius:  '5px',
                border:        `1px solid ${copied ? 'var(--green)' : 'rgba(var(--ink),0.12)'}`,
                background:    copied ? 'rgba(46,204,113,0.1)' : 'transparent',
                color:         copied ? 'var(--green)' : 'rgba(var(--ink),0.5)',
                cursor:        'pointer',
                transition:    'all 0.2s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy URL'}
            </button>
          )}

          <button
            onClick={onDelete}
            disabled={deleting}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding:       '5px 8px',
              borderRadius:  '5px',
              border:        '1px solid rgba(231,76,60,0.2)',
              background:    'transparent',
              color:         deleting ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.6)',
              cursor:        deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? '…' : 'Del'}
          </button>
        </div>
      </div>
    </div>
  )
}
