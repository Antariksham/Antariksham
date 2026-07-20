'use client'

import { useState, useEffect, useCallback } from 'react'

// Resend cooldown timer for OTP flows. `start()` begins an N-second countdown;
// `active` is true while it runs and `remaining` is the whole seconds left.
// Timestamp-based so it stays accurate if the tab is backgrounded.
export function useCooldown(seconds: number) {
  const [until, setUntil] = useState(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (until === 0) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [until])

  const remaining = until === 0 ? 0 : Math.max(0, Math.ceil((until - now) / 1000))
  const active = remaining > 0

  const start = useCallback(() => {
    setUntil(Date.now() + seconds * 1000)
    setNow(Date.now())
  }, [seconds])

  return { active, remaining, start }
}
