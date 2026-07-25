// ── Content analysis ──────────────────────────────────────────
// Parses the article body HTML into the structural facts the publish
// validator and SEO workspace reason about. Runs in the browser (DOMParser)
// with a regex fallback for SSR so it never throws.

export interface ContentImage { alt: string; hasAlt: boolean }
export interface ContentLink   { href: string; external: boolean }
export interface ContentHeading { level: number; text: string }

export interface ContentStats {
  words:        number
  characters:   number
  sentences:    number
  paragraphs:   number
  headings:     ContentHeading[]
  h2Count:      number
  images:       ContentImage[]
  links:        ContentLink[]
  internalLinks: number
  externalLinks: number
  missingAlt:   number
  hasReferences: boolean
  hasHeadingHierarchyIssue: boolean
  readingTimeMin: number
}

const SITE_HOSTS = ['antariksham.org', 'cosmosdaily.space', 'localhost']

function isExternal(href: string): boolean {
  if (!href) return false
  if (href.startsWith('/') || href.startsWith('#')) return false
  if (/^https?:\/\//i.test(href)) {
    try {
      const host = new URL(href).host.replace(/^www\./, '')
      return !SITE_HOSTS.some(h => host === h || host.endsWith('.' + h))
    } catch { return true }
  }
  return false
}

export function analyzeContent(html: string): ContentStats {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  const characters = text.length
  const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length || (words > 0 ? 1 : 0)

  let headings: ContentHeading[] = []
  let images: ContentImage[] = []
  let links: ContentLink[] = []
  let paragraphs = 0
  let hasReferences = false

  if (typeof window !== 'undefined' && html) {
    try {
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
      headings = Array.from(doc.querySelectorAll('h2, h3, h4')).map(h => ({
        level: Number(h.tagName.slice(1)),
        text:  (h.textContent || '').trim(),
      }))
      images = Array.from(doc.querySelectorAll('img')).map(img => {
        const alt = img.getAttribute('alt') || ''
        return { alt, hasAlt: alt.trim().length > 0 }
      })
      links = Array.from(doc.querySelectorAll('a')).map(a => {
        const href = a.getAttribute('href') || ''
        return { href, external: isExternal(href) }
      })
      paragraphs = doc.querySelectorAll('p').length
      hasReferences = !!doc.querySelector('.references, .footnotes')
    } catch { /* fall through to regex */ }
  }

  if (headings.length === 0) {
    const hs = html.match(/<h([234])[^>]*>(.*?)<\/h[234]>/gi) || []
    headings = hs.map(h => {
      const m = h.match(/<h([234])/i)
      return { level: m ? Number(m[1]) : 2, text: h.replace(/<[^>]*>/g, '').trim() }
    })
  }
  if (paragraphs === 0) paragraphs = (html.match(/<p[\s>]/gi) || []).length

  const h2Count = headings.filter(h => h.level === 2).length
  const missingAlt = images.filter(i => !i.hasAlt).length
  const externalLinks = links.filter(l => l.external).length
  const internalLinks = links.length - externalLinks

  // Heading hierarchy: flag a jump that skips a level (e.g. h2 → h4).
  let hasHeadingHierarchyIssue = false
  let prev = 1
  for (const h of headings) {
    if (h.level - prev > 1 && prev !== 1) { hasHeadingHierarchyIssue = true; break }
    prev = h.level
  }

  return {
    words, characters, sentences, paragraphs,
    headings, h2Count, images, links,
    internalLinks, externalLinks, missingAlt,
    hasReferences, hasHeadingHierarchyIssue,
    readingTimeMin: Math.max(1, Math.round(words / 200)),
  }
}
