'use client'

/**
 * Advanced Timeline builder (Phase 1, Feature 5).
 *
 * A professional milestone editor: rich per-event fields, drag-and-drop
 * reordering (grip handle) plus keyboard up/down, expand/collapse,
 * duplicate + delete, a one-click "Sort by date", color-coded status +
 * importance, and a duplicate-date warning. Backward compatible with the
 * old {date,title,description,completed} events (normalised on load). Controlled;
 * matches the CMS design language (tokens, both themes).
 */
import { useRef, useState } from 'react'
import {
  GripVertical, ChevronDown, ChevronRight, ChevronUp, Copy, Trash2, Plus, ArrowDownUp, AlertTriangle,
} from 'lucide-react'
import type { MissionTimeline } from '@/types/mission'
import {
  TIMELINE_STATUSES, TIMELINE_IMPORTANCE, TIMELINE_EVENT_TYPES,
  timelineStatusMeta, timelineImportanceMeta,
  normalizeTimelineEvent, genEventId, sortTimelineByDate, duplicateDateIndexes,
} from '@/modules/missions/services/missionTimeline'

interface Props {
  value:    MissionTimeline[]
  onChange: (events: MissionTimeline[]) => void
}

export function MissionTimelineBuilder({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const dupes = new Set(duplicateDateIndexes(value))

  function patch(i: number, changes: Partial<MissionTimeline>) {
    onChange(value.map((e, idx) => {
      if (idx !== i) return e
      const next = { ...e, ...changes }
      if ('status' in changes) next.completed = changes.status === 'completed'
      return next
    }))
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= value.length || from === to) return
    const next = [...value]; const [x] = next.splice(from, 1); next.splice(to, 0, x); onChange(next)
  }
  function add() {
    const e = normalizeTimelineEvent({})
    onChange([...value, e]); setExpanded(e.id!)
  }
  function duplicate(i: number) {
    const copy = { ...value[i], id: genEventId(), title: value[i].title ? `${value[i].title} (copy)` : '' }
    const next = [...value]; next.splice(i + 1, 0, copy); onChange(next); setExpanded(copy.id!)
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <ToolbarBtn onClick={add}><Plus size={11} /> Add Event</ToolbarBtn>
        {value.length > 1 && (
          <ToolbarBtn onClick={() => onChange(sortTimelineByDate(value))}><ArrowDownUp size={11} /> Sort by date</ToolbarBtn>
        )}
        {dupes.size > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--gold)' }}>
            <AlertTriangle size={12} /> Duplicate dates
          </span>
        )}
      </div>

      {value.length === 0 ? (
        <div style={{ padding: '24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            No timeline events — click Add Event to start
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {value.map((event, i) => {
            const isOpen = expanded === event.id
            const status = timelineStatusMeta(event.status || (event.completed ? 'completed' : 'upcoming'))
            const importance = timelineImportanceMeta(event.importance || 'normal')
            return (
              <div
                key={event.id || i}
                onDragOver={e => { e.preventDefault(); if (overIndex !== i) setOverIndex(i) }}
                onDrop={e => { e.preventDefault(); if (dragIndex.current != null) move(dragIndex.current, i); dragIndex.current = null; setOverIndex(null) }}
                style={{
                  background: 'var(--surface)', borderRadius: '8px',
                  border: `1px solid ${overIndex === i ? 'var(--accent)' : dupes.has(i) ? 'rgba(243,156,18,0.4)' : 'var(--border)'}`,
                  borderLeft: `3px solid ${status.color}`,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px' }}>
                  <span
                    draggable
                    onDragStart={e => { dragIndex.current = i; e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { dragIndex.current = null; setOverIndex(null) }}
                    role="button" aria-label="Drag to reorder" title="Drag to reorder"
                    style={{ display: 'inline-flex', color: 'rgba(var(--ink),0.4)', cursor: 'grab', flexShrink: 0 }}
                  >
                    <GripVertical size={14} />
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : (event.id || null))}
                    aria-expanded={isOpen}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'inherit' }}
                  >
                    {isOpen ? <ChevronDown size={13} style={{ color: 'rgba(var(--ink),0.5)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: 'rgba(var(--ink),0.5)', flexShrink: 0 }} />}
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.6)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {event.date || '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title || <em style={{ color: 'rgba(var(--ink),0.4)' }}>Untitled event</em>}
                    </span>
                    {event.eventType && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.55)', border: '1px solid rgba(var(--ink),0.14)', borderRadius: '3px', padding: '1px 6px', flexShrink: 0 }}>
                        {event.eventType}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: importance.color, flexShrink: 0 }}>
                      {importance.label}
                    </span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    <IconBtn onClick={() => move(i, i - 1)} disabled={i === 0} label="Move up"><ChevronUp size={13} /></IconBtn>
                    <IconBtn onClick={() => move(i, i + 1)} disabled={i === value.length - 1} label="Move down"><ChevronDown size={13} /></IconBtn>
                    <IconBtn onClick={() => duplicate(i)} label="Duplicate"><Copy size={12} /></IconBtn>
                    <IconBtn onClick={() => remove(i)} label="Delete" danger><Trash2 size={12} /></IconBtn>
                  </div>
                </div>

                {/* Body */}
                {isOpen && (
                  <div style={{ padding: '4px 14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)' }}>
                    <Field label="Event Title">
                      <TInput value={event.title} onChange={v => patch(i, { title: v })} placeholder="e.g. Orbit insertion burn" />
                    </Field>

                    <Row3>
                      <Field label="Date"><TInput value={event.date} onChange={v => patch(i, { date: v })} placeholder="e.g. 2024-11-15" /></Field>
                      <Field label="Time"><TInput value={event.time || ''} onChange={v => patch(i, { time: v })} placeholder="e.g. 14:30" /></Field>
                      <Field label="Timezone"><TInput value={event.timezone || ''} onChange={v => patch(i, { timezone: v })} placeholder="e.g. UTC" /></Field>
                    </Row3>

                    <Row3>
                      <Field label="Status">
                        <TSelect value={event.status || 'upcoming'} onChange={v => patch(i, { status: v as MissionTimeline['status'] })}>
                          {TIMELINE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </TSelect>
                      </Field>
                      <Field label="Importance">
                        <TSelect value={event.importance || 'normal'} onChange={v => patch(i, { importance: v as MissionTimeline['importance'] })}>
                          {TIMELINE_IMPORTANCE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </TSelect>
                      </Field>
                      <Field label="Event Type">
                        <TInput value={event.eventType || ''} onChange={v => patch(i, { eventType: v })} placeholder="Select or type…" list="mission-timeline-event-types" />
                      </Field>
                    </Row3>

                    <Field label="Short Description">
                      <TTextarea rows={2} value={event.description} onChange={v => patch(i, { description: v })} placeholder="One-line summary shown in the timeline" />
                    </Field>
                    <Field label="Detailed Description">
                      <TTextarea rows={4} value={event.detailedDescription || ''} onChange={v => patch(i, { detailedDescription: v })} placeholder="The full account of what happened" />
                    </Field>

                    <Row2>
                      <Field label="Location"><TInput value={event.location || ''} onChange={v => patch(i, { location: v })} placeholder="e.g. Kennedy Space Center, LC-39A" /></Field>
                      <Field label="Source URL"><TInput value={event.sourceUrl || ''} onChange={v => patch(i, { sourceUrl: v })} placeholder="https://…" /></Field>
                    </Row2>
                    <Row2>
                      <Field label="Image URL"><TInput value={event.image || ''} onChange={v => patch(i, { image: v })} placeholder="https://…" /></Field>
                      <Field label="Video URL (optional)"><TInput value={event.videoUrl || ''} onChange={v => patch(i, { videoUrl: v })} placeholder="https://…" /></Field>
                    </Row2>

                    <Field label="Notes">
                      <TTextarea rows={2} value={event.notes || ''} onChange={v => patch(i, { notes: v })} placeholder="Internal notes (not shown publicly)" />
                    </Field>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Shared datalist of suggested event types */}
      <datalist id="mission-timeline-event-types">
        {TIMELINE_EVENT_TYPES.map(t => <option key={t} value={t} />)}
      </datalist>
    </div>
  )
}

// ── Field helpers ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>{label}</label>
      {children}
    </div>
  )
}
const Row2 = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
const Row3 = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>{children}</div>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--black)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box', display: 'block',
}

function TInput({ value, onChange, placeholder, list }: { value: string; onChange: (v: string) => void; placeholder?: string; list?: string }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} list={list} style={inputStyle} />
}
function TTextarea({ value, onChange, placeholder, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
}
function TSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: '26px', cursor: 'pointer' }}>{children}</select>
      <ChevronDown size={12} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--ink),0.6)', pointerEvents: 'none' }} />
    </div>
  )
}

function ToolbarBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer',
      background: 'var(--surface)', border: '1px solid var(--border)', color: 'rgba(var(--ink),0.82)',
      fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>{children}</button>
  )
}

function IconBtn({ onClick, disabled, label, danger, children }: {
  onClick: () => void; disabled?: boolean; label: string; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px',
      borderRadius: '4px', border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
      color: danger ? 'rgba(231,76,60,0.7)' : 'rgba(var(--ink),0.6)', opacity: disabled ? 0.35 : 1,
    }}>{children}</button>
  )
}
