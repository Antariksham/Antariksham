// ── HTML sanitizer / normalizer ───────────────────────────────
// Turns whatever lands in the editor (its own contentEditable output, or a
// paste from Google Docs / Word / Notion / Wikipedia / NASA / arXiv / Nature)
// into the clean, lightweight semantic HTML the public `.article-body`
// renderer expects. Runs in the browser (DOMParser). No nested-div soup, no
// inline styles, only an allowlist of tags/attributes/classes.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'mark', 'code', 'kbd', 'sup', 'sub', 'a',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'cite', 'hr', 'pre',
  'img', 'figure', 'figcaption', 'div', 'aside', 'section',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'details', 'summary', 'dl', 'dt', 'dd', 'span', 'iframe',
])

// Tags remapped to their semantic equivalent before the allowlist runs.
const TAG_REMAP: Record<string, string> = {
  b: 'strong', i: 'em', strike: 's', del: 's',
}

const ALLOWED_CLASSES = new Set([
  'callout', 'callout-info', 'callout-warning', 'callout-success', 'callout-danger',
  'callout-title', 'checklist', 'table-wrap', 'fact-card', 'fact-label', 'gallery',
  'embed', 'embed-video', 'references', 'references-title', 'footnotes',
  'footnotes-title', 'footnote-ref', 'math-block', 'math-inline', 'timeline',
  't-when', 'faq', 'credit',
])

// Bare <div>/<span> are only kept when they carry one of these structural
// classes; otherwise they're unwrapped (div→contents, promoted to <p> at the
// block level) so we never emit meaningless wrappers.
const STRUCTURAL_DIV_CLASSES = ['callout', 'table-wrap', 'embed', 'gallery']
const STRUCTURAL_SPAN_CLASSES = ['math-inline', 'footnote-ref', 'credit', 't-when', 'fact-label', 'callout-title']

const ATTR_ALLOWLIST: Record<string, Set<string>> = {
  a:       new Set(['href', 'title']),
  img:     new Set(['src', 'alt', 'title', 'loading']),
  iframe:  new Set(['src', 'title', 'allow', 'allowfullscreen']),
  td:      new Set(['colspan', 'rowspan']),
  th:      new Set(['colspan', 'rowspan', 'scope']),
  li:      new Set(['data-checked']),
  ol:      new Set(['start']),
  details: new Set(['open']),
}

// Only these iframe hosts are allowed (video/embeds). Everything else is dropped.
const IFRAME_HOST_ALLOWLIST = [
  'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com',
  'player.vimeo.com', 'platform.twitter.com',
]

function safeUrl(url: string): string | null {
  const trimmed = (url || '').trim()
  if (!trimmed) return null
  // Allow protocol-relative, root-relative, anchors, mailto, and http(s).
  if (/^(https?:)?\/\//i.test(trimmed) || /^\/(?!\/)/.test(trimmed) || /^(#|mailto:|tel:)/i.test(trimmed)) {
    // Explicitly block javascript:/data: (XSS vectors) that slipped patterns.
    if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return null
    return trimmed
  }
  return null
}

function keepAllowedClasses(el: Element) {
  const kept = Array.from(el.classList).filter(c => ALLOWED_CLASSES.has(c))
  el.removeAttribute('class')
  if (kept.length) el.setAttribute('class', kept.join(' '))
}

