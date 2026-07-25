/**
 * Advanced article components — pure helpers (Phase 2, Feature 3).
 * ─────────────────────────────────────────────────────────────────
 * DOM-free utilities shared by the client `ArticleEnhancer`: a small XSS-safe
 * syntax highlighter, a countdown formatter, and URL/embed helpers. Kept pure so
 * they run on the server too and are trivially unit-testable.
 */

/** Escape text for safe insertion as HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Syntax highlighting ────────────────────────────────────────
// Lightweight, dependency-free tokenizer. It escapes as it emits, so the output
// is always safe to inject. It is deliberately approximate (good enough to read),
// not a full parser. Comment style + keywords are chosen per language family.

const KEYWORDS: Record<string, Set<string>> = {
  js: new Set('await async break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while yield null undefined true false'.split(' ')),
  py: new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield None True False self'.split(' ')),
  sh: new Set('if then elif else fi for while do done case esac in function return export local readonly echo cd exit set unset source'.split(' ')),
  css: new Set('important media supports keyframes import from to and or not'.split(' ')),
  sql: new Set('select from where insert update delete into values create table drop alter join left right inner outer on group by order having limit as and or not null distinct'.split(' ')),
  default: new Set('if else for while return function class const let var import export from new true false null this and or not def end'.split(' ')),
}

/** Normalise a user-supplied language hint to a keyword/comment family. */
export function normalizeLang(lang?: string | null): string {
  const l = (lang || '').toLowerCase().trim()
  if (['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx', 'json', 'c', 'cpp', 'c++', 'java', 'go', 'rust', 'swift', 'kotlin'].includes(l)) return 'js'
  if (['py', 'python'].includes(l)) return 'py'
  if (['sh', 'bash', 'shell', 'zsh', 'console', 'yaml', 'yml', 'toml', 'ini'].includes(l)) return 'sh'
  if (['css', 'scss', 'less'].includes(l)) return 'css'
  if (['sql'].includes(l)) return 'sql'
  return 'default'
}

// Hash-comment families (#) vs slash-comment families (// , /* */).
const HASH_COMMENT = new Set(['py', 'sh'])

/**
 * Highlight source code into safe HTML with `tok-*` spans.
 * Comments and strings are matched before identifiers so keywords inside them
 * are not re-highlighted.
 */
export function highlightCode(code: string, lang?: string | null): string {
  const fam = normalizeLang(lang)
  const kw = KEYWORDS[fam] ?? KEYWORDS.default
  const commentAlt = HASH_COMMENT.has(fam)
    ? '#[^\\n]*'
    : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'

  const re = new RegExp(
    `(${commentAlt})` +                                   // 1 comment
    `|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)` + // 2 string
    `|(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)` +  // 3 number
    `|([A-Za-z_$][\\w$]*)`,                                // 4 identifier
    'g',
  )

  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, m.index))
    if (m[1]) out += `<span class="tok-com">${escapeHtml(m[1])}</span>`
    else if (m[2]) out += `<span class="tok-str">${escapeHtml(m[2])}</span>`
    else if (m[3]) out += `<span class="tok-num">${escapeHtml(m[3])}</span>`
    else if (m[4]) {
      out += kw.has(m[4])
        ? `<span class="tok-kw">${escapeHtml(m[4])}</span>`
        : escapeHtml(m[4])
    }
    last = re.lastIndex
    if (m.index === re.lastIndex) re.lastIndex++ // guard against zero-width
  }
  out += escapeHtml(code.slice(last))
  return out
}

// ── Countdown ──────────────────────────────────────────────────
export interface Countdown { days: number; hours: number; mins: number; secs: number; done: boolean }

/** Break a millisecond delta into d/h/m/s, clamped at zero once elapsed. */
export function countdownParts(msRemaining: number): Countdown {
  if (msRemaining <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, done: true }
  let s = Math.floor(msRemaining / 1000)
  const days = Math.floor(s / 86400); s -= days * 86400
  const hours = Math.floor(s / 3600); s -= hours * 3600
  const mins = Math.floor(s / 60); s -= mins * 60
  return { days, hours, mins, secs: s, done: false }
}

// ── URLs / embeds ──────────────────────────────────────────────

/** True only for safe absolute http(s) URLs (used before building embeds). */
export function isSafeHttpUrl(url: string): boolean {
  const u = (url || '').trim()
  if (!/^https?:\/\//i.test(u)) return false
  return !/^\s*(javascript|data|vbscript):/i.test(u)
}

/** Extract a YouTube video id from watch/short/embed URLs (or null). */
export function youtubeId(url: string): string | null {
  const m = (url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return m ? m[1] : null
}
