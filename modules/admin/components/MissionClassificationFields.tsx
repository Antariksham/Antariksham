'use client'

/**
 * Rich Mission Classification editor (Phase 1, Feature 2).
 *
 * Renders the multi-value classification controls — mission types (multi),
 * destinations (searchable multi, custom allowed) and space agencies by role
 * (primary + partners / commercial / institutions) — plus a `StatusSelect` for
 * the 15-stage lifecycle status (used in the form sidebar).
 *
 * Purely presentational + controlled: it owns no mission state, only the small
 * transient UI state (search query / open dropdown). All persistence, mapping
 * to base columns and validation live in the pure `missionClassification`
 * service. Matches the CMS design language (tokens, font-mono labels, both
 * themes) and is keyboard accessible.
 */
import { useState, useMemo, useRef } from 'react'
import { X, ChevronDown, Star, Plus } from 'lucide-react'
import type { MissionClassification } from '@/types/mission'
import type { AgencyOption } from '@/modules/admin/services/adminMissions'
import {
  MISSION_TYPE_TAGS, MISSION_STATUSES, STATUS_GROUPS, DESTINATION_SUGGESTIONS,
  typeLabel, statusMeta,
} from '@/modules/missions/services/missionClassification'

interface Props {
  value:                 MissionClassification
  onChange:              (next: MissionClassification) => void
  primaryAgencyId:       string
  onPrimaryAgencyChange: (id: string) => void
  agencies:              AgencyOption[]
}

export function MissionClassificationFields({
  value, onChange, primaryAgencyId, onPrimaryAgencyChange, agencies,
}: Props) {
  const agencyOptions = useMemo(
    () => agencies.map(a => ({ value: a.id, label: `${a.name} (${a.shortName})` })),
    [agencies],
  )
  const agencyLabel = useMemo(() => {
    const m = new Map(agencies.map(a => [a.id, a.name]))
    return (id: string) => m.get(id) || id
  }, [agencies])

  // Types: order matters — index 0 is the primary type. Toggling appends/removes.
  function toggleType(tag: string) {
    const has = value.types.includes(tag)
    onChange({ ...value, types: has ? value.types.filter(t => t !== tag) : [...value.types, tag] })
  }

  function setDestinations(destinations: string[]) { onChange({ ...value, destinations }) }
  function setRole(role: keyof MissionClassification['agencies'], ids: string[]) {
    onChange({ ...value, agencies: { ...value.agencies, [role]: ids } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Mission types (multi) ─────────────────────────── */}
      <div>
        <SubLabel hint="Select all that apply. The first selected is the primary type.">
          Mission Types
        </SubLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {MISSION_TYPE_TAGS.map(t => {
            const active    = value.types.includes(t.value)
            const isPrimary = active && value.types[0] === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 11px', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '13px', letterSpacing: '0.02em',
                  background:  active ? 'var(--accent)' : 'rgba(var(--ink),0.04)',
                  border:      `1px solid ${active ? 'var(--accent)' : 'rgba(var(--ink),0.12)'}`,
                  color:       active ? 'var(--black)' : 'rgba(var(--ink),0.82)',
                  transition:  'all 0.15s',
                }}
              >
                {isPrimary && <Star size={11} fill="currentColor" />}
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Destinations (searchable multi, custom allowed) ── */}
      <TokenField
        label="Destinations"
        hint="Search or type a custom destination, then Enter. First is the primary."
        placeholder="Search destinations, or type a custom one…"
        selected={value.destinations}
        options={DESTINATION_SUGGESTIONS.map(d => ({ value: d, label: d }))}
        onAdd={v => setDestinations([...value.destinations, v])}
        onRemove={v => setDestinations(value.destinations.filter(d => d !== v))}
        allowCustom
        firstIsPrimary
      />

      {/* ── Space agencies ────────────────────────────────── */}
      <div>
        <SubLabel hint="Every organisation is selectable independently.">Space Agencies</SubLabel>

        {/* Primary agency (base column) */}
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>
          Primary Agency
        </label>
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <select
            value={primaryAgencyId}
            onChange={e => onPrimaryAgencyChange(e.target.value)}
            style={{ ...selectStyle, paddingRight: '28px' }}
          >
            <option value="">— No primary agency —</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name} ({a.shortName})</option>)}
          </select>
          <ChevronDown size={12} style={caretStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <TokenField
            label="Partner Agencies" compact
            placeholder="Add a partner agency…"
            selected={value.agencies.partners}
            options={agencyOptions}
            resolveLabel={agencyLabel}
            onAdd={v => setRole('partners', [...value.agencies.partners, v])}
            onRemove={v => setRole('partners', value.agencies.partners.filter(x => x !== v))}
          />
          <TokenField
            label="Commercial Partners" compact
            placeholder="Add a commercial partner…"
            selected={value.agencies.commercial}
            options={agencyOptions}
            resolveLabel={agencyLabel}
            onAdd={v => setRole('commercial', [...value.agencies.commercial, v])}
            onRemove={v => setRole('commercial', value.agencies.commercial.filter(x => x !== v))}
          />
          <TokenField
            label="Scientific Institutions" compact
            placeholder="Add a scientific institution…"
            selected={value.agencies.institutions}
            options={agencyOptions}
            resolveLabel={agencyLabel}
            onAdd={v => setRole('institutions', [...value.agencies.institutions, v])}
            onRemove={v => setRole('institutions', value.agencies.institutions.filter(x => x !== v))}
          />
        </div>
      </div>
    </div>
  )
}

