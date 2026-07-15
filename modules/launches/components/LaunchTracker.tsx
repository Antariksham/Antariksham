'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Launch } from '@/types/launch'
import {
  Rocket, Clock, MapPin, Tv, RefreshCw,
  CheckCircle, AlertCircle, Play, Timer,
} from 'lucide-react'

interface Props {
  initialUpcoming: Launch[]
  initialRecent:   Launch[]
}

// ── Countdown hook ────────────────────────────────────────────

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number>(0)

  useEffect(() => {
    if (!target) return
    const tick = () => setDiff(new Date(target).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  if (!target || diff <= 0) return null

  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  return { d, h, m, s: sec, total: s }
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CONFIG = {
  'go':              { label: 'GO',             color: 'var(--green)',  bg: 'rgba(46,204,113,0.08)',  border: 'rgba(46,204,113,0.25)'  },
  'tbd':             { label: 'TBD',            color: 'var(--gold)',   bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.25)' },
  'success':         { label: 'SUCCESS',        color: 'var(--green)',  bg: 'rgba(46,204,113,0.08)',  border: 'rgba(46,204,113,0.25)'  },
  'failure':         { label: 'FAILURE',        color: 'var(--red)',    bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.25)'   },
  'hold':            { label: 'HOLD',           color: 'var(--gold)',   bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.25)' },
  'in-flight':       { label: 'IN FLIGHT',      color: 'var(--accent)', bg: 'rgba(79,142,247,0.08)',  border: 'rgba(79,142,247,0.25)'  },
  'partial-failure': { label: 'PART. FAILURE',  color: 'var(--red)',    bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.25)'   },
} as const

// ── Countdown display ─────────────────────────────────────────

function CountdownDisplay({ target }: { target: string | null }) {
  const cd = useCountdown(target)

  if (!cd) return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.08em' }}>
      Time not confirmed
    </span>
  )

  const units = [
    { val: cd.d, label: 'D' },
    { val: cd.h, label: 'H' },
    { val: cd.m, label: 'M' },
    { val: cd.s, label: 'S' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {units.map(({ val, label }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--white)', lineHeight: 1, minWidth: '32px', textAlign: 'center' }}>
            {String(val).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(var(--ink),0.55)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Launch card ───────────────────────────────────────────────

function LaunchCard({ launch, featured }: { launch: Launch; featured?: boolean }) {
  const status = STATUS_CONFIG[launch.status] || STATUS_CONFIG['tbd']
  const isUpcoming = launch.status === 'go' || launch.status === 'tbd' || launch.status === 'hold' || launch.status === 'in-flight'

  const dateStr = launch.launchDate
    ? new Date(launch.launchDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    : null

  return (
    <div style={{
      background: featured ? 'var(--featured-bg)' : 'var(--surface)',
      border: `1px solid ${featured ? 'rgba(79,142,247,0.2)' : 'var(--border)'}`,
      borderRadius: featured ? '12px' : '8px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>

      {/* Card top accent */}
      {featured && (
        <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
      )}

      <div style={{ padding: featured ? '20px' : '16px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Agency */}
            {launch.agency && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
                {launch.agency}
              </span>
            )}
            {/* Name */}
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: featured ? '18px' : '15px',
              fontWeight: 400, lineHeight: 1.3,
              color: 'var(--white)', margin: 0,
            }}>
              {launch.name}
            </h3>
          </div>

          {/* Status badge */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '4px 8px', borderRadius: '4px', flexShrink: 0,
            background: status.bg, border: `1px solid ${status.border}`,
            color: status.color,
          }}>
            {status.label}
          </span>
        </div>

        {/* Rocket */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Rocket size={11} style={{ color: 'rgba(var(--ink),0.6)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', letterSpacing: '0.04em' }}>
            {launch.rocket}
          </span>
        </div>

        {/* Launch pad */}
        {launch.launchSite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <MapPin size={11} style={{ color: 'rgba(var(--ink),0.6)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.65)', letterSpacing: '0.04em' }}>
              {launch.launchPad ? `${launch.launchPad}, ` : ''}{launch.launchSite}
            </span>
          </div>
        )}

        {/* Description */}
        {launch.description && featured && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: 1.75, color: 'rgba(var(--ink),0.9)', margin: '0 0 14px' }}>
            {launch.description.length > 200 ? launch.description.slice(0, 200) + '…' : launch.description}
          </p>
        )}

        {/* Countdown or date */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
          {isUpcoming && launch.launchDate ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Timer size={10} style={{ color: 'rgba(var(--ink),0.55)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)' }}>
                  T− Countdown
                </span>
              </div>
              <CountdownDisplay target={launch.launchDate} />
              {dateStr && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.55)', margin: '6px 0 0', letterSpacing: '0.04em' }}>
                  {dateStr}
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={11} style={{ color: 'rgba(var(--ink),0.55)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', letterSpacing: '0.04em' }}>
                {dateStr || 'Date TBD'}
              </span>
            </div>
          )}
        </div>

        {/* Livestream link */}
        {launch.livestreamUrl && (
          <a
            href={launch.livestreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '12px', padding: '7px 14px', borderRadius: '5px',
              background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
              color: '#e74c3c', fontFamily: 'var(--font-mono)', fontSize: '11px',
              letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Tv size={11} />
            Watch Live
          </a>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function LaunchTracker({ initialUpcoming, initialRecent }: Props) {
  const [upcoming,    setUpcoming]    = useState<Launch[]>(initialUpcoming)
  const [recent,      setRecent]      = useState<Launch[]>(initialRecent)
  const [loading,     setLoading]     = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [tab,         setTab]         = useState<'upcoming' | 'recent'>('upcoming')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/launches')
      const data = await res.json()
      if (data.upcoming) setUpcoming(data.upcoming)
      if (data.recent)   setRecent(data.recent)
      setLastUpdated(new Date())
    } catch {
      // fail silently — keep showing last data
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [refresh])

  const nextLaunch  = upcoming[0]  || null
  const restLaunches = upcoming.slice(1)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>

      {/* ── Page header ──────────────────────────── */}
      <div style={{ paddingTop: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                Live
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 300, color: 'var(--white)', margin: '0 0 8px' }}>
              Launch Tracker
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'rgba(var(--ink),0.9)', margin: 0, lineHeight: 1.6 }}>
              Upcoming and recent rocket launches — powered by Launch Library 2
            </p>
          </div>

          {/* Refresh button + last updated */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={refresh}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'rgba(var(--ink),0.6)', fontFamily: 'var(--font-mono)',
                fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', letterSpacing: '0.08em' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Next launch featured ──────────────────── */}
      {nextLaunch && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Play size={12} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Next Launch
            </span>
          </div>
          <LaunchCard launch={nextLaunch} featured />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '2px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', padding: '3px', marginBottom: '20px', width: 'fit-content' }}>
        {([['upcoming', 'Upcoming', upcoming.length], ['recent', 'Recent', recent.length]] as const).map(([val, label, count]) => {
          const active = tab === val
          return (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '5px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none',
                background: active ? 'var(--accent)' : 'transparent',
                color:      active ? 'var(--black)'       : 'rgba(var(--ink),0.5)',
                fontWeight: active ? 700              : 400,
                transition: 'all 0.15s',
              }}
            >
              {label}
              <span style={{
                padding: '1px 6px', borderRadius: '10px', fontSize: '11px',
                background: active ? 'rgba(10,10,15,0.2)' : 'rgba(var(--ink),0.08)',
                color: active ? 'var(--black)' : 'rgba(var(--ink),0.4)',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Launch grid ──────────────────────────── */}
      {tab === 'upcoming' && (
        <>
          {restLaunches.length === 0 && !nextLaunch ? (
            <EmptyState message="No upcoming launches found" />
          ) : restLaunches.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.08em', textAlign: 'center', padding: '40px 0' }}>
              No additional upcoming launches scheduled
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {restLaunches.map(launch => (
                <LaunchCard key={launch.id} launch={launch} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'recent' && (
        <>
          {recent.length === 0 ? (
            <EmptyState message="No recent launches found" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {recent.map(launch => (
                <LaunchCard key={launch.id} launch={launch} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
      <Rocket size={32} style={{ color: 'rgba(var(--ink),0.5)', marginBottom: '12px' }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
        {message}
      </p>
    </div>
  )
}
