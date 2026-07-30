'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { MediaItem, MediaSearchResponse, ProviderKey } from './types'

/**
 * Paginated, server-side media search shared by both provider panels.
 *
 * Everything that used to happen in the browser — loading a bucket in one shot
 * and filtering filenames with `.includes()` — now happens in Postgres. The
 * panel holds one page at a time and asks for the next by cursor, so a 50k
 * library costs exactly as much as a 50-image one.
 *
 * Search input is debounced; in-flight responses are dropped if a newer request
 * has started, so fast typing can never render a stale page.
 */

const DEBOUNCE_MS = 250
const PAGE_SIZE   = 48

interface Options {
  provider: ProviderKey
  bucket?:  string
  pageSize?: number
}

export function useMediaSearch({ provider, bucket, pageSize = PAGE_SIZE }: Options) {
  const [search,      setSearch]      = useState('')
  const [debounced,   setDebounced]   = useState('')
  const [items,       setItems]       = useState<MediaItem[]>([])
  const [total,       setTotal]       = useState<number | null>(null)
  const [cursor,      setCursor]      = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Monotonic request id: only the newest query may write to state.
  const requestId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  const buildUrl = useCallback((nextCursor: string | null) => {
    const params = new URLSearchParams({ provider, limit: String(pageSize) })
    // Bucket tabs scope BROWSING, not searching. Someone looking for "mars" is
    // not thinking about which bucket it landed in — scoping the query to the
    // open tab just reports "no matches" while the image sits in the other one.
    if (bucket && !debounced) params.set('bucket', bucket)
    if (debounced)  params.set('q', debounced)
    if (nextCursor) params.set('cursor', nextCursor)
    return `/api/admin/media?${params.toString()}`
  }, [provider, bucket, debounced, pageSize])

  // First page — refetched whenever the provider, bucket or query changes.
  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true); setError(null)
    try {
      const res  = await fetch(buildUrl(null))
      const data = await res.json() as MediaSearchResponse
      if (id !== requestId.current) return           // superseded
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setItems(data.items || [])
      setCursor(data.nextCursor)
      setTotal(typeof data.total === 'number' ? data.total : null)
    } catch (e: any) {
      if (id === requestId.current) setError(e.message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => { load() }, [load])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    const id = requestId.current                     // stay pinned to this query
    setLoadingMore(true)
    try {
      const res  = await fetch(buildUrl(cursor))
      const data = await res.json() as MediaSearchResponse
      if (id !== requestId.current) return
      if (!res.ok) throw new Error(data.error || 'Failed to load more')
      setItems(prev => [...prev, ...(data.items || [])])
      setCursor(data.nextCursor)
    } catch (e: any) {
      if (id === requestId.current) setError(e.message)
    } finally {
      // Always cleared, even when superseded — a stuck flag would disable
      // "Load more" for the rest of the session.
      setLoadingMore(false)
    }
  }, [cursor, loadingMore, buildUrl])

  /** Drop a deleted item locally instead of refetching the whole page. */
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setTotal(prev => (prev === null ? null : Math.max(0, prev - 1)))
  }, [])

  /**
   * Merge an edited item back in place. Refetching after a metadata save would
   * be correct but would also reset scroll and could reorder or drop the row the
   * user is looking at, since search results depend on the fields just changed.
   */
  const updateItem = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  return {
    items, total, loading, loadingMore, error, setError,
    hasMore: !!cursor,
    search, setSearch,
    isSearching: debounced.length > 0,
    refresh: load,
    loadMore,
    removeItem,
    updateItem,
  }
}
