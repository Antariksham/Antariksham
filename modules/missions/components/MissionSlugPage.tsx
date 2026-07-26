'use client'

import type { ReactNode } from 'react'
import type { Mission, MissionCard, CollaboratorRole, MissionSpecifications } from '@/types/mission'
import { StatusBadge } from './MissionsPage'
import { formatDate } from '@/lib/utils'
import { typeLabel } from '@/modules/missions/services/missionClassification'
import { LanguageToggle } from '@/components/LanguageToggle'
import { sectionHref, HI_SANS, type LanguageCode } from '@/lib/i18n'

const ROLE_LABEL: Record<CollaboratorRole, string> = {
  partner:     'Partner Agencies',
  commercial:  'Commercial Partners',
  institution: 'Scientific Institutions',
}
const ROLE_ORDER: CollaboratorRole[] = ['partner', 'commercial', 'institution']

// Specification rows shown on the public page, in order (blank fields skipped).
const SPEC_ROWS: [keyof MissionSpecifications, string][] = [
  ['spacecraftName', 'Spacecraft'], ['manufacturer', 'Manufacturer'],
  ['program', 'Program'], ['missionFamily', 'Mission Family'],
  ['launchVehicle', 'Launch Vehicle'], ['orbitType', 'Orbit'],
  ['launchMass', 'Launch Mass'], ['dryMass', 'Dry Mass'], ['payloadMass', 'Payload Mass'],
  ['missionDuration', 'Mission Duration'], ['expectedLifetime', 'Expected Lifetime'],
  ['powerSource', 'Power Source'], ['powerOutput', 'Power Output'],
  ['communicationSystem', 'Communications'],
  ['primaryPayload', 'Primary Payload'], ['secondaryPayload', 'Secondary Payload'],
  ['budget', 'Budget'],
]

interface Props {
  mission: Mission
  related: MissionCard[]
  lang?:   LanguageCode
}

