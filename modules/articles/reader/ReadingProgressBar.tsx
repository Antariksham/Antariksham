'use client'

import { useReadingProgress } from './useReadingProgress'

/**
 * Thin reading-progress bar pinned just under the fixed nav — Phase 2, Feature 2.
 * Fills continuously as the reader scrolls through the article body. Purely
 * decorative (the accessible completion figure lives in the preferences panel's
 * reading-stats block), so it's `aria-hidden`. Uses a GPU-friendly `scaleX`
 * transform. Theme-aware via the accent token.
 */
export function ReadingProgressBar() {
  const { progress } = useReadingProgress()
  return (
    <div className="reader-progress" aria-hidden="true">
      <span className="reader-progress__fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
