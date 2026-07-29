'use client'

import Link from 'next/link'
import { statusMeta } from '@/modules/missions/services/missionClassification'
import type { SolarBody } from '../services/solarSystemBodies'
import type { ExploreMissionRef } from '../services/bodyMissions'

const MAX_MISSIONS = 6

interface Props {
  body:     SolarBody
  missions: ExploreMissionRef[]
}

/** Facts + cross-links panel for the currently selected body. */
export function BodyPanel({ body, missions }: Props) {
  const shown = missions.slice(0, MAX_MISSIONS)
  const extra = missions.length - shown.length

  return (
    <aside className="body-panel" aria-live="polite">
      <p className="body-kind" style={{ color: body.color }}>{body.kindLabel}</p>
      <h2 className="body-title">{body.name}</h2>
      <p className="body-tagline">{body.tagline}</p>
      <p className="body-desc">{body.description}</p>

      <div className="body-facts">
        {body.facts.map(f => (
          <div key={f.label} className="body-fact">
            <p className="body-fact-label">{f.label}</p>
            <p className="body-fact-value">{f.value}</p>
          </div>
        ))}
      </div>

      {body.moons && <p className="body-moons">🌙 {body.moons}</p>}

      <p className="body-section-title">Missions here</p>
      {shown.length > 0 ? (
        <div className="body-missions">
          {shown.map(m => {
            const { color } = statusMeta(m.status)
            return (
              <Link key={m.slug} href={`/missions/${m.slug}`} className="body-mission press">
                <span className="body-mission-dot" style={{ background: color }} aria-hidden />
                <span className="body-mission-name">{m.name}</span>
                {m.launchDate && (
                  <span className="body-mission-year">{m.launchDate.slice(0, 4)}</span>
                )}
              </Link>
            )
          })}
          {extra > 0 && (
            <Link href="/missions" className="body-link">+ {extra} more — all missions →</Link>
          )}
        </div>
      ) : (
        <p className="body-missions-empty">
          No missions to {body.name} in our database yet — <Link href="/missions" className="body-link">browse all missions</Link>.
        </p>
      )}

      <div className="body-links">
        {body.related?.map(l => (
          <Link key={l.href} href={l.href} className="body-link">{l.label} →</Link>
        ))}
        <Link href={`/search?q=${encodeURIComponent(body.search)}`} className="body-link">
          Read our {body.name} coverage →
        </Link>
      </div>
    </aside>
  )
}
