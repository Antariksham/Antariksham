'use client'

import { useEffect, useState } from 'react'
import { Check, CloudOff, Loader2, AlertTriangle, Circle } from 'lucide-react'
import type { SaveState } from './useAutosave'

function relTime(ts: number): string {
  const secs = Math.round((Date.now() - ts) / 1000)
  if (secs < 10)  return 'just now'
  if (secs < 60)  return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60)  return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
}

/** Compact autosave state pill — Saving… / Saved just now / Last saved N min ago
 *  / Offline / Unsaved changes. Ticks itself so the relative time stays fresh. */
export function SaveStatus({ state, lastSavedAt }: { state: SaveState; lastSavedAt: number | null }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 20000)
    return () => clearInterval(id)
  }, [])

  let icon = <Circle size={11} />
  let text = 'Draft'
  let color = 'rgba(var(--ink),0.55)'

  switch (state) {
    case 'saving':
      icon = <Loader2 size={11} className="spin" />; text = 'Saving…'; color = 'rgba(var(--ink),0.7)'; break
    case 'saved':
      icon = <Check size={11} />; text = lastSavedAt ? (relTime(lastSavedAt) === 'just now' ? 'Saved just now' : `Saved ${relTime(lastSavedAt)}`) : 'Saved'; color = 'var(--green)'; break
    case 'unsaved':
      icon = <Circle size={9} fill="currentColor" />; text = 'Unsaved changes'; color = 'var(--gold)'; break
    case 'offline':
      icon = <CloudOff size={11} />; text = 'Offline — saved locally'; color = 'var(--gold)'; break
    case 'error':
      icon = <AlertTriangle size={11} />; text = 'Save failed — saved locally'; color = 'var(--red)'; break
    default:
      icon = <Circle size={9} />; text = lastSavedAt ? `Saved ${relTime(lastSavedAt)}` : 'Draft'; color = 'rgba(var(--ink),0.55)'
  }

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em',
        color,
      }}
    >
      {icon}
      {text}
    </span>
  )
}