// ── 15-stage lifecycle status select (used in the form sidebar) ──────

export function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const meta = statusMeta(value)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        aria-hidden
        style={{ width: 9, height: 9, borderRadius: '50%', background: meta.color, flexShrink: 0, boxShadow: `0 0 6px ${meta.color}` }}
      />
      <div style={{ position: 'relative', flex: 1 }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Mission status"
          style={{ ...selectStyle, paddingRight: '28px' }}
        >
          {STATUS_GROUPS.map(group => (
            <optgroup key={group} label={group}>
              {MISSION_STATUSES.filter(s => s.group === group).map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown size={12} style={caretStyle} />
      </div>
    </div>
  )
}

// ── Searchable multi-select token field ──────────────────────────────

interface TokenFieldProps {
  label:         string
  hint?:         string
  placeholder?:  string
  selected:      string[]
  options:       { value: string; label: string }[]
  onAdd:         (value: string) => void
  onRemove:      (value: string) => void
  allowCustom?:  boolean
  firstIsPrimary?: boolean
  compact?:      boolean
  /** Label for a selected token when it isn't in `options` (e.g. resolved id). */
  resolveLabel?: (value: string) => string
}

export function TokenField({
  label, hint, placeholder, selected, options, onAdd, onRemove,
  allowCustom, firstIsPrimary, compact, resolveLabel,
}: TokenFieldProps) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = query.trim().toLowerCase()
  const matches = options.filter(o => !selected.includes(o.value) && o.label.toLowerCase().includes(q))
  const exact   = options.some(o => o.label.toLowerCase() === q) || selected.some(s => s.toLowerCase() === q)
  const showCustom = !!allowCustom && q.length > 0 && !exact

  function labelFor(value: string): string {
    const opt = options.find(o => o.value === value)
    if (opt) return opt.label
    return resolveLabel ? resolveLabel(value) : value
  }

  function add(value: string) {
    const v = value.trim()
    if (!v || selected.includes(v)) { setQuery(''); return }
    onAdd(v)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (matches[0]) add(matches[0].value)
      else if (showCustom) add(query)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div>
      {compact
        ? <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>{label}</label>
        : <SubLabel hint={hint}>{label}</SubLabel>}

      {/* Selected tokens */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {selected.map((v, i) => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 6px 4px 10px', borderRadius: '6px',
              background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)',
              fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.9)',
            }}>
              {firstIsPrimary && i === 0 && <Star size={10} fill="var(--accent)" color="var(--accent)" />}
              {labelFor(v)}
              <button
                type="button"
                onClick={() => onRemove(v)}
                aria-label={`Remove ${labelFor(v)}`}
                style={{ display: 'inline-flex', border: 'none', background: 'transparent', color: 'rgba(var(--ink),0.55)', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
          placeholder={placeholder}
          style={inputStyle}
        />
        {open && (matches.length > 0 || showCustom) && (
          <div
            onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current) }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
              maxHeight: '220px', overflowY: 'auto',
              background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '4px',
            }}
          >
            {showCustom && (
              <DropdownRow onClick={() => add(query)}>
                <Plus size={12} /> Add “{query.trim()}”
              </DropdownRow>
            )}
            {matches.slice(0, 40).map(o => (
              <DropdownRow key={o.value} onClick={() => add(o.value)}>{o.label}</DropdownRow>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DropdownRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px', width: '100%', textAlign: 'left',
        padding: '8px 10px', borderRadius: '5px', border: 'none', background: 'transparent',
        fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.9)', cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--ink),0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ── Shared bits ──────────────────────────────────────────────────────

export function SubLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
        {children}
      </label>
      {hint && <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.55)', lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--black)', border: '1px solid var(--border)',
  borderRadius: '7px', color: 'var(--white)',
  fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', display: 'block',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none', cursor: 'pointer',
}

const caretStyle: React.CSSProperties = {
  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
  color: 'rgba(var(--ink),0.82)', pointerEvents: 'none',
}