function unwrap(el: Element) {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function cleanElement(el: Element, doc: Document) {
  // Depth-first so unwrapping a parent still processes its (already-clean) kids.
  Array.from(el.children).forEach(child => cleanElement(child, doc))

  let tag = el.tagName.toLowerCase()

  // Remap b/i/strike → semantic tags.
  if (TAG_REMAP[tag]) {
    const replacement = doc.createElement(TAG_REMAP[tag])
    while (el.firstChild) replacement.appendChild(el.firstChild)
    el.replaceWith(replacement)
    el = replacement
    tag = replacement.tagName.toLowerCase()
  }

  // Drop dangerous / non-content tags entirely.
  if (['script', 'style', 'meta', 'link', 'noscript', 'head', 'title', 'form', 'input', 'button', 'object', 'embed'].includes(tag)) {
    el.remove()
    return
  }

  if (!ALLOWED_TAGS.has(tag)) { unwrap(el); return }

  // <span>: keep only structural spans, otherwise unwrap.
  if (tag === 'span') {
    const hasStructural = STRUCTURAL_SPAN_CLASSES.some(c => el.classList.contains(c))
    if (!hasStructural) { unwrap(el); return }
  }

  // <div>: keep only structural containers; convert a plain block div to <p>
  // when it holds only inline content, else unwrap.
  if (tag === 'div') {
    const hasStructural = STRUCTURAL_DIV_CLASSES.some(c => el.classList.contains(c))
    if (!hasStructural) { unwrap(el); return }
  }

  // <iframe>: allow only from the embed host allowlist.
  if (tag === 'iframe') {
    const src = el.getAttribute('src') || ''
    let host = ''
    try { host = new URL(src, window.location.origin).host } catch { host = '' }
    if (!IFRAME_HOST_ALLOWLIST.includes(host)) { el.remove(); return }
  }

  // Strip every attribute except the per-tag allowlist; always drop style/event
  // handlers / contenteditable, and sanitize URLs.
  const allowed = ATTR_ALLOWLIST[tag]
  Array.from(el.attributes).forEach(attr => {
    const name = attr.name.toLowerCase()
    if (name === 'class') return // handled below
    if (!allowed || !allowed.has(name)) { el.removeAttribute(attr.name); return }
    if (name === 'href' || name === 'src') {
      const ok = safeUrl(attr.value)
      if (ok == null) el.removeAttribute(attr.name)
      else el.setAttribute(attr.name, ok)
    }
  })

  keepAllowedClasses(el)

  // External links get rel/target for safety + new-tab reading.
  if (tag === 'a' && /^https?:/i.test(el.getAttribute('href') || '')) {
    el.setAttribute('target', '_blank')
    el.setAttribute('rel', 'noopener noreferrer')
  }
}

/** Collapse whitespace-only text and strip empty inline elements. */
function pruneEmpty(root: Element) {
  const VOID = new Set(['br', 'hr', 'img', 'iframe', 'td', 'th'])
  const INLINE_DROPPABLE = new Set(['strong', 'em', 'u', 's', 'mark', 'code', 'sup', 'sub', 'a', 'span'])
  Array.from(root.querySelectorAll('*')).reverse().forEach(el => {
    const tag = el.tagName.toLowerCase()
    if (VOID.has(tag)) return
    if (INLINE_DROPPABLE.has(tag) && el.textContent!.trim() === '' && !el.querySelector('img,br')) {
      el.remove()
    }
  })
}

/**
 * Clean an HTML string into the canonical article-body form.
 * `wrapLoose` promotes stray top-level text/inline nodes into <p> (used for
 * paste, where fragments arrive without block wrappers).
 */
export function sanitizeHtml(html: string, opts: { wrapLoose?: boolean } = {}): string {
  if (typeof window === 'undefined' || !html) return html || ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body

  Array.from(body.children).forEach(child => cleanElement(child, doc))

  if (opts.wrapLoose) {
    // Wrap any bare inline/text run at the top level in a paragraph.
    const blockTags = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'figure', 'table', 'div', 'aside', 'details', 'section'])
    let buffer: Node[] = []
    const flush = () => {
      if (!buffer.length) return
      const p = doc.createElement('p')
      const first = buffer[0]
      first.parentNode?.insertBefore(p, first)
      buffer.forEach(n => p.appendChild(n))
      buffer = []
    }
    Array.from(body.childNodes).forEach(node => {
      const isBlock = node.nodeType === 1 && blockTags.has((node as Element).tagName.toLowerCase())
      if (isBlock) { flush() }
      else if (node.nodeType === 3 && !node.textContent!.trim()) { /* skip pure whitespace */ }
      else { buffer.push(node) }
    })
    flush()
  }

  pruneEmpty(body)

  return body.innerHTML.trim()
}

/** Word count from HTML — strips tags/entities. Shared by editor + validation. */
export function wordCountFromHtml(html: string): number {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}
