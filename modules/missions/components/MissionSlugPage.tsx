'use client'

import type { Mission, MissionCard } from '@/types/mission'
import { StatusBadge } from './MissionsPage'
import { formatDate } from '@/lib/utils'

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
  mission: Mission
  related: MissionCard[]
}

export function MissionSlugPage({ mission, related }: Props) {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* ── Hero image ──────────────────────────────── */}
      {mission.featuredImage && (
        <div style={{ width: '100%', height: 'clamp(240px,40vw,480px)', overflow: 'hidden', position: 'relative' }}>
          <img
            src={mission.featuredImage}
            alt={mission.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Gradient fade to black at bottom */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0f 100%)' }} />
        </div>
      )}

      {/* ── Main content column ─────────────────────── */}
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(32px,6vw,64px) clamp(20px,5vw,40px)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
          <a href="/missions" style={{ color: '#4f8ef7', textDecoration: 'none' }}>Missions</a>
          <span>/</span>
          <span>{mission.name}</span>
        </div>

        {/* Agency + type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {mission.agency && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7' }}>
              {mission.agency.name}
            </span>
          )}
          {mission.missionType && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '2px 8px' }}>
              {TYPE_LABEL[mission.missionType] || mission.missionType}
            </span>
          )}
          <StatusBadge status={mission.status} />
        </div>

        {/* Mission name */}
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          {mission.name}
        </h1>

        {/* Destination */}
        {mission.destination && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>
            → {mission.destination}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', paddingBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '36px' }}>
          {mission.launchDate && (
            <span>Launch: {formatDate(mission.launchDate)}</span>
          )}
          {mission.agency?.country && (
            <span>{mission.agency.country}</span>
          )}
        </div>

        {/* Description */}
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px,1.8vw,18px)', lineHeight: 1.9, color: 'rgba(255,255,255,0.9)', margin: '0 0 48px', letterSpacing: '0.01em' }}>
          {mission.description}
        </p>

        {/* ── Timeline ─────────────────────────────── */}
        {mission.timeline && mission.timeline.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '28px' }}>
              Mission Timeline
            </span>
            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              {mission.timeline.map((event, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: event.completed ? '#2ecc71' : 'rgba(255,255,255,0.15)', border: `2px solid ${event.completed ? '#2ecc71' : 'rgba(255,255,255,0.2)'}`, boxShadow: event.completed ? '0 0 8px rgba(46,204,113,0.4)' : 'none' }} />
                  {/* Date */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: event.completed ? '#2ecc71' : 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '6px' }}>
                    {event.date}
                  </span>
                  {/* Title */}
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 400, color: event.completed ? '#ffffff' : 'rgba(255,255,255,0.55)', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {event.title}
                  </h4>
                  {/* Description */}
                  {event.description && (
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, margin: 0 }}>
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Agency card ──────────────────────────── */}
        {mission.agency && (
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '48px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '12px' }}>
              Mission Agency
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 400, color: '#ffffff', margin: '0 0 8px' }}>
              {mission.agency.name}
            </h3>
            {mission.agency.country && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', letterSpacing: '0.08em' }}>
                {mission.agency.country}
              </p>
            )}
            {mission.agency.description && (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, margin: '0 0 16px' }}>
                {mission.agency.description}
              </p>
            )}
            {mission.agency.websiteUrl && (
              <a href={mission.agency.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
                Official Website →
              </a>
            )}
          </div>
        )}

        {/* Back link */}
        <div style={{ paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <a href="/missions" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← All Missions
          </a>
        </div>
      </article>

      {/* ── Related missions ─────────────────────────── */}
      {related.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '28px' }}>
              Related Missions
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
              {related.map(r => (
                <a key={r.id} href={`/missions/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', height: '100%', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {r.agency && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '10px' }}>
                        {r.agency.shortName}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: '#ffffff', lineHeight: 1.3, margin: '0 0 12px' }}>
                      {r.name}
                    </h3>
                    <StatusBadge status={r.status} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
