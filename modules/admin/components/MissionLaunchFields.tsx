'use client'

/**
 * Launch Information editor (Phase 1, Feature 6).
 *
 * Controlled grouping of the dedicated launch fields. The launch DATE binds to
 * the base `launch_date` column (moved here from the sidebar — single source of
 * truth); the mission press kit is shown read-only, shared from the Identity
 * section. Reuses `SubLabel`; matches the CMS design language (both themes).
 */
import type { MissionLaunch } from '@/types/mission'
import { SubLabel } from '@/modules/admin/components/MissionClassificationFields'
import { LAUNCH_SUCCESS_OPTIONS } from '@/modules/missions/services/missionLaunch'
import { ChevronDown } from 'lucide-react'

interface Props {
  value:              MissionLaunch
  onChange:           (next: MissionLaunch) => void
  launchDate:         string
  onLaunchDateChange: (date: string) => void
  pressKit:           string
}

export function MissionLaunchFields({ value, onChange, launchDate, onLaunchDateChange, pressKit }: Props) {
  const set = <K extends keyof MissionLaunch>(key: K, v: MissionLaunch[K]) => onChange({ ...value, [key]: v })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <Row2>
        <div>
          <SubLabel>Launch Date</SubLabel>
          <input type="date" value={launchDate} onChange={e => onLaunchDateChange(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
        <LField label="Launch Time" value={value.time} onChange={v => set('time', v)} placeholder="e.g. 14:30 UTC" />
      </Row2>

      <Row2>
        <div>
          <SubLabel>Launch Window Start</SubLabel>
          <input type="datetime-local" value={value.windowStart} onChange={e => set('windowStart', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
        <div>
          <SubLabel>Launch Window End</SubLabel>
          <input type="datetime-local" value={value.windowEnd} onChange={e => set('windowEnd', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
      </Row2>

      <Row2>
        <LField label="Launch Site" value={value.site} onChange={v => set('site', v)} placeholder="e.g. Kennedy Space Center" />
        <LField label="Launch Pad" value={value.pad} onChange={v => set('pad', v)} placeholder="e.g. LC-39A" />
      </Row2>
      <Row2>
        <LField label="Launch Provider" value={value.provider} onChange={v => set('provider', v)} placeholder="e.g. SpaceX" />
        <LField label="Rocket" value={value.rocket} onChange={v => set('rocket', v)} placeholder="e.g. Falcon Heavy" />
      </Row2>
      <Row2>
        <LField label="Launch Country" value={value.country} onChange={v => set('country', v)} placeholder="e.g. USA" />
        <LField label="Mission Number" value={value.missionNumber} onChange={v => set('missionNumber', v)} placeholder="e.g. Flight 3" />
      </Row2>

      <Row2>
        <div>
          <SubLabel>Launch Success</SubLabel>
          <div style={{ position: 'relative' }}>
            <select value={value.success} onChange={e => set('success', e.target.value as MissionLaunch['success'])} style={{ ...inputStyle, appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}>
              {LAUNCH_SUCCESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.6)', pointerEvents: 'none' }} />
          </div>
        </div>
        <div>
          <SubLabel hint="Show a live countdown on the public page.">Countdown Support</SubLabel>
          <Toggle on={value.countdown} onToggle={() => set('countdown', !value.countdown)} label="Enable countdown" />
        </div>
      </Row2>

      <LField label="Launch Livestream URL" value={value.livestreamUrl} onChange={v => set('livestreamUrl', v)} placeholder="https://…" />

      <div>
        <SubLabel hint="Shared from the Identity section (Official Press Kit).">Mission Press Kit</SubLabel>
        <div style={{ padding: '9px 12px', borderRadius: '7px', background: 'rgba(var(--ink),0.03)', border: '1px dashed var(--border)', fontFamily: 'var(--font-sans)', fontSize: '13px', color: pressKit ? 'rgba(var(--ink),0.85)' : 'rgba(var(--ink),0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pressKit || 'No press kit set.'}
        </div>
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────

const Row2 = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>{children}</div>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--black)', border: '1px solid var(--border)',
  borderRadius: '7px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box', display: 'block',
}

function LField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={label} style={inputStyle} />
    </div>
  )
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0' }}
    >
      <span style={{ width: '32px', height: '18px', borderRadius: '9px', background: on ? 'var(--accent)' : 'var(--raised)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border-hi)'}`, position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: '2px', left: on ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: on ? 'var(--black)' : 'rgba(var(--ink),0.62)', transition: 'left 0.2s' }} />
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.8)' }}>{on ? 'Enabled' : 'Disabled'}</span>
    </button>
  )
}
