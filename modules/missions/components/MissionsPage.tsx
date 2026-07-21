'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MissionCard, MissionStatus } from '@/types/mission'
import { formatDate } from '@/lib/utils'

const STATUSES: { value: MissionStatus | 'all'; label: string }[] = [
  { value: 'all',            label: 'All'           },
  { value: 'active',         label: 'Active'        },
  { value: 'upcoming',       label: 'Upcoming'      },
  { value: 'in-development', label: 'In Development'},
  { value: 'completed',      label: 'Completed'     },
]

const STATUS_COLOR: Record<string, string> = {
  active:          '#2ecc71',
  upcoming:        '#4f8ef7',
  'in-development':'#f39c12',
  completed:       'rgba(var(--ink),0.35)',
  failed:          '#e74c3c',
  cancelled:       '#e74c3c',
}

const PER_PAGE = 12

interface Props {
  missions: MissionCard[]
  featured: MissionCard[]
  total:    number
}

function buildQuery(page: number, status: MissionStatus | 'all') {
  const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) })
  if (status !== 'all') params.set('status', status)
  return params.toString()
}

export function MissionsPage({ missions: initialMissions, total: initialTotal }: Props) {
  const [activeStatus, setActiveStatus] = useState<MissionStatus | 'all'>('all')

  // Infinite scroll seeded with the SSR'd first page; the status filter is
  // applied at the database (see /api/missions) so we only load matching rows.
  const [missions, setMissions] = useState<MissionCard[]>(initialMissions)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(initialTotal)
  const [loading,  setLoading]  = useState(false)

  const loadingRef  = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const firstRender = useRef(true)
  const reachedEnd  = missions.length >= total

  // Status change → reset and load page 1 for that filter from the server.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return } // SSR already has page 1 of "all"
    let cancelled = false
    loadingRef.current = true
    setLoading(true)
    setMissions([])
    setPage(1)
    fetch(`/api/missions?${buildQuery(1, activeStatus)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return
        setMissions(data.missions || [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      })
      .finally(() => { if (!cancelled) { loadingRef.current = false; setLoading(false) } })
    return () => { cancelled = true }
  }, [activeStatus])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || missions.length >= total) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/missions?${buildQuery(page + 1, activeStatus)}`)
      if (res.ok) {
        const data = await res.json()
        const incoming: MissionCard[] = data.missions || []
        setMissions(prev => {
          const seen = new Set(prev.map(m => m.id))
          return [...prev, ...incoming.filter(m => !seen.has(m.id))]
        })
        setPage(p => p + 1)
        if (typeof data.total === 'number') setTotal(data.total)
      }
    } catch {
      /* transient — the sentinel stays and we retry on the next scroll */
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [missions.length, total, page, activeStatus])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  const switching = loading && missions.length === 0

  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>

      {/* Page header */}
      <header className="page-header">
        <div className="container">
          <p className="card-category" style={{ marginBottom: '0.6rem' }}>Mission Tracking</p>
          <h1 className="page-title">Space Missions</h1>
          <p className="page-lede">
            Active, upcoming, and historic missions across all major space agencies — tracked in one place.
          </p>

          <div className="tags-row" style={{ marginTop: '1.25rem' }}>
            {STATUSES.map(s => (
              <button
                key={s.value}
                className={`tag ${activeStatus === s.value ? 'active' : ''}`}
                onClick={() => setActiveStatus(activeStatus === s.value ? 'all' : s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container section">
        {switching ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading…</p>
        ) : missions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛸</div>
            <p style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {activeStatus === 'all' ? 'No missions found.' : 'No missions with this status.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {missions.map(mission => <MissionGridCard key={mission.id} mission={mission} />)}
            </div>

            {/* Infinite scroll: sentinel triggers the next page while more remain */}
            {!reachedEnd && <div ref={sentinelRef} aria-hidden style={{ height: '1px' }} />}

            {loading && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                Loading more…
              </p>
            )}
            {reachedEnd && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                You&rsquo;ve reached the end · {total} mission{total !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Status badge (shared) ─────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || 'rgba(var(--ink),0.35)'
  const isPulse = status === 'active'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: isPulse ? `0 0 8px ${color}` : 'none' }} />
      {status.replace('-', ' ')}
    </span>
  )
}

// ── Grid card ─────────────────────────────────────────────────
function MissionGridCard({ mission }: { mission: MissionCard }) {
  return (
    <a href={`/missions/${mission.slug}`} className="card">
      {mission.featuredImage
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img className="card-image" src={mission.featuredImage} alt={mission.name} loading="lazy" />
        : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🛸</div>}
      <div className="card-body">
        <p className="card-category">
          {mission.agency?.shortName || 'Mission'}{mission.destination ? ` · ${mission.destination}` : ''}
        </p>
        <h3 className="card-title">{mission.name}</h3>
        {mission.description && <p className="card-excerpt">{mission.description}</p>}
        <div className="card-meta" style={{ justifyContent: 'space-between' }}>
          <StatusBadge status={mission.status} />
          {mission.launchDate && <span>{formatDate(mission.launchDate)}</span>}
        </div>
      </div>
    </a>
  )
}
