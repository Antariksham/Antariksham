/**
 * Automatic Table of Contents — pure, isomorphic heading extraction.
 * ─────────────────────────────────────────────────────────────────
 * Phase 2, Feature 1. This module turns an article's trusted body HTML into
 * (a) the SAME HTML with a stable `id` anchor injected on every H2/H3/H4 and
 * (b) a nested heading tree the UI renders as a Table of Contents.
 *
 * WHY IT LIVES HERE (not in the component): it has NO React / DOM / browser
 * dependency, so it runs identically on the server (production reader) and in
 * the browser (admin live-preview). Because the output is deterministic, the
 * ids injected during SSR match the ones the client would compute — hydration
 * stays clean, anchors resolve, and the TOC is generated automatically for
 * every article without any manual authoring. Being pure also makes it trivial
 * to unit-test (see toc.test.ts).
 *
 * The block editor emits clean semantic headings (`<h2>…</h2>`), so a regex
 * pass over the trusted HTML is sufficient and avoids pulling in a DOM parser.
 */

/** A single entry in the Table of Contents. */
export interface TocItem {
  /** Slugified anchor id, matching the `id` injected on the heading. */
  id: string
  /** Visible label (heading text with inline tags/entities stripped). */
  text: string
  /** Heading depth — 2, 3 or 4. */
  level: 2 | 3 | 4
  /** Nested sub-headings (an H3 under an H2, an H4 under an H3, …). */
  children: TocItem[]
}

/** Result of processing an article body for its Table of Contents. */
export interface TocResult {
  /** The input HTML with a stable `id` added to each H2/H3/H4. */
  html: string
  /** The headings as a nested tree, ready to render. */
  items: TocItem[]
}

// Matches an <h2>/<h3>/<h4> …</h_> pair. `\1` back-reference keeps the close
// tag level-matched; `[\s\S]*?` (non-greedy) captures inline markup inside the
// heading. Content is trusted (block-editor output), so headings never nest.
const HEADING_RE = /<h([2-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi

// Pulls an existing id="…" out of a heading's attribute string (authored ids
// are respected rather than overwritten).
const ID_ATTR_RE = /(?:^|\s)id\s*=\s*["']([^"']+)["']/i

// "Anything that is not a Unicode letter or number." Built through the RegExp
// constructor rather than a `/…/gu` literal so the project's es5 `target` (which
// rejects the unicode `u` flag on literals) still compiles — the flag is only
// evaluated at runtime, where Node and modern browsers support it. Keeping it
// unicode-aware means non-Latin headings (e.g. Hindi) still yield real anchors.
const NON_SLUG_CHARS = new RegExp('[^\\p{L}\\p{N}]+', 'gu')

/**
 * Turn heading text into a URL-safe anchor slug.
 * Unicode-aware (`\p{L}\p{N}`) so non-Latin scripts — e.g. Hindi/Devanagari
 * translations — produce meaningful, non-empty anchors instead of collapsing
 * to nothing.
 */
export function slugify(input: string): string {
  const slug = input
    .replace(/<[^>]+>/g, ' ')       // strip any inline tags
    .replace(/&[a-z0-9#]+;/gi, ' ') // strip HTML entities
    .trim()
    .toLowerCase()
    .replace(NON_SLUG_CHARS, '-')     // everything but letters/numbers → hyphen
    .replace(/^-+|-+$/g, '')          // trim leading/trailing hyphens
  return slug
}

/** Strip a heading's inner HTML down to plain, whitespace-collapsed text. */
function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Return `base` if unused, otherwise `base-2`, `base-3`, … — guaranteeing every
 * heading gets a distinct, collision-free anchor even when two headings share
 * the same text. `used` is mutated to record what's taken.
 */
function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  const id = `${base}-${n}`
  used.add(id)
  return id
}

/** Fold a flat, in-order heading list into a nested tree by level. */
function nest(flat: Array<{ id: string; text: string; level: 2 | 3 | 4 }>): TocItem[] {
  const root: TocItem[] = []
  const stack: TocItem[] = [] // ancestors of the current heading, shallow→deep

  for (const h of flat) {
    const item: TocItem = { id: h.id, text: h.text, level: h.level, children: [] }
    // Pop any siblings/deeper headings so the stack top is a valid parent.
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop()
    if (stack.length === 0) root.push(item)
    else stack[stack.length - 1].children.push(item)
    stack.push(item)
  }
  return root
}

/**
 * Process an article body: inject stable heading ids and extract the TOC tree.
 *
 * - Empty/whitespace-only headings are skipped (no id, not listed).
 * - Headings that already carry an `id` keep it (authored anchors win) and are
 *   still listed; auto-generated ids avoid colliding with them.
 * - Returns the original HTML untouched apart from the added `id` attributes,
 *   so it is safe to feed straight back into the existing `.article-body`
 *   renderer with no other behavioural change.
 */
export function buildToc(html: string): TocResult {
  if (!html) return { html: '', items: [] }

  const used = new Set<string>()
  const flat: Array<{ id: string; text: string; level: 2 | 3 | 4 }> = []

  // First pass: register any authored ids so auto ids never collide with them.
  let m: RegExpExecArray | null
  HEADING_RE.lastIndex = 0
  while ((m = HEADING_RE.exec(html)) !== null) {
    const existing = ID_ATTR_RE.exec(m[2])
    if (existing) used.add(existing[1])
  }

  // Second pass: inject ids where missing and collect the heading list.
  const out = html.replace(HEADING_RE, (whole, lvl: string, attrs: string, inner: string) => {
    const level = Number(lvl) as 2 | 3 | 4
    const text = toText(inner)
    if (!text) return whole // ignore empty headings entirely

    const existing = ID_ATTR_RE.exec(attrs)
    if (existing) {
      flat.push({ id: existing[1], text, level })
      return whole // authored id preserved, attributes untouched
    }

    const id = uniqueId(slugify(text) || 'section', used)
    flat.push({ id, text, level })
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
  })

  return { html: out, items: nest(flat) }
}

/** Flatten a TOC tree back into an in-order list of ids (scroll-spy helper). */
export function tocIds(items: TocItem[]): string[] {
  const out: string[] = []
  const walk = (list: TocItem[]) => {
    for (const it of list) {
      out.push(it.id)
      if (it.children.length) walk(it.children)
    }
  }
  walk(items)
  return out
}

/** Total number of headings in the tree (used to decide whether to show a TOC). */
export function tocCount(items: TocItem[]): number {
  return tocIds(items).length
}
