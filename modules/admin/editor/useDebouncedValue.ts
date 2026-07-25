'use client'

import { useEffect, useState } from 'react'

// Debounce a fast-changing value so heavy consumers (live preview, HTML
// parsing/validation) re-run on a pause rather than on every keystroke —
// typing never stalls. Shared by the English editor and translation editors.
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
