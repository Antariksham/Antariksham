'use client'

import { useState, useEffect, useCallback } from 'react'
import { Rocket, RefreshCw, MapPin, Tv, Clock, CheckCircle, AlertCircle, Timer, Play } from 'lucide-react'
import type { Launch, LaunchStatus } from '@/types/launch'

// ── Types ─────────────────────────────────────────────────────

interface LaunchData {
  upcoming: Launch[]
  recent:   Launch[]
  total:    number
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<LaunchStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'go':              { label: 'GO',           color: 'var(--green)',  bg: 'rgba(46,204,113,0.08)',  border: 'rgba(46,204,113,0.25)',  icon: <CheckCircle size={10} /> },
  'tbd':             { label: 'TBD',          color: 'var(--gold)',   bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.25)', icon: <Clock       size={10} /> },
  'success':         { label: 'SUCCESS',      color: 'var(--green)',  bg: 'rgba(46,204,113,0.08)',  border: 'rgba(46,204,113,0.25)',  icon: <CheckCircle size={10} /> },
  'failure':         { label: 'FAILURE',      color: 'var(--red)',    bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.25)',   icon: <AlertCircle size={10} /> },
  'hold':            { label: 'HOLD',         color: 'var(--gold)',   bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.25)', icon: <Timer       size={10} /> },
  'in-flight':       { label: 'IN FLIGHT',    color: 'var(--accent)', bg: 'rgba(79,142,247,0.08)',  border: 'rgba(79,142,247,0.25)',  icon: <Play        size={10} /> },
  'partial-failure': { label: 'PART. FAILURE',color: 'var(--red)',    bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.25)',   icon: <AlertCircle size={10} /> },
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recent',   label: 'Recent'   },
] as const

type Tab = typeof TABS[number]['key']

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

  const s   = Math.floor(diff / 1000)
  const d   = Math.floor(s / 86400)
  const h   = Math.floor((s % 86400) / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60

  return { d, h, m, s: sec }
}

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }: { status: LaunchStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['tbd']
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '4px',
      padding:        '3px 8px',
      borderRadius:   '4px',
      background:     cfg.bg,
      border:         `1px solid ${cfg.border}`,
      color:          cfg.color,
      fontFamily:     'var(--font-mono)',
      fontSize:       '9px',
      letterSpacing:  '0.12em',
      textTransform:  'uppercase',
      whiteSpace:     'nowrap',
    }}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function CountdownBadge({ target }: { target: string | null }) {
  const cd = useCountdown(target)
  if (!cd) return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
      T– TBD
    </span>
  )
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.06em' }}>
      T– {cd.d}d {String(cd.h).padStart(2,'0')}h {String(cd.m).padStart(2,'0')}m {String(cd.s).padStart(2,'0')}s
    </span>
  )
}

