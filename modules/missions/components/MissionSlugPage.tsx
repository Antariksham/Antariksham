'use client'

import { useState, useEffect, type ReactNode } from 'react'
import type { Mission, MissionCard, CollaboratorRole, MissionSpecifications } from '@/types/mission'
import { StatusBadge } from './MissionsPage'
import { formatDate } from '@/lib/utils'
import { typeLabel } from '@/modules/missions/services/missionClassification'
import { timelineStatusMeta, timelineImportanceMeta } from '@/modules/missions/services/missionTimeline'
import { launchTargetTimestamp, launchSuccessMeta, isLaunchEmpty } from '@/modules/missions/services/missionLaunch'
import { LanguageToggle } from '@/components/LanguageToggle'
import { SmartImage } from '@/components/ui/SmartImage'
import { sectionHref, sectionListHref, HI_SANS, type LanguageCode } from '@/lib/i18n'
import { buildMissionJsonLd, buildBreadcrumbs } from '@/modules/seo/jsonLd'
import { siteConfig } from '@/config/site'

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
  const obj  = mission.objectives      // scientific objectives (Feature 4); always present
  const destinations = cls.destinations.length ? cls.destinations : (mission.destination ? [mission.destination] : [])
  const specRows = SPEC_ROWS.filter(([k]) => (spec[k] as string).trim())
  const hasSpecs = specRows.length > 0 || spec.instruments.length > 0
  const objGroups: [string, string[]][] = [
    ['Secondary Objectives', obj.secondary],
    ['Technology Demonstrations', obj.technologyDemos],
    ['Scientific Questions', obj.scientificQuestions],
    ['Expected Discoveries', obj.expectedDiscoveries],
  ].filter(([, items]) => (items as string[]).length > 0) as [string, string[]][]
  const hasObjectives = objGroups.length > 0 || !!obj.significance.trim()

  // Launch information (Feature 6)
  const launch = mission.launch
  const hasLaunch = !isLaunchEmpty(launch) || !!mission.launchDate
  const launchRows: [string, string][] = ([
    ['Launch Date', mission.launchDate ? formatDate(mission.launchDate) : ''],
    ['Launch Time', launch.time],
    ['Launch Site', launch.site],
    ['Launch Pad', launch.pad],
    ['Provider', launch.provider],
    ['Rocket', launch.rocket],
    ['Country', launch.country],
    ['Mission Number', launch.missionNumber],
  ] as [string, string][]).filter(([, v]) => v.trim())
  const launchWindow = (launch.windowStart || launch.windowEnd)
    ? `${launch.windowStart.replace('T', ' ') || '…'} → ${launch.windowEnd.replace('T', ' ') || '…'}`
    : ''
  const launchTarget = launchTargetTimestamp(mission.launchDate || '', launch)
  const showCountdown = launch.countdown && launchTarget != null

  // Media (Feature 7)
  const media = mission.media
  const galleryImages = [...media.gallery, ...media.infographics, ...media.animations]
  const hasMediaSection = !!media.banner.url || galleryImages.length > 0 || media.videos.length > 0 || media.documents.length > 0
  return (
    <div lang={lang} style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>

      {/* Structured data. Missions previously emitted none at all, despite being
          the site's most distinctive content and carrying the richest model. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          buildMissionJsonLd({
            name:          mission.name,
            slug:          mission.slug,
            description:   mission.description,
            featuredImage: mission.featuredImage,
            launchDate:    mission.launchDate,
            destination:   mission.classification.destinations[0] || mission.destination,
            agencyName:    mission.agency?.name || null,
            summary:       mission.identity.summary || undefined,
            website:       mission.identity.website || undefined,
            wikipedia:     mission.identity.wikipedia || undefined,
          }, siteConfig),
          // Language-aware: on /hi/mission/:slug the crumbs have to describe
          // the Hindi URLs, or the structured data contradicts the page's own
          // canonical.
          buildBreadcrumbs([
            { name: 'Missions', path: sectionListHref('missions', lang) },
            { name: mission.name, path: sectionHref('missions', mission.slug, lang) },
          ], siteConfig),
        ]) }}
      />

      {/* ── Hero image ──────────────────────────────── */}
      {mission.featuredImage && (
        <div style={{ width: '100%', height: 'clamp(240px,40vw,480px)', overflow: 'hidden', position: 'relative' }}>
          {/* The page's LCP image, so `priority`. Editors can point this at any
              host, which is exactly what SmartImage exists for: allow-listed
              hosts get a srcset, the rest fall back to the plain <img> this
              used to be. The width/height are intrinsic hints only — the
              clamped box above still decides the rendered size. */}
          <SmartImage
            src={mission.featuredImage}
            alt={media.hero.alt || mission.name}
            width={1920}
            height={640}
            sizes="100vw"
            priority
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Gradient fade to black at bottom */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0f 100%)' }} />
        </div>
      )}

      {/* ── Main content column ─────────────────────── */}
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(32px,6vw,64px) clamp(20px,5vw,40px)' }}>

        {/* Mission patch — floats top-right, text wraps around it */}
        {media.patch.url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={media.patch.url}
            alt={media.patch.alt || `${mission.name} mission patch`}
            loading="lazy"
            decoding="async"
            style={{ float: 'right', width: 'clamp(72px,14vw,112px)', height: 'auto', marginLeft: '20px', marginBottom: '12px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {/* Language switch — only shows when a translation exists */}
        <LanguageToggle current={mission.language} available={mission.availableLanguages} hrefFor={c => sectionHref('missions', mission.slug, c)} />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.1em' }}>
          <a href={sectionListHref('missions', lang)} style={{ color: '#4f8ef7', textDecoration: 'none' }}>Missions</a>
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

        {/* ── Scientific objectives ────────────────── */}
        {hasObjectives && (
          <div style={{ marginBottom: '48px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '24px' }}>
              Scientific Objectives
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {objGroups.map(([label, items]) => (
                <div key={label}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '12px' }}>
                    {label}
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', lineHeight: 1.65 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {obj.significance.trim() && (
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '12px' }}>
                    Mission Significance
                  </span>
                  <p style={{ fontFamily: isHi ? HI_SANS : 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', lineHeight: 1.8, margin: 0 }}>
                    {obj.significance}
                  </p>
                </div>
              )}
            </div>
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

        {/* ── Launch information ───────────────────── */}
        {hasLaunch && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7' }}>
                Launch Information
              </span>
              {launch.success !== 'unknown' && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: launchSuccessMeta(launch.success).color }}>
                  · {launchSuccessMeta(launch.success).label}
                </span>
              )}
            </div>

            {showCountdown && <LaunchCountdown target={launchTarget!} />}

            {launchRows.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'rgba(var(--ink),0.08)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: launchWindow || launch.livestreamUrl ? '16px' : 0 }}>
                {launchRows.map(([label, value]) => (
                  <div key={label} style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', marginBottom: '5px' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--white)' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {launchWindow && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em', color: 'rgba(var(--ink),0.6)', margin: '0 0 12px' }}>
                Window: {launchWindow}
              </p>
            )}
            {launch.livestreamUrl && <MissionLink href={launch.livestreamUrl}>Watch Livestream ↗</MissionLink>}
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

        {/* ── Mission media ────────────────────────── */}
        {hasMediaSection && (
          <div style={{ marginBottom: '56px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4f8ef7', display: 'block', marginBottom: '24px' }}>
              Mission Media
            </span>

            {media.banner.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={media.banner.url} alt={media.banner.alt || `${mission.name} banner`} loading="lazy" decoding="async" style={{ width: '100%', borderRadius: '10px', marginBottom: '20px', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}

            {galleryImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: media.videos.length || media.documents.length ? '24px' : 0 }}>
                {galleryImages.map((img, i) => (
                  <figure key={i} style={{ margin: 0 }}>
                    <a href={img.sourceUrl || img.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid rgba(var(--ink),0.08)', aspectRatio: '4/3' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt || img.caption || `${mission.name} image ${i + 1}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
                    </a>
                    {(img.caption || img.credit) && (
                      <figcaption style={{ marginTop: '6px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', lineHeight: 1.4 }}>
                        {img.caption}{img.caption && img.credit ? ' · ' : ''}
                        {img.credit && <span style={{ color: 'rgba(var(--ink),0.45)' }}>{img.credit}</span>}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {media.videos.length > 0 && (
              <div style={{ marginBottom: media.documents.length ? '16px' : 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '10px' }}>Videos</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {media.videos.map((v, i) => <MissionLink key={i} href={v.url}>▶ {v.caption || 'Watch video'} ↗</MissionLink>)}
                </div>
              </div>
            )}

            {media.documents.length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', display: 'block', marginBottom: '10px' }}>Documents</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {media.documents.map((d, i) => <MissionLink key={i} href={d.url}>▤ {d.caption || 'Document'} ↧</MissionLink>)}
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
              {mission.timeline.map((event, i) => {
                const effStatus = event.status || (event.completed ? 'completed' : 'upcoming')
                const st = timelineStatusMeta(effStatus)
                const done = effStatus === 'completed'
                const showImportance = event.importance === 'critical' || event.importance === 'major'
                const dateLine = [event.date, event.time, event.timezone].filter(Boolean).join(' · ')
                return (
                  <div key={event.id || i} style={{ position: 'relative', marginBottom: '32px' }}>
                    {/* Dot */}
                    <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: st.color, border: `2px solid ${st.color}`, boxShadow: done ? `0 0 8px ${st.color}` : 'none' }} />
                    {/* Date + time + timezone */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', color: st.color, display: 'block', marginBottom: '6px' }}>
                      {dateLine || '—'}
                    </span>
                    {/* Badges */}
                    {(event.eventType || showImportance) && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {event.eventType && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', border: '1px solid rgba(var(--ink),0.14)', borderRadius: '3px', padding: '2px 7px' }}>
                            {event.eventType}
                          </span>
                        )}
                        {showImportance && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: timelineImportanceMeta(event.importance!).color }}>
                            {timelineImportanceMeta(event.importance!).label}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Title */}
                    <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400, color: done ? 'var(--white)' : 'rgba(var(--ink),0.75)', margin: '0 0 6px', lineHeight: 1.3 }}>
                      {event.title}
                    </h4>
                    {/* Short description */}
                    {event.description && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', lineHeight: 1.75, margin: '0 0 8px' }}>
                        {event.description}
                      </p>
                    )}
                    {/* Detailed description */}
                    {event.detailedDescription && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.7)', lineHeight: 1.75, margin: '0 0 8px' }}>
                        {event.detailedDescription}
                      </p>
                    )}
                    {/* Image */}
                    {/* Boxed at a fixed ratio rather than left to size itself: an
                        unsized image here pushed every later event down the
                        timeline as it loaded. */}
                    {event.image && (
                      <div style={{ width: '100%', maxWidth: '520px', aspectRatio: '16 / 9', borderRadius: '8px', overflow: 'hidden', margin: '4px 0 8px', background: 'var(--panel)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.image} alt={event.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                    {/* Location + links */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {event.location && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(var(--ink),0.55)' }}>
                          ↳ {event.location}
                        </span>
                      )}
                      {event.sourceUrl && <MissionLink href={event.sourceUrl}>Source ↗</MissionLink>}
                      {event.videoUrl && <MissionLink href={event.videoUrl}>Video ↗</MissionLink>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Agency card ──────────────────────────── */}
        {mission.agency && (
          <div style={{ background: 'var(--panel)', border: '1px solid rgba(var(--ink),0.08)', borderRadius: '12px', padding: '24px', marginBottom: '48px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', display: 'block', marginBottom: '12px' }}>
              Mission Agency
            </span>
            {media.agencyLogo.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={media.agencyLogo.url} alt={media.agencyLogo.alt || `${mission.agency.name} logo`} loading="lazy" style={{ height: '40px', width: 'auto', marginBottom: '12px', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
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
          <a href={sectionListHref('missions', lang)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4f8ef7', textDecoration: 'none' }}>
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

// Live launch countdown. Hydration-safe: renders a placeholder until mounted
// (server + first client render agree), then ticks every second after mount.
function LaunchCountdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  let units: { n: number; label: string }[] | null = null
  let caption = 'To launch'
  if (now !== null) {
    const diff = target - now
    if (diff <= 0) { caption = 'Status'; units = null }
    else {
      units = [
        { n: Math.floor(diff / 86400000),        label: 'Days' },
        { n: Math.floor((diff % 86400000) / 3600000), label: 'Hrs' },
        { n: Math.floor((diff % 3600000) / 60000),    label: 'Min' },
        { n: Math.floor((diff % 60000) / 1000),       label: 'Sec' },
      ]
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', marginBottom: '20px', background: 'var(--panel)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '12px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f8ef7' }}>
        {caption}
      </span>
      {now === null ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'rgba(var(--ink),0.5)' }}>—</span>
      ) : units === null ? (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', color: 'var(--green)' }}>Launched</span>
      ) : (
        <div style={{ display: 'flex', gap: '16px' }}>
          {units.map(u => (
            <div key={u.label} style={{ textAlign: 'center', minWidth: '44px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 600, color: 'var(--white)', lineHeight: 1 }}>
                {String(u.n).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.5)', marginTop: '5px' }}>
                {u.label}
              </div>
            </div>
          ))}
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
