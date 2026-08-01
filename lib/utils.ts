export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

// Locale for a language code. A date on a Hindi page must read in Hindi —
// "1 सितंबर 2026", not "September 1, 2026" — and Intl already knows how, so
// this only has to hand it the right locale. Admin screens pass nothing and
// stay on en-US, which is what their English-only chrome expects.
function localeFor(lang?: string): string {
  return lang === 'hi' ? 'hi-IN' : 'en-US'
}

export function formatDate(dateString: string, lang?: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(localeFor(lang), {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

export function formatDateShort(dateString: string, lang?: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(localeFor(lang), {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export function timeAgo(dateString: string): string {
  const now  = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60)     return `${diff}s ago`
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  return formatDateShort(dateString)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Slug for names that carry accents — agencies, missions, tags.
 *
 * `slugify` above matches on `\w`, which is ASCII-only, so it *deletes* accented
 * letters rather than folding them: "Centre National d'Études" loses the É and
 * comes out "centre-national-dtudes". Decomposing first and dropping the
 * combining marks keeps the word ("detudes"). Kept separate from `slugify` so
 * existing article slugs are unaffected.
 */
export function slugifyUnicode(input: string, maxLength = 80): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // The cap can land mid-word and leave a trailing dash.
  return slug.slice(0, maxLength).replace(/-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000)     return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)         return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function getCountdown(targetDate: Date) {
  const now  = new Date()
  let diff   = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000))
  const days  = Math.floor(diff / 86400); diff %= 86400
  const hours = Math.floor(diff / 3600);  diff %= 3600
  const mins  = Math.floor(diff / 60)
  const secs  = diff % 60
  return { days, hours, mins, secs }
}