function formatLaunchDate(iso: string | null): string {
  if (!iso) return 'NET TBD'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

// ── Launch card ───────────────────────────────────────────────

function LaunchCard({ launch }: { launch: Launch }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border)',
      borderRadius: '10px',
      padding:      '18px 20px',
      display:      'flex',
      flexDirection:'column',
      gap:          '12px',
    }}>

      {/* Top row — name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily:   'var(--font-serif)',
            fontSize:     '16px',
            color:        'var(--white)',
            margin:       0,
            lineHeight:   1.3,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {launch.name}
          </p>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            {launch.rocket}
            {launch.agency ? ` · ${launch.agency}` : ''}
          </p>
        </div>
        <StatusBadge status={launch.status} />
      </div>

      {/* Middle row — date + countdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>
            {formatLaunchDate(launch.launchDate)}
          </span>
        </div>
        {launch.status === 'go' || launch.status === 'tbd' || launch.status === 'hold' ? (
          <CountdownBadge target={launch.launchDate} />
        ) : null}
      </div>

      {/* Bottom row — site + livestream */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {launch.launchSite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={10} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>
              {launch.launchSite}
            </span>
          </div>
        )}
        {launch.livestreamUrl && (
          <a
            href={launch.livestreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '4px',
              fontFamily:     'var(--font-mono)',
              fontSize:       '9px',
              letterSpacing:  '0.1em',
              textTransform:  'uppercase',
              color:          'var(--accent)',
              textDecoration: 'none',
              padding:        '3px 8px',
              borderRadius:   '4px',
              background:     'rgba(79,142,247,0.08)',
              border:         '1px solid rgba(79,142,247,0.2)',
            }}
          >
            <Tv size={9} />
            Livestream
          </a>
        )}
        {launch.probability != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
            {launch.probability}% weather GO
          </span>
        )}
      </div>

      {/* Description */}
      {launch.description && (
        <p style={{
          margin:      0,
          fontFamily:  'var(--font-sans)',
          fontSize:    '12px',
          color:       'rgba(255,255,255,0.45)',
          lineHeight:  1.6,
          borderTop:   '1px solid var(--border)',
          paddingTop:  '12px',
          display:     '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow:    'hidden',
        }}>
          {launch.description}
        </p>
      )}

    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div style={{
      padding:      '48px 24px',
      background:   'var(--surface)',
      border:       '1px dashed var(--border)',
      borderRadius: '10px',
      textAlign:    'center',
    }}>
      <Rocket size={28} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: '12px' }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
        No {tab} launches found
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '6px', marginBottom: 0 }}>
        Data is fetched live from Launch Library 2
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function LaunchesAdmin() {
  const [data,        setData]        = useState<LaunchData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [activeTab,   setActiveTab]   = useState<Tab>('upcoming')
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchLaunches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/launches', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: LaunchData = await res.json()
      setData(json)
      setLastFetched(new Date())
    } catch (err) {
      setError('Failed to fetch launch data. Launch Library 2 may be temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLaunches() }, [fetchLaunches])

  const displayed = data ? (activeTab === 'upcoming' ? data.upcoming : data.recent) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
            Launch Tracker
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '6px 0 0' }}>
            Live data · Launch Library 2
            {lastFetched && (
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>
                {' '}· Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={fetchLaunches}
          disabled={loading}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '7px',
            padding:        '9px 16px',
            borderRadius:   '7px',
            background:     'var(--surface)',
            border:         '1px solid var(--border-hi)',
            color:          loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
            fontFamily:     'var(--font-mono)',
            fontSize:       '11px',
            letterSpacing:  '0.1em',
            textTransform:  'uppercase',
            cursor:         loading ? 'not-allowed' : 'pointer',
            transition:     'all 0.15s',
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Fetching…' : 'Refresh'}
        </button>
      </div>

      {/* Stats strip */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Upcoming',      value: data.upcoming.length,                                                      color: 'var(--accent)' },
            { label: 'GO for launch', value: data.upcoming.filter(l => l.status === 'go').length,                       color: 'var(--green)'  },
            { label: 'Recent',        value: data.recent.length,                                                        color: 'rgba(255,255,255,0.5)' },
            { label: 'Successful',    value: data.recent.filter(l => l.status === 'success').length,                    color: 'var(--green)'  },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: '5px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '8px' }}>
          <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)' }}>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(tab => {
          const count  = data ? (tab.key === 'upcoming' ? data.upcoming.length : data.recent.length) : 0
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding:        '9px 16px',
                background:     'transparent',
                border:         'none',
                borderBottom:   active ? '2px solid var(--accent)' : '2px solid transparent',
                color:          active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                fontFamily:     'var(--font-mono)',
                fontSize:       '11px',
                letterSpacing:  '0.1em',
                textTransform:  'uppercase',
                cursor:         'pointer',
                transition:     'all 0.15s',
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '7px',
                marginBottom:   '-1px',
              }}
            >
              {tab.label}
              {data && (
                <span style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     '9px',
                  padding:      '1px 6px',
                  borderRadius: '10px',
                  background:   active ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.05)',
                  color:        active ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Launch list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '120px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', opacity: 0.5 }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map(launch => (
            <LaunchCard key={launch.id} launch={launch} />
          ))}
        </div>
      )}

      {/* Info note */}
      <div style={{
        padding:      '12px 16px',
        background:   'rgba(79,142,247,0.04)',
        border:       '1px solid rgba(79,142,247,0.12)',
        borderRadius: '8px',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '10px',
      }}>
        <Rocket size={13} style={{ color: 'rgba(79,142,247,0.5)', flexShrink: 0, marginTop: '1px' }} />
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
          Launch data is fetched live from{' '}
          <a href="https://thespacedevs.com/llapi" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(79,142,247,0.6)', textDecoration: 'none' }}>
            Launch Library 2
          </a>
          . Data refreshes every 5 minutes via server cache. Use the Refresh button to force a new fetch.
          To add a public Launches page for visitors, build{' '}
          <code style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '3px' }}>/live/launches</code>.
        </p>
      </div>

    </div>
  )
}
