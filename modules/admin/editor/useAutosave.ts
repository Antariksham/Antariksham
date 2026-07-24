'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'offline' | 'error'

interface Backup<T> { data: T; savedAt: number }

/** Throw this from `save` to keep the draft local-only without an error state
 *  (e.g. required fields not yet filled — nothing to persist server-side). */
export class AutosaveSkip extends Error {
  constructor() { super('autosave-skip'); this.name = 'AutosaveSkip' }
}

interface Options<T> {
  /** Unique per article; namespaces the localStorage backup + presence channel. */
  storageKey:  string
  /** The serialisable snapshot to persist. */
  data:        T
  /** Persists to the server. Omit for local-only (unsaved/new articles). May
   *  throw AutosaveSkip to stay local without surfacing an error. */
  save?:       (data: T) => Promise<void>
  debounceMs?: number
  enabled?:    boolean
}

/**
 * Google-Docs-style autosave. Writes a local backup on every change (crash /
 * power-loss / reload safety), debounces a server save after inactivity, tracks
 * online/offline, only saves when something actually changed, surfaces a
 * recoverable draft, and warns when the same article is open in another tab.
 */
export function useAutosave<T>({ storageKey, data, save, debounceMs = 2000, enabled = true }: Options<T>) {
  const [state, setState]           = useState<SaveState>('idle')
  const [lastSavedAt, setLastSaved] = useState<number | null>(null)
  const [restorable, setRestorable] = useState<Backup<T> | null>(null)
  const [conflict, setConflict]     = useState(false)

  const dataJson    = JSON.stringify(data)
  const dataRef     = useRef(data);        dataRef.current = data
  const savedJson   = useRef(dataJson)     // last snapshot known to be persisted
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRun    = useRef(true)
  const bcRef       = useRef<BroadcastChannel | null>(null)
  const tabId       = useRef(Math.random().toString(36).slice(2))

  // ── Mount: recovery check + cross-tab presence ─────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const backup = JSON.parse(raw) as Backup<T>
        if (JSON.stringify(backup.data) !== savedJson.current) setRestorable(backup)
      }
    } catch { /* ignore */ }

    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('autosave:' + storageKey)
      bcRef.current = bc
      bc.onmessage = e => {
        const msg = e.data
        if (!msg || msg.tab === tabId.current) return
        if (msg.type === 'ping') bc.postMessage({ type: 'pong', tab: tabId.current })
        if (msg.type === 'ping' || msg.type === 'pong') setConflict(true)
      }
      bc.postMessage({ type: 'ping', tab: tabId.current })
      return () => bc.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // ── Online / offline ───────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const goOnline  = () => setState(s => (s === 'offline' ? 'unsaved' : s))
    const goOffline = () => setState('offline')
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    if (!navigator.onLine) setState('offline')
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  const persist = useCallback(async () => {
    const current = dataRef.current
    const json = JSON.stringify(current)
    if (json === savedJson.current) return               // nothing changed
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setState('offline'); return }
    if (!save) { savedJson.current = json; setLastSaved(Date.now()); setState('saved'); return }
    setState('saving')
    try {
      await save(current)
      savedJson.current = json
      setLastSaved(Date.now())
      setState('saved')
      try { localStorage.setItem(storageKey, JSON.stringify({ data: current, savedAt: Date.now() })) } catch {}
      bcRef.current?.postMessage({ type: 'saved', tab: tabId.current })
    } catch (err) {
      setState(err instanceof AutosaveSkip ? 'unsaved' : 'error')
    }
  }, [save, storageKey])

  // ── Schedule on change (value-based, so no redundant work) ──
  useEffect(() => {
    if (!enabled) return
    if (firstRun.current) { firstRun.current = false; savedJson.current = dataJson; return }
    if (dataJson === savedJson.current) return
    // Immediate local backup — survives crash / reload before the debounce.
    try { localStorage.setItem(storageKey, JSON.stringify({ data: dataRef.current, savedAt: Date.now() })) } catch {}
    setState(s => (s === 'offline' ? 'offline' : 'unsaved'))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { persist() }, debounceMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [dataJson, enabled, debounceMs, persist, storageKey])

  // ── Public API ─────────────────────────────────────────────
  const restore = useCallback((): T | null => {
    if (!restorable) return null
    const d = restorable.data
    setRestorable(null)
    return d
  }, [restorable])

  const dismissRestore = useCallback(() => {
    setRestorable(null)
    try { localStorage.removeItem(storageKey) } catch {}
  }, [storageKey])

  const saveNow = useCallback(() => { if (timer.current) clearTimeout(timer.current); return persist() }, [persist])

  /** Mark the current snapshot as saved out-of-band (after a manual Save/Publish). */
  const markSaved = useCallback(() => {
    savedJson.current = JSON.stringify(dataRef.current)
    setLastSaved(Date.now())
    setState('saved')
    try { localStorage.removeItem(storageKey) } catch {}
  }, [storageKey])

  return { state, lastSavedAt, restorable: restorable != null, restore, dismissRestore, saveNow, markSaved, conflict }
}
