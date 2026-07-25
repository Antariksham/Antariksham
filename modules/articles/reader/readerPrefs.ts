/**
 * Reading preferences model — Phase 2, Feature 2 (Professional Reader Experience).
 * ─────────────────────────────────────────────────────────────────
 * Pure, DOM-free description of the reader's font-size / line-height / reading-
 * width preferences: the option scales, validation, storage keys, and the
 * mapping to CSS custom properties the article reads. Keeping it pure means the
 * component just applies `prefsToVars(prefs)` to an element, and the mapping is
 * unit-testable.
 *
 * The article body honours these vars with sensible fallbacks
 * (`var(--reader-font-scale, 1)`, `var(--reader-line, 1.9)`,
 * `var(--reader-measure, 740px)`), so nothing changes for readers who never
 * touch the controls, and the admin preview (which sets no vars) is unaffected.
 */

export type FontSize = 'sm' | 'base' | 'lg' | 'xl'
export type LineHeight = 'tight' | 'normal' | 'relaxed'
export type ReadingWidth = 'narrow' | 'default' | 'wide'

export interface ReaderPrefs {
  font: FontSize
  line: LineHeight
  width: ReadingWidth
}

export const DEFAULT_PREFS: ReaderPrefs = { font: 'base', line: 'normal', width: 'default' }

/** Multiplier applied to the article body's fluid font size. */
export const FONT_SCALE: Record<FontSize, number> = { sm: 0.92, base: 1, lg: 1.12, xl: 1.28 }
/** Body line-height. */
export const LINE_VALUE: Record<LineHeight, number> = { tight: 1.65, normal: 1.9, relaxed: 2.15 }
/** Reading measure (max column width) in px. */
export const WIDTH_PX: Record<ReadingWidth, number> = { narrow: 660, default: 740, wide: 860 }

export const PREFS_STORAGE_KEY = 'cosmosdaily.reader.prefs.v1'
export const BOOKMARKS_STORAGE_KEY = 'cosmosdaily.bookmarks.v1'
export const POSITION_STORAGE_KEY = 'cosmosdaily.reader.pos.v1'

const FONTS: readonly FontSize[] = ['sm', 'base', 'lg', 'xl']
const LINES: readonly LineHeight[] = ['tight', 'normal', 'relaxed']
const WIDTHS: readonly ReadingWidth[] = ['narrow', 'default', 'wide']

/** Human labels for the segmented controls. */
export const FONT_LABELS: Record<FontSize, string> = { sm: 'Small', base: 'Default', lg: 'Large', xl: 'X-Large' }
export const LINE_LABELS: Record<LineHeight, string> = { tight: 'Tight', normal: 'Normal', relaxed: 'Relaxed' }
export const WIDTH_LABELS: Record<ReadingWidth, string> = { narrow: 'Narrow', default: 'Default', wide: 'Wide' }

/** Coerce any (possibly corrupt / partial) stored value into valid prefs. */
export function normalizePrefs(raw: unknown): ReaderPrefs {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<ReaderPrefs>
  return {
    font:  FONTS.includes(p.font as FontSize) ? (p.font as FontSize) : DEFAULT_PREFS.font,
    line:  LINES.includes(p.line as LineHeight) ? (p.line as LineHeight) : DEFAULT_PREFS.line,
    width: WIDTHS.includes(p.width as ReadingWidth) ? (p.width as ReadingWidth) : DEFAULT_PREFS.width,
  }
}

/** Map preferences to the CSS custom properties the article body consumes. */
export function prefsToVars(prefs: ReaderPrefs): Record<string, string> {
  return {
    '--reader-font-scale': String(FONT_SCALE[prefs.font]),
    '--reader-line':       String(LINE_VALUE[prefs.line]),
    '--reader-measure':    `${WIDTH_PX[prefs.width]}px`,
  }
}

/** The CSS custom-property names this feature owns (for cleanup on unmount). */
export const READER_VAR_NAMES = ['--reader-font-scale', '--reader-line', '--reader-measure'] as const

/** Estimated minutes of reading left given total reading time and progress 0–1. */
export function minutesLeft(readingTime: number, progress: number): number {
  const left = Math.ceil(readingTime * (1 - Math.max(0, Math.min(1, progress))))
  return Math.max(0, left)
}
