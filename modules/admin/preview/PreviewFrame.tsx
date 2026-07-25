'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders its children inside a same-origin <iframe> so the preview gets a
 * REAL, independent viewport. This is what makes device simulation honest:
 * the reader's `clamp(…, Xvw, …)` typography and `@media (max-width)` rules
 * resolve against the iframe's own width, not the editor's — so a 390px mobile
 * frame renders exactly like a 390px phone would, not a shrunk desktop.
 *
 * The app's stylesheets (global CSS + next/font faces) live in the parent
 * document; we mirror them into the iframe head once and keep mirroring any
 * that Next injects later (dev HMR), then portal the React tree into the body.
 * The whole frame is scaled to fit the available editor width — the iframe
 * still lays out at full `deviceWidth`, we only shrink it visually.
 */
export function PreviewFrame({
  deviceWidth,
  deviceHeight,
  theme,
  fitWidth,
  children,
}: {
  deviceWidth:  number
  deviceHeight: number
  theme:        'light' | 'dark'
  /** Available width to scale the device into. */
  fitWidth:     number
  children:     ReactNode
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [body, setBody] = useState<HTMLElement | null>(null)

  // Scaffold the iframe document + mirror parent styles, once.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return

    doc.open()
    doc.write('<!DOCTYPE html><html><head></head><body></body></html>')
    doc.close()

    // Carry over the font-family CSS variables set on the parent <html>.
    doc.documentElement.style.cssText = document.documentElement.style.cssText
    // Base href so any relative asset/link resolves against the real origin.
    const base = doc.createElement('base')
    base.href = window.location.origin
    doc.head.appendChild(base)
    // Reset the iframe body so the article column controls all layout.
    doc.body.style.margin = '0'
    doc.body.style.background = 'var(--black)'

    const isStyleNode = (n: Node): n is HTMLElement =>
      n.nodeType === 1 &&
      ((n as HTMLElement).tagName === 'STYLE' ||
        ((n as HTMLElement).tagName === 'LINK' &&
          (n as HTMLLinkElement).rel === 'stylesheet'))

    const mirror = (node: HTMLElement) => {
      doc.head.appendChild(node.cloneNode(true))
    }

    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(n => mirror(n as HTMLElement))

    // Keep styles in sync when Next injects more (dev mode / code-split CSS).
    const observer = new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => { if (isStyleNode(n)) mirror(n as HTMLElement) }))
    })
    observer.observe(document.head, { childList: true })

    setBody(doc.body)
    return () => observer.disconnect()
  }, [])

  // Keep the preview theme in sync with the in-preview toggle.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    doc.documentElement.setAttribute('data-theme', theme)
  }, [theme, body])

  const scale = Math.min(1, fitWidth / deviceWidth)

  return (
    <div
      style={{
        width:  deviceWidth * scale,
        height: deviceHeight * scale,
        margin: '0 auto',
        maxWidth: '100%',
      }}
    >
      <iframe
        ref={iframeRef}
        title="Article preview"
        style={{
          width:  deviceWidth,
          height: deviceHeight,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--black)',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          colorScheme: theme,
        }}
      />
      {body && createPortal(children, body)}
    </div>
  )
}
