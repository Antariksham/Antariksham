'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { slugify }    from '@/lib/utils'
import type { MissionStatus, MissionType, MissionTimeline } from '@/types/mission'
import type { AdminMissionFull, AgencyOption } from '@/modules/admin/services/adminMissions'
import { Save, Globe, ChevronDown, Plus, Trash2, AlertCircle, ChevronUp } from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'

const STATUSES: { value: MissionStatus; label: string; color: string }[] = [
  { value: 'active',         label: 'Active',         color: 'var(--green)'  },
  { value: 'upcoming',       label: 'Upcoming',       color: 'var(--accent)' },
  { value: 'in-development', label: 'In Development', color: 'var(--gold)'   },
  { value: 'completed',      label: 'Completed',      color: 'rgba(240,244,250,0.4)' },
  { value: 'failed',         label: 'Failed',         color: 'var(--red)'    },
  { value: 'cancelled',      label: 'Cancelled',      color: 'var(--red)'    },
]

const MISSION_TYPES: { value: MissionType; label: string }[] = [
  { value: 'crewed',         label: 'Crewed'         },
  { value: 'robotic',        label: 'Robotic'        },
  { value: 'flyby',          label: 'Flyby'          },
  { value: 'orbiter',        label: 'Orbiter'        },
  { value: 'lander',         label: 'Lander'         },
  { value: 'rover',          label: 'Rover'          },
  { value: 'sample-return',  label: 'Sample Return'  },
  { value: 'telescope',      label: 'Telescope'      },
]

interface FormState {
  name:             string
  slug:             string
  description:      string
  agencyId:         string
  status:           MissionStatus
  missionType:      MissionType
  destination:      string
  launchDate:       string
  featuredImage:    string
  featured:         boolean
  timeline:         MissionTimeline[]
  _showMediaPicker: boolean
}

interface Props {
  mode:      'new' | 'edit'
  mission?:  AdminMissionFull
  agencies:  AgencyOption[]
}

