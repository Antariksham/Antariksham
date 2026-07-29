'use client'

import { useEffect, useRef } from 'react'
import { nasaDetailsUrl, type GalleryImage } from '../services/nasaImages'

interface Props {
  images:  GalleryImage[]
  index:   number
  onClose: () => void
  onMove:  (nextIndex: number) => void
}

/**
 * Minimal accessible lightbox: Esc/backdrop to close, arrow keys + buttons to
 * navigate (wrapping), body scroll locked while open. Only ever rendered
 * after a user click, so nothing here can affect hydration.
 */
export function Lightbox({ images, index, onClose, onMove }: Props) {
  const img = images[index]
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { closeRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onMove((index + 1) % images.length)
      else if (e.key === 'ArrowLeft') onMove((index - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, images.length, onClose, onMove])

  if (!img) return null

  return (
    <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={img.title}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <button ref={closeRef} type="button" className="gallery-lb-btn gallery-lb-close press"
        onClick={onClose} aria-label="Close">✕</button>

      {images.length > 1 && (
        <>
          <button type="button" className="gallery-lb-btn gallery-lb-prev press" aria-label="Previous image"
            onClick={() => onMove((index - 1 + images.length) % images.length)}>‹</button>
          <button type="button" className="gallery-lb-btn gallery-lb-next press" aria-label="Next image"
            onClick={() => onMove((index + 1) % images.length)}>›</button>
        </>
      )}

      <figure className="gallery-lb-figure" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.thumb} alt={img.title} className="gallery-lb-img" />
        <figcaption className="gallery-lb-caption">
          <p className="gallery-lb-title">{img.title}</p>
          <p className="gallery-lb-meta">
            {[img.date, img.credit].filter(Boolean).join(' · ')}
            {' · '}
            <a href={img.sourceUrl ?? nasaDetailsUrl(img.id)} target="_blank" rel="noopener noreferrer" className="body-link">
              {img.sourceLabel ?? 'View on images.nasa.gov'} ↗
            </a>
          </p>
          {img.description && <p className="gallery-lb-desc">{img.description}</p>}
        </figcaption>
      </figure>
    </div>
  )
}
