'use client'

import { useEffect, useRef } from 'react'
import { highlightCode, countdownParts, isSafeHttpUrl } from './blockUtils'

/**
 * Progressive enhancement for advanced article components — Phase 2, Feature 3.
 * ─────────────────────────────────────────────────────────────────
 * The article body ships as trusted, SEO-friendly, printable static HTML. This
 * client component runs AFTER it renders and upgrades the interactive blocks in
 * place — code copy + syntax highlighting, countdowns, carousels, an image
 * lightbox, sortable tables, embedded PDFs and KaTeX math. Everything degrades
 * gracefully: with JS off, a carousel is a scrollable strip, code is plain
 * monospace, a countdown shows its target date, math shows its raw LaTeX, etc.
 *
 * It resolves its working document from its own `ownerDocument`, so it also
 * works if ever rendered inside the preview iframe. Every upgrader is isolated
 * in try/catch and idempotent (guarded by `data-enh`), so one malformed block
 * can never break the rest of the article.
 */
export function ArticleEnhancer() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const doc = ref.current?.ownerDocument ?? document
    const win = doc.defaultView ?? window
    const roots = Array.from(doc.querySelectorAll<HTMLElement>('.article-body'))
    if (roots.length === 0) return

    const cleanups: Array<() => void> = []
    const reduce = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const each = (sel: string, fn: (el: HTMLElement) => void) => {
      roots.forEach(root => root.querySelectorAll<HTMLElement>(sel).forEach(el => {
        if (el.dataset.enh) return
        el.dataset.enh = '1'
        try { fn(el) } catch { /* one block failing must not break the page */ }
      }))
    }

    // ── Code: syntax highlight + copy button ────────────────────
    each('pre > code', code => {
      const pre = code.parentElement as HTMLElement
      const lang = code.dataset.lang || pre.dataset.lang ||
        (code.className.match(/language-([\w+#-]+)/)?.[1]) || ''
      const raw = code.textContent ?? ''
      code.innerHTML = highlightCode(raw, lang)
      pre.classList.add('code-enh')

      const bar = doc.createElement('div')
      bar.className = 'code-bar'
      if (lang) {
        const tag = doc.createElement('span')
        tag.className = 'code-lang'
        tag.textContent = lang
        bar.appendChild(tag)
      }
      const btn = doc.createElement('button')
      btn.type = 'button'
      btn.className = 'code-copy'
      btn.textContent = 'Copy'
      btn.setAttribute('aria-label', 'Copy code')
      btn.addEventListener('click', () => {
        (win.navigator.clipboard ?? navigator.clipboard)?.writeText(raw).then(() => {
          btn.textContent = 'Copied'
          win.setTimeout(() => { btn.textContent = 'Copy' }, 1500)
        }, () => {})
      })
      bar.appendChild(btn)
      pre.insertBefore(bar, pre.firstChild)
    })

    // ── Countdown ───────────────────────────────────────────────
    each('.countdown[data-to]', el => {
      const target = Date.parse(el.dataset.to || '')
      if (Number.isNaN(target)) return
      const out = doc.createElement('div')
      out.className = 'cd-clock'
      out.setAttribute('role', 'timer')
      out.setAttribute('aria-live', 'off')
      el.appendChild(out)
      const unit = (v: number, l: string) =>
        `<span class="cd-unit"><span class="cd-num">${String(v).padStart(2, '0')}</span><span class="cd-lbl">${l}</span></span>`
      const tick = () => {
        const p = countdownParts(target - Date.now())
        out.innerHTML = unit(p.days, 'days') + unit(p.hours, 'hrs') + unit(p.mins, 'min') + unit(p.secs, 'sec')
        el.classList.toggle('is-done', p.done)
        if (p.done && iv) { win.clearInterval(iv); iv = 0 }
      }
      tick()
      let iv = win.setInterval(tick, 1000)
      cleanups.push(() => { if (iv) win.clearInterval(iv) })
    })

    // ── Carousel: prev/next + dots ──────────────────────────────
    each('.carousel', el => {
      const slides = Array.from(el.children) as HTMLElement[]
      if (slides.length < 2) return
      el.setAttribute('role', 'group')
      el.setAttribute('aria-roledescription', 'carousel')

      // Move slides into a scrolling track so the controls (siblings of the
      // track, over the non-scrolling .carousel) stay put while slides scroll.
      const track = doc.createElement('div')
      track.className = 'carousel-track'
      slides.forEach(s => track.appendChild(s))
      el.appendChild(track)

      const ui = doc.createElement('div')
      ui.className = 'carousel-ui'
      const mkBtn = (cls: string, label: string, dir: number) => {
        const b = doc.createElement('button')
        b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label)
        b.addEventListener('click', () => track.scrollBy({ left: dir * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }))
        return b
      }
      const dots = doc.createElement('div')
      dots.className = 'carousel-dots'
      const dotEls = slides.map((_, i) => {
        const d = doc.createElement('button')
        d.type = 'button'; d.className = 'carousel-dot'; d.setAttribute('aria-label', `Go to slide ${i + 1}`)
        d.addEventListener('click', () => track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }))
        dots.appendChild(d)
        return d
      })
      ui.append(mkBtn('carousel-arrow carousel-prev', 'Previous slide', -1), mkBtn('carousel-arrow carousel-next', 'Next slide', 1), dots)
      el.appendChild(ui)

      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = win.requestAnimationFrame(() => {
          raf = 0
          const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
          dotEls.forEach((d, i) => d.classList.toggle('is-active', i === idx))
        })
      }
      onScroll()
      track.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => { track.removeEventListener('scroll', onScroll); if (raf) win.cancelAnimationFrame(raf) })
    })

    // ── Lightbox for gallery / carousel / opt-in images ─────────
    let overlay: HTMLElement | null = null
    const openLightbox = (src: string, alt: string) => {
      if (!overlay) {
        overlay = doc.createElement('div')
        overlay.className = 'lightbox'
        overlay.innerHTML = '<button class="lightbox-close" aria-label="Close">×</button><img alt="">'
        overlay.addEventListener('click', e => { if (e.target === overlay || (e.target as HTMLElement).classList.contains('lightbox-close')) closeLightbox() })
        doc.body.appendChild(overlay)
      }
      const img = overlay.querySelector('img')!
      img.setAttribute('src', src); img.setAttribute('alt', alt)
      overlay.classList.add('is-open')
      doc.documentElement.style.overflow = 'hidden'
    }
    const closeLightbox = () => {
      overlay?.classList.remove('is-open')
      doc.documentElement.style.overflow = ''
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    doc.addEventListener('keydown', onKey)
    cleanups.push(() => { doc.removeEventListener('keydown', onKey); overlay?.remove(); doc.documentElement.style.overflow = '' })

    each('figure.gallery img, .carousel img, img[data-zoomable]', el => {
      const img = el as HTMLImageElement
      img.classList.add('is-zoomable')
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt || ''))
    })

    // ── Sortable data tables ────────────────────────────────────
    each('.table-wrap[data-sortable] table', el => {
      const table = el as HTMLTableElement
      const heads = Array.from(table.tHead?.rows?.[0]?.cells ?? [])
      const body = table.tBodies[0]
      if (!body || heads.length === 0) return
      heads.forEach((th, col) => {
        th.classList.add('th-sort')
        th.setAttribute('aria-sort', 'none')
        th.tabIndex = 0
        const sort = () => {
          const asc = th.getAttribute('aria-sort') !== 'ascending'
          heads.forEach(h => h.setAttribute('aria-sort', 'none'))
          th.setAttribute('aria-sort', asc ? 'ascending' : 'descending')
          const rows = Array.from(body.rows)
          const val = (r: HTMLTableRowElement) => (r.cells[col]?.textContent ?? '').trim()
          const num = (s: string) => parseFloat(s.replace(/[^0-9.eE+-]/g, ''))
          rows.sort((a, b) => {
            const x = val(a), y = val(b)
            const nx = num(x), ny = num(y)
            const cmp = (!Number.isNaN(nx) && !Number.isNaN(ny) && x !== '' && y !== '')
              ? nx - ny
              : x.localeCompare(y, undefined, { numeric: true })
            return asc ? cmp : -cmp
          })
          rows.forEach(r => body.appendChild(r))
        }
        th.addEventListener('click', sort)
        th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort() } })
      })
    })

    // ── Embedded PDF ────────────────────────────────────────────
    each('.embed-doc[data-kind="pdf"][data-src]', el => {
      const src = el.dataset.src || ''
      if (!isSafeHttpUrl(src)) return
      const frame = doc.createElement('iframe')
      frame.className = 'embed-pdf-frame'
      frame.src = src
      frame.title = 'Embedded PDF'
      frame.loading = 'lazy'
      el.insertBefore(frame, el.firstChild)
      el.classList.add('is-embedded')
    })

    // ── KaTeX math (loaded only when the article actually has math) ──
    const mathEls = roots.flatMap(r => Array.from(r.querySelectorAll<HTMLElement>('.math-block, .math-inline')))
    if (mathEls.length > 0) {
      let cancelled = false
      // JS is code-split — loaded only for articles that actually contain math.
      // The KaTeX CSS ships from the article route page (see page.tsx).
      import('katex')
        .then(mod => {
          if (cancelled) return
          const katex = mod.default
          mathEls.forEach(el => {
            if (el.dataset.enh) return
            el.dataset.enh = '1'
            try {
              katex.render(el.textContent ?? '', el, {
                displayMode: el.classList.contains('math-block'),
                throwOnError: false,
              })
            } catch { /* leave the raw LaTeX visible on failure */ }
          })
        })
        .catch(() => { /* katex unavailable — raw LaTeX stays readable */ })
      cleanups.push(() => { cancelled = true })
    }

    return () => cleanups.forEach(fn => { try { fn() } catch { /* ignore */ } })
  }, [])

  // Invisible marker: only used to resolve the working document on mount.
  return <span ref={ref} hidden aria-hidden="true" data-article-enhancer />
}
