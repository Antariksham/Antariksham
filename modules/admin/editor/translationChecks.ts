// ── Translation structure checks ──────────────────────────────
// The bilingual rule is "keep the same HTML tags as the English version —
// translate only the words between them" (only the text differs, so the
// translated page renders identically). These helpers enforce that rule
// automatically: they reduce both HTML strings to a tag+class signature and
// compare. Browser-only (DOMParser); returns a neutral result during SSR.

export interface StructureDiff {
  /** Position in the flattened tag sequence where the first mismatch occurs. */
  index:      number
  english:    string | null
  translated: string | null
}

export interface StructureReport {
  comparable: boolean          // false when either side is empty / SSR
  match:      boolean
  diffs:      number
  first:      StructureDiff | null
  enTags:     number
  trTags:     number
}

/** Flatten HTML into a depth-first sequence of `tag.class.list` signatures. */
export function tagSignature(html: string): string[] {
  if (typeof window === 'undefined' || !html) return []
  const out: string[] = []
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    const walk = (el: Element) => {
      for (const child of Array.from(el.children)) {
        const cls = (child.getAttribute('class') || '').split(/\s+/).filter(Boolean).sort()
        out.push(child.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : ''))
        walk(child)
      }
    }
    walk(doc.body)
  } catch { /* SSR / parse failure → empty */ }
  return out
}

export function compareStructure(englishHtml: string, translatedHtml: string): StructureReport {
  const en = tagSignature(englishHtml)
  const tr = tagSignature(translatedHtml)
  if (en.length === 0 || tr.length === 0) {
    return { comparable: false, match: false, diffs: 0, first: null, enTags: en.length, trTags: tr.length }
  }
  let diffs = 0
  let first: StructureDiff | null = null
  const len = Math.max(en.length, tr.length)
  for (let i = 0; i < len; i++) {
    if (en[i] !== tr[i]) {
      diffs++
      if (!first) first = { index: i, english: en[i] ?? null, translated: tr[i] ?? null }
    }
  }
  return { comparable: true, match: diffs === 0, diffs, first, enTags: en.length, trTags: tr.length }
}
