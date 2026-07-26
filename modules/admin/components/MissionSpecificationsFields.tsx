'use client'

/**
 * Professional Mission Specifications editor (Phase 1, Feature 3).
 *
 * Controlled, presentational grouping of the ~18 specification fields plus a
 * scientific-instruments token list. Primary / secondary DESTINATION are shown
 * read-only, derived from the classification (single source of truth). Reuses
 * the shared `SubLabel` + `TokenField` from the classification component and
 * matches the CMS design language (tokens, both themes).
 */
import type { MissionSpecifications } from '@/types/mission'
import { SubLabel, TokenField } from '@/modules/admin/components/MissionClassificationFields'

interface Props {
  value:        MissionSpecifications
  onChange:     (next: MissionSpecifications) => void
  /** Effective destinations from the classification (read-only display). */
  destinations: string[]
}

export function MissionSpecificationsFields({ value, onChange, destinations }: Props) {
  function set<K extends keyof MissionSpecifications>(key: K, v: MissionSpecifications[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Spacecraft & programme */}
      <Row2>
        <SpecField label="Spacecraft Name" placeholder="e.g. Perseverance" value={value.spacecraftName} onChange={v => set('spacecraftName', v)} />
        <SpecField label="Spacecraft Manufacturer" placeholder="e.g. JPL / Caltech" value={value.manufacturer} onChange={v => set('manufacturer', v)} />
      </Row2>
      <Row2>
        <SpecField label="Mission Family" hint="A related lineage, e.g. Mars Exploration Rover" placeholder="e.g. Mars 2020" value={value.missionFamily} onChange={v => set('missionFamily', v)} />
        <SpecField label="Program" placeholder="e.g. Mars Exploration Program" value={value.program} onChange={v => set('program', v)} />
      </Row2>

      {/* Launch vehicle & orbit */}
      <Row2>
        <SpecField label="Launch Vehicle" placeholder="e.g. Atlas V 541" value={value.launchVehicle} onChange={v => set('launchVehicle', v)} />
        <SpecField label="Orbit Type" placeholder="e.g. Sun-synchronous LEO" value={value.orbitType} onChange={v => set('orbitType', v)} />
      </Row2>

      {/* Mass */}
      <div>
        <SubLabel hint="Include a unit — e.g. “2,600 kg”.">Mass</SubLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <SpecInput placeholder="Launch mass" value={value.launchMass} onChange={v => set('launchMass', v)} aria-label="Launch mass" />
          <SpecInput placeholder="Dry mass" value={value.dryMass} onChange={v => set('dryMass', v)} aria-label="Dry mass" />
          <SpecInput placeholder="Payload mass" value={value.payloadMass} onChange={v => set('payloadMass', v)} aria-label="Payload mass" />
        </div>
      </div>

      {/* Duration & power */}
      <Row2>
        <SpecField label="Mission Duration" hint="Planned or elapsed" placeholder="e.g. 2 years (planned)" value={value.missionDuration} onChange={v => set('missionDuration', v)} />
        <SpecField label="Expected Mission Lifetime" placeholder="e.g. 10+ years" value={value.expectedLifetime} onChange={v => set('expectedLifetime', v)} />
      </Row2>
      <Row2>
        <SpecField label="Power Source" placeholder="e.g. Solar array + Li-ion" value={value.powerSource} onChange={v => set('powerSource', v)} />
        <SpecField label="Power Output" placeholder="e.g. 2.5 kW" value={value.powerOutput} onChange={v => set('powerOutput', v)} />
      </Row2>

      {/* Payload & comms */}
      <Row2>
        <SpecField label="Primary Payload" placeholder="e.g. Sample caching system" value={value.primaryPayload} onChange={v => set('primaryPayload', v)} />
        <SpecField label="Secondary Payload" placeholder="e.g. Ingenuity helicopter" value={value.secondaryPayload} onChange={v => set('secondaryPayload', v)} />
      </Row2>
      <SpecField label="Communication System" placeholder="e.g. X-band + UHF relay via orbiters" value={value.communicationSystem} onChange={v => set('communicationSystem', v)} />

      {/* Scientific instruments (multi) */}
      <TokenField
        label="Scientific Instruments"
        hint="Add each instrument, then Enter."
        placeholder="e.g. Mastcam-Z"
        selected={value.instruments}
        options={[]}
        onAdd={v => set('instruments', [...value.instruments, v])}
        onRemove={v => set('instruments', value.instruments.filter(i => i !== v))}
        allowCustom
      />

      {/* Budget */}
      <SpecField label="Mission Budget" hint="Optional" placeholder="e.g. $2.7 billion" value={value.budget} onChange={v => set('budget', v)} />

      {/* Destinations — read-only, derived from Classification */}
      <div>
        <SubLabel hint="Derived from Mission Classification — edit them there.">Destinations</SubLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <DerivedField label="Primary" value={destinations[0]} />
          <DerivedField label="Secondary" value={destinations[1]} />
        </div>
      </div>
    </div>
  )
}

// ── Field helpers ────────────────────────────────────────────────────

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>{children}</div>
}

function SpecField({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <SubLabel hint={hint}>{label}</SubLabel>
      <SpecInput value={value} onChange={onChange} placeholder={placeholder} aria-label={label} />
    </div>
  )
}

function SpecInput({ value, onChange, placeholder, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder?: string; 'aria-label'?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
      style={{
        width: '100%', padding: '9px 12px',
        background: 'var(--black)', border: '1px solid var(--border)',
        borderRadius: '7px', color: 'var(--white)',
        fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none',
        boxSizing: 'border-box', display: 'block',
      }}
    />
  )
}

function DerivedField({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{
      padding: '9px 12px', borderRadius: '7px',
      background: 'rgba(var(--ink),0.03)', border: '1px dashed var(--border)',
      display: 'flex', alignItems: 'baseline', gap: '8px',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.45)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: value ? 'rgba(var(--ink),0.85)' : 'rgba(var(--ink),0.35)' }}>
        {value || '—'}
      </span>
    </div>
  )
}