export function MissionSlugPage({ mission, related, lang = 'en' }: Props) {
  const isHi = lang === 'hi'
  const id   = mission.identity        // enhanced identity (Feature 1); always present
  const cls  = mission.classification  // rich classification (Feature 2); always present
  const spec = mission.specifications  // specifications (Feature 3); always present
  const destinations = cls.destinations.length ? cls.destinations : (mission.destination ? [mission.destination] : [])
  const specRows = SPEC_ROWS.filter(([k]) => (spec[k] as string).trim())
  const hasSpecs = specRows.length > 0 || spec.instruments.length > 0
  return (
    <div lang={lang} style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

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

        {/* Language switch — only shows when a translation exists */}
        <LanguageToggle current={mission.language} available={mission.availableLanguages} hrefFor={c => sectionHref('missions', mission.slug, c)} />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.1em' }}>
          <a href="/missions" style={{ color: '#4f8ef7', textDecoration: 'none' }}>Missions</a>
          <span>/</span>
          <span>{mission.name}</span>
        </div>

        {/* Agency + types + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {mission.agency && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7' }}>
              {mission.agency.name}
            </span>
          )}
          {id?.acronym && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '3px', padding: '2px 8px' }}>
              {id.acronym}
            </span>
          )}
          {cls.types.map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', border: '1px solid rgba(var(--ink),0.1)', borderRadius: '3px', padding: '2px 8px' }}>
              {typeLabel(t)}
            </span>
          ))}
          <StatusBadge status={cls.status} />
        </div>

        {/* Mission name */}
        <h1 style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 400, color: 'var(--white)', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          {mission.name}
        </h1>

        {/* Subtitle */}
        {id?.subtitle && (
          <p style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: 'clamp(17px,2.2vw,22px)', fontWeight: 400, color: 'rgba(var(--ink),0.7)', lineHeight: 1.4, margin: '0 0 16px' }}>
            {id.subtitle}
          </p>
        )}

        {/* Motto */}
        {id?.motto && (
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '16px', color: 'rgba(var(--ink),0.6)', margin: '0 0 20px' }}>
            &ldquo;{id.motto}&rdquo;
          </p>
        )}

        {/* Destinations */}
        {destinations.length > 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', color: 'rgba(var(--ink),0.6)', margin: '0 0 24px' }}>
            → {destinations.join('  ·  ')}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', paddingBottom: '28px', borderBottom: '1px solid rgba(var(--ink),0.08)', marginBottom: '36px' }}>
          {mission.launchDate && (
            <span>Launch: {formatDate(mission.launchDate)}</span>
          )}
          {mission.agency?.country && (
            <span>{mission.agency.country}</span>
          )}
        </div>

        {/* Summary (lead) */}
        {id?.summary && (
          <p style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: 'clamp(18px,2vw,21px)', lineHeight: 1.7, color: 'var(--white)', margin: '0 0 24px', letterSpacing: '0.005em' }}>
            {id.summary}
          </p>
        )}

        {/* Description */}
        <p style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: 'clamp(16px,1.8vw,18px)', lineHeight: 1.9, color: 'rgba(var(--ink),0.9)', margin: '0 0 32px', letterSpacing: '0.01em' }}>
          {mission.description}
        </p>

        {/* Primary objective */}
        {id?.objective && (
          <div style={{ borderLeft: '2px solid rgba(79,142,247,0.5)', paddingLeft: '18px', margin: '0 0 32px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '8px' }}>
              Mission Objective
            </span>
            <p style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: '16px', lineHeight: 1.75, color: 'rgba(var(--ink),0.9)', margin: 0 }}>
              {id.objective}
            </p>
          </div>
        )}

        {/* Official links */}
        {(id?.website || id?.wikipedia || id?.pressKit) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', margin: '0 0 48px' }}>
            {id?.website && <MissionLink href={id.website}>Official Website ↗</MissionLink>}
            {id?.wikipedia && <MissionLink href={id.wikipedia}>Wikipedia ↗</MissionLink>}
            {id?.pressKit && <MissionLink href={id.pressKit}>Press Kit ↗</MissionLink>}
          </div>
        )}

        {/* ── Specifications ───────────────────────── */}
        {hasSpecs && (
          <div style={{ marginBottom: '56px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '24px' }}>
              Mission Specifications
            </span>
            {specRows.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: 'rgba(var(--ink),0.08)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                {specRows.map(([key, label]) => (
                  <div key={key} style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', marginBottom: '5px' }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)', lineHeight: 1.4 }}>
                      {spec[key] as string}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {spec.instruments.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '10px' }}>
                  Scientific Instruments
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {spec.instruments.map(inst => (
                    <span key={inst} style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(var(--ink),0.04)', border: '1px solid rgba(var(--ink),0.1)', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.9)' }}>
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Timeline ─────────────────────────────── */}
        {mission.timeline && mission.timeline.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '28px' }}>
              Mission Timeline
            </span>
            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1px solid rgba(var(--ink),0.1)' }}>
              {mission.timeline.map((event, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: event.completed ? '#2ecc71' : 'rgba(var(--ink),0.15)', border: `2px solid ${event.completed ? '#2ecc71' : 'rgba(var(--ink),0.2)'}`, boxShadow: event.completed ? '0 0 8px rgba(46,204,113,0.4)' : 'none' }} />
                  {/* Date */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', color: event.completed ? '#2ecc71' : 'rgba(var(--ink),0.35)', display: 'block', marginBottom: '6px' }}>
                    {event.date}
                  </span>
                  {/* Title */}
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400, color: event.completed ? 'var(--white)' : 'rgba(var(--ink),0.55)', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {event.title}
                  </h4>
                  {/* Description */}
                  {event.description && (
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', lineHeight: 1.75, margin: 0 }}>
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
          <div style={{ background: 'var(--panel)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '12px', padding: '24px', marginBottom: '48px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', display: 'block', marginBottom: '12px' }}>
              Mission Agency
            </span>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 400, color: 'var(--white)', margin: '0 0 8px' }}>
              {mission.agency.name}
            </h3>
            {mission.agency.country && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', margin: '0 0 12px', letterSpacing: '0.08em' }}>
                {mission.agency.country}
              </p>
            )}
            {mission.agency.description && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', lineHeight: 1.75, margin: '0 0 16px' }}>
                {mission.agency.description}
              </p>
            )}
            {mission.agency.websiteUrl && (
              <a href={mission.agency.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
                Official Website →
              </a>
            )}
          </div>
        )}

        {/* ── Partners & collaborators (by role) ────── */}
        {mission.collaborators.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '20px' }}>
              Partners &amp; Collaborators
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {ROLE_ORDER.map(role => {
                const inRole = mission.collaborators.filter(c => c.role === role)
                if (inRole.length === 0) return null
                return (
                  <div key={role}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '10px' }}>
                      {ROLE_LABEL[role]}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {inRole.map(({ agency }) => {
                        const chip = (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: 'var(--panel)', border: '1px solid rgba(var(--ink),0.1)' }}>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--white)' }}>{agency.name}</span>
                            {agency.country && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', letterSpacing: '0.06em' }}>{agency.country}</span>
                            )}
                          </span>
                        )
                        return agency.websiteUrl
                          ? <a key={agency.id} href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{chip}</a>
                          : <span key={agency.id}>{chip}</span>
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div style={{ paddingTop: '28px', borderTop: '1px solid rgba(var(--ink),0.08)' }}>
          <a href="/missions" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
            ← All Missions
          </a>
        </div>
      </article>

      {/* ── Related missions ─────────────────────────── */}
      {related.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(var(--ink),0.08)', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '28px' }}>
              Related Missions
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
              {related.map(r => (
                <a key={r.id} href={sectionHref('missions', r.slug, lang)} style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{ padding: '24px', height: '100%', cursor: 'pointer', alignItems: 'flex-start' }}
                  >
                    {r.agency && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '10px' }}>
                        {r.agency.shortName}
                      </span>
                    )}
                    <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 400, color: 'var(--white)', lineHeight: 1.3, margin: '0 0 12px' }}>
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

// External reference link (official website / Wikipedia / press kit).
function MissionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}
    >
      {children}
    </a>
  )
}
