'use client'

import { useState } from 'react'
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

interface Props {
  missions: MissionCard[]
  featured: MissionCard[]
  total:    number
}

export function MissionsPage({ missions, total }: Props) {
  const [activeStatus, setActiveStatus] = useState<MissionStatus | 'all'>('all')

  const gridItems = activeStatus === 'all'
    ? missions
    : missions.filter(m => m.status === activeStatus)

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
        {missions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛸</div>
            <p style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>No missions found.</p>
          </div>
        ) : gridItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No missions with this status.</p>
        ) : (
          <>
            <div className="grid-3">
              {gridItems.map(mission => <MissionGridCard key={mission.id} mission={mission} />)}
            </div>
            {total > missions.length && (
              <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                Showing {missions.length} of {total} missions
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color }}>
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
