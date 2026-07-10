'use client'

import { useState } from 'react'
import type { MissionCard, MissionStatus } from '@/types/mission'
import { formatDate } from '@/lib/utils'

const STATUSES: { value: MissionStatus | null; label: string }[] = [
  { value: null,             label: 'All'           },
  { value: 'active',        label: 'Active'        },
  { value: 'upcoming',      label: 'Upcoming'      },
  { value: 'in-development',label: 'In Development'},
  { value: 'completed',     label: 'Completed'     },
]

const STATUS_COLOR: Record<string, string> = {
  active:         '#34d897',
  upcoming:       '#3b9eff',
  'in-development':'#c9a96e',
  completed:      'rgba(240,244,250,0.35)',
  failed:         '#f05a5a',
  cancelled:      '#f05a5a',
}

const TYPE_LABEL: Record<string, string> = {
  crewed:         'Crewed',
  robotic:        'Robotic',
  flyby:          'Flyby',
  orbiter:        'Orbiter',
  lander:         'Lander',
  rover:          'Rover',
  'sample-return':'Sample Return',
  telescope:      'Telescope',
}

interface Props {
  missions: MissionCard[]
  featured: MissionCard[]
  total:    number
}

export function MissionsPage({ missions, featured, total }: Props) {
  const [activeStatus, setActiveStatus] = useState<MissionStatus | null>(null)

  // Lead card: first featured mission (or first mission if none featured)
  const lead = featured.length > 0 ? featured[0] : missions[0] || null

  // Grid: all missions when no filter, filtered missions when filter active
  const gridItems = activeStatus
    ? missions.filter(m => m.status === activeStatus)
    : missions

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px) 28px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', display: 'block', marginBottom: '12px' }}>
            Mission Tracking
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, color: '#f0f4fa', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Space Missions
          </h1>
          <p style={{ color: 'rgba(240,244,250,0.6)', fontSize: 'clamp(14px,1.5vw,16px)', margin: '0 0 28px', maxWidth: '540px' }}>
            Active, upcoming, and historic missions across all major space agencies — tracked in one place.
          </p>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <FilterBtn
                key={s.label}
                active={activeStatus === s.value}
                onClick={() => setActiveStatus(activeStatus === s.value ? null : s.value)}
                color={s.value ? STATUS_COLOR[s.value] : '#3b9eff'}
              >
                {s.label}
              </FilterBtn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(20px,5vw,48px)' }}>

        {/* Empty state */}
        {missions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛸</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)' }}>
              No missions found
            </p>
          </div>
        )}

        {/* ── Featured lead card ───────────────────── */}
        {lead && !activeStatus && (
          <a href={`/missions/${lead.slug}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 'clamp(24px,4vw,40px)' }}>
            <div
              style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              {/* Hero image */}
              {lead.featuredImage ? (
                <div style={{ width: '100%', height: 'clamp(220px,35vw,400px)', overflow: 'hidden' }}>
                  <img src={lead.featuredImage} alt={lead.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '280px', background: 'linear-gradient(135deg, #080f20 0%, #0c1830 50%, #070e1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '64px', opacity: 0.3 }}>🚀</span>
                </div>
              )}

              <div style={{ padding: 'clamp(20px,3vw,36px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <StatusBadge status={lead.status} />
                  {lead.agency && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.45)' }}>
                      {lead.agency.shortName}
                    </span>
                  )}
                  {lead.destination && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.05em' }}>
                      → {lead.destination}
                    </span>
                  )}
                </div>

                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 400, color: '#f0f4fa', lineHeight: 1.12, margin: '0 0 14px', letterSpacing: '-0.01em', maxWidth: '800px' }}>
                  {lead.name}
                </h2>

                {lead.description && (
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(14px,1.5vw,16px)', color: 'rgba(240,244,250,0.6)', lineHeight: 1.65, margin: '0 0 20px', maxWidth: '680px' }}>
                    {lead.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.35)' }}>
                  {lead.missionType && <span>{TYPE_LABEL[lead.missionType] || lead.missionType}</span>}
                  {lead.launchDate  && <span>Launched {formatDate(lead.launchDate)}</span>}
                </div>
              </div>
            </div>
          </a>
        )}

        {/* ── Grid label ───────────────────────────── */}
        {gridItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.35)' }}>
              {activeStatus ? STATUSES.find(s => s.value === activeStatus)?.label : 'All Missions'}
            </span>
          </div>
        )}

        {/* ── Responsive grid ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 'clamp(16px,2vw,24px)' }}>
          {gridItems.map(mission => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>

        {total > 12 && (
          <p style={{ textAlign: 'center', marginTop: '48px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.1em' }}>
            Showing {Math.min(12, total)} of {total} missions
          </p>
        )}
      </div>
    </div>
  )
}

// ── Filter button ─────────────────────────────────────────────
function FilterBtn({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', padding: '6px 14px', borderRadius: '4px',
        border: '1px solid', cursor: 'pointer',
        background:  active ? color : 'transparent',
        borderColor: active ? color : 'rgba(255,255,255,0.1)',
        color:       active ? '#07090c' : 'rgba(240,244,250,0.5)',
        transition:  'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Status badge ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || 'rgba(240,244,250,0.35)'
  const isPulse = status === 'active'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: isPulse ? `0 0 8px ${color}` : 'none' }} />
      {status.replace('-', ' ')}
    </span>
  )
}

// ── Grid card ─────────────────────────────────────────────────
function MissionCard({ mission }: { mission: MissionCard }) {
  return (
    <a href={`/missions/${mission.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {/* Image */}
        {mission.featuredImage ? (
          <div style={{ width: '100%', height: '180px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={mission.featuredImage} alt={mission.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ width: '100%', height: '100px', background: 'linear-gradient(135deg, #080f20 0%, #0c1830 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '28px', opacity: 0.25 }}>🛸</span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Agency + destination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {mission.agency && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3b9eff' }}>
                {mission.agency.shortName}
              </span>
            )}
            {mission.destination && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)' }}>
                → {mission.destination}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(18px,1.8vw,22px)', fontWeight: 400, color: '#f0f4fa', lineHeight: 1.25, margin: 0, flex: 1 }}>
            {mission.name}
          </h3>

          {/* Description */}
          {mission.description && (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'rgba(240,244,250,0.5)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {mission.description}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <StatusBadge status={mission.status} />
            {mission.launchDate && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)' }}>
                {formatDate(mission.launchDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}
