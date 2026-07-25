/**
 * Share-target URL builders — Phase 2, Feature 2 (Professional Reader Experience).
 * ─────────────────────────────────────────────────────────────────
 * Pure functions (no DOM) that turn an article's URL + title into the
 * share-intent links used by the sticky desktop share rail and the mobile share
 * fallback menu. Kept separate from the components so the URL encoding is easy
 * to unit-test and reuse.
 */

export type ShareTargetKey = 'x' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email'

export interface ShareTarget {
  key: ShareTargetKey
  /** Accessible label / tooltip. */
  label: string
  /** The share-intent URL to open (or a mailto: for email). */
  href: string
}

/**
 * Build the ordered list of external share-intent URLs for a page.
 * `url` and `title` are encoded defensively so any characters are safe.
 */
export function buildShareTargets({ url, title }: { url: string; title: string }): ShareTarget[] {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const titleAndUrl = encodeURIComponent(`${title} ${url}`)

  return [
    { key: 'x',        label: 'Share on X',         href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'facebook', label: 'Share on Facebook',  href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'linkedin', label: 'Share on LinkedIn',  href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'whatsapp', label: 'Share on WhatsApp',  href: `https://wa.me/?text=${titleAndUrl}` },
    { key: 'telegram', label: 'Share on Telegram',  href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: 'email',    label: 'Share via email',    href: `mailto:?subject=${t}&body=${titleAndUrl}` },
  ]
}