export function MissionForm({ mode, mission, agencies }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    name:             mission?.name          || '',
    slug:             mission?.slug          || '',
    description:      mission?.description   || '',
    agencyId:         mission?.agencyId      || '',
    status:           mission?.status        || 'upcoming',
    missionType:      mission?.missionType   || 'robotic',
    destination:      mission?.destination   || '',
    launchDate:       mission?.launchDate    || '',
    featuredImage:    mission?.featuredImage || '',
    featured:         mission?.featured      || false,
    timeline:         mission?.timeline      || [],
    _showMediaPicker: false,
  })

  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')

  function handleNameChange(val: string) {
    setForm(f => ({ ...f, name: val, slug: slugEdited ? f.slug : slugify(val) }))
  }

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  // ── Timeline helpers ──────────────────────────────────────

  function addTimelineEvent() {
    setForm(f => ({
      ...f,
      timeline: [...f.timeline, { date: '', title: '', description: '', completed: false }],
    }))
  }

  function updateTimelineEvent(index: number, field: keyof MissionTimeline, value: any) {
    setForm(f => {
      const tl = [...f.timeline]
      tl[index] = { ...tl[index], [field]: value }
      return { ...f, timeline: tl }
    })
  }

  function removeTimelineEvent(index: number) {
    setForm(f => ({ ...f, timeline: f.timeline.filter((_, i) => i !== index) }))
  }

  function moveTimeline(index: number, dir: -1 | 1) {
    setForm(f => {
      const tl  = [...f.timeline]
      const to  = index + dir
      if (to < 0 || to >= tl.length) return f
      ;[tl[index], tl[to]] = [tl[to], tl[index]]
      return { ...f, timeline: tl }
    })
  }

  // ── Save ──────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim())        { setError('Name is required.');        return }
    if (!form.slug.trim())        { setError('Slug is required.');        return }
    if (!form.description.trim()) { setError('Description is required.'); return }

    setSaving(true); setError(''); setSuccess('')

    const payload = {
      ...form,
      featuredImage: form.featuredImage || null,
      agencyId:      form.agencyId      || null,
      launchDate:    form.launchDate     || null,
    }

    try {
      const url    = mode === 'edit' ? `/api/admin/missions?id=${mission!.id}` : '/api/admin/missions'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Failed to save.'); return }

      setSuccess('Mission saved!')
      if (mode === 'new') {
        router.push(`/admin/missions/${data.id}`)
      } else {
        router.refresh()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = STATUSES.find(s => s.value === form.status)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

      {/* ── Left column ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Name */}
        <div>
          <FieldLabel>Mission Name</FieldLabel>
          <input
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Artemis III"
            style={inputStyle({ large: true })}
          />
        </div>

        {/* Slug */}
        <div>
          <FieldLabel hint={`/missions/${form.slug || '…'}`}>Slug</FieldLabel>
          <input
            value={form.slug}
            onChange={e => { setSlugEdited(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')) }}
            placeholder="url-friendly-slug"
            style={inputStyle({})}
          />
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Mission overview shown on the missions page and individual mission page…"
            rows={5}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7 }}
          />
        </div>

        {/* Destination */}
        <div>
          <FieldLabel hint="e.g. Moon, Mars, Europa, Low Earth Orbit">Destination</FieldLabel>
          <input
            value={form.destination}
            onChange={e => set('destination', e.target.value)}
            placeholder="Moon"
            style={inputStyle({})}
          />
        </div>

        {/* Featured image */}
        <div>
          <FieldLabel hint="Upload via Media Library or paste a URL directly">Featured Image</FieldLabel>

          {/* URL input + Media Library picker toggle */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <input
              value={form.featuredImage}
              onChange={e => set('featuredImage', e.target.value)}
              placeholder="https://… or pick from Media Library →"
              style={{ ...inputStyle({}), flex: 1 }}
            />
            <button
              type="button"
              onClick={() => set('_showMediaPicker', !form._showMediaPicker)}
              style={{
                flexShrink:    0,
                padding:       '0 14px',
                background:    form._showMediaPicker ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                border:        '1px solid',
                borderColor:   form._showMediaPicker ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                borderRadius:  '6px',
                color:         form._showMediaPicker ? '#07090c' : 'rgba(240,244,250,0.7)',
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                whiteSpace:    'nowrap',
                transition:    'all 0.15s',
              }}
            >
              {form._showMediaPicker ? '✕ Close' : '📁 Browse'}
            </button>
          </div>

          {/* Inline media picker */}
          {form._showMediaPicker && (
            <div style={{ marginTop: '12px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <MediaLibrary
                pickerMode
                defaultBucket="mission-images"
                onPick={url => {
                  set('featuredImage', url)
                  set('_showMediaPicker', false)
                }}
              />
            </div>
          )}

          {/* Image preview */}
          {form.featuredImage && !form._showMediaPicker && (
            <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/5', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <img
                src={form.featuredImage}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>

        {/* ── Timeline builder ────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <FieldLabel>Mission Timeline</FieldLabel>
            <button
              onClick={addTimelineEvent}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '5px', cursor: 'pointer',
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'rgba(240,244,250,0.6)', fontFamily: 'var(--font-mono)',
                fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              <Plus size={10} /> Add Event
            </button>
          </div>

          {form.timeline.length === 0 ? (
            <div style={{ padding: '24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                No timeline events — click Add Event to start
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {form.timeline.map((event, i) => (
                <div
                  key={i}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative' }}
                >
                  {/* Event header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    {/* Completed toggle */}
                    <div
                      onClick={() => updateTimelineEvent(i, 'completed', !event.completed)}
                      style={{
                        width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                        background: event.completed ? 'var(--green)' : 'transparent',
                        border: `2px solid ${event.completed ? 'var(--green)' : 'rgba(255,255,255,0.2)'}`,
                        boxShadow: event.completed ? '0 0 6px rgba(52,216,151,0.4)' : 'none',
                        transition: 'all 0.15s',
                      }}
                      title={event.completed ? 'Mark incomplete' : 'Mark completed'}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: event.completed ? 'var(--green)' : 'rgba(240,244,250,0.3)', flex: 1 }}>
                      Event {i + 1} {event.completed ? '· Completed' : '· Upcoming'}
                    </span>
                    {/* Move up/down */}
                    <button onClick={() => moveTimeline(i, -1)} disabled={i === 0} style={iconBtnStyle}>
                      <ChevronUp size={11} />
                    </button>
                    <button onClick={() => moveTimeline(i, 1)} disabled={i === form.timeline.length - 1} style={iconBtnStyle}>
                      <ChevronDown size={11} />
                    </button>
                    <button onClick={() => removeTimelineEvent(i)} style={{ ...iconBtnStyle, color: 'rgba(240,90,90,0.6)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={event.date}
                      onChange={e => updateTimelineEvent(i, 'date', e.target.value)}
                      placeholder="e.g. Nov 2024"
                      style={{ ...inputStyle({}), fontSize: '12px' }}
                    />
                    <input
                      value={event.title}
                      onChange={e => updateTimelineEvent(i, 'title', e.target.value)}
                      placeholder="Event title"
                      style={{ ...inputStyle({}), fontSize: '12px' }}
                    />
                  </div>
                  <input
                    value={event.description}
                    onChange={e => updateTimelineEvent(i, 'description', e.target.value)}
                    placeholder="Brief description (optional)"
                    style={{ ...inputStyle({}), fontSize: '12px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Right sidebar ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

        {/* Error / success */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(240,90,90,0.08)', border: '1px solid rgba(240,90,90,0.25)', borderRadius: '7px' }}>
            <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', background: 'rgba(52,216,151,0.08)', border: '1px solid rgba(52,216,151,0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)' }}>
            ✓ {success}
          </div>
        )}

        {/* Save */}
        <SidePanel label="Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={handleSave} disabled={saving} style={btnStyle({ primary: true, disabled: saving })}>
              <Save size={12} />
              {saving ? 'Saving…' : 'Save Mission'}
            </button>
            {mode === 'edit' && mission?.slug && (
              <a
                href={`/missions/${mission.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnStyle({}), textDecoration: 'none', textAlign: 'center' as const, justifyContent: 'center' }}
              >
                <Globe size={12} />
                View Mission
              </a>
            )}
          </div>
        </SidePanel>

        {/* Status */}
        <SidePanel label="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => set('status', s.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '5px', cursor: 'pointer',
                  background: form.status === s.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: `1px solid ${form.status === s.value ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: form.status === s.value && s.value === 'active' ? `0 0 6px ${s.color}` : 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: form.status === s.value ? 'var(--white)' : 'rgba(240,244,250,0.45)' }}>
                  {s.label}
                </span>
                {form.status === s.value && (
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9px', color: s.color }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </SidePanel>

        {/* Mission type */}
        <SidePanel label="Mission Type">
          <div style={{ position: 'relative' }}>
            <select
              value={form.missionType}
              onChange={e => set('missionType', e.target.value as MissionType)}
              style={{ ...inputStyle({}), paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
            >
              {MISSION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,250,0.4)', pointerEvents: 'none' }} />
          </div>
        </SidePanel>

        {/* Agency */}
        <SidePanel label="Space Agency">
          <div style={{ position: 'relative' }}>
            <select
              value={form.agencyId}
              onChange={e => set('agencyId', e.target.value)}
              style={{ ...inputStyle({}), paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">— No agency —</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.shortName})</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,250,0.4)', pointerEvents: 'none' }} />
          </div>
        </SidePanel>

        {/* Launch date */}
        <SidePanel label="Launch Date">
          <input
            type="date"
            value={form.launchDate}
            onChange={e => set('launchDate', e.target.value)}
            style={{ ...inputStyle({}), colorScheme: 'dark' }}
          />
        </SidePanel>

        {/* Featured */}
        <SidePanel label="Options">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => set('featured', !form.featured)}
              style={{
                width: '32px', height: '18px', borderRadius: '9px',
                background: form.featured ? 'var(--accent)' : 'var(--raised)',
                border: `1px solid ${form.featured ? 'var(--accent)' : 'var(--border-hi)'}`,
                position: 'relative', transition: 'all 0.2s', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: '2px',
                left: form.featured ? '14px' : '2px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: form.featured ? '#07090c' : 'rgba(240,244,250,0.4)',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)' }}>
              Featured mission
            </span>
          </label>
        </SidePanel>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.5)' }}>
        {children}
      </label>
      {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(240,244,250,0.3)', letterSpacing: '0.04em' }}>{hint}</span>}
    </div>
  )
}

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.4)' }}>{label}</span>
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '22px', height: '22px', borderRadius: '4px',
  border: 'none', background: 'transparent',
  color: 'rgba(240,244,250,0.4)', cursor: 'pointer',
}

function inputStyle({ large }: { large?: boolean }): React.CSSProperties {
  return {
    width: '100%', padding: large ? '12px 14px' : '9px 12px',
    background: '#0b0e13', border: '1px solid var(--border)',
    borderRadius: '7px', color: '#f0f4fa',
    fontFamily: large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize: large ? '20px' : '13px', outline: 'none',
    boxSizing: 'border-box', display: 'block', transition: 'border-color 0.2s',
  }
}

function btnStyle({ primary, disabled }: { primary?: boolean; disabled?: boolean }): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    width: '100%', padding: '9px 14px', borderRadius: '6px',
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    background: primary ? 'var(--accent)' : 'var(--surface)',
    color: primary ? '#07090c' : 'rgba(240,244,250,0.7)',
    border: primary ? 'none' : '1px solid var(--border-hi)',
    transition: 'all 0.15s',
  }
}
