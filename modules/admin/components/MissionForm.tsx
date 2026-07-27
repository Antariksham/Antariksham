'use client'

import { useState, useMemo } from 'react'
import { useRouter }  from 'next/navigation'
import { slugify }    from '@/lib/utils'
import type { MissionTimeline, MissionIdentity, MissionClassification, MissionSpecifications, MissionObjectives } from '@/types/mission'
import type { AdminMissionFull, AgencyOption } from '@/modules/admin/services/adminMissions'
import { Save, Globe, AlertCircle, Info } from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import { TranslationEditor } from '@/modules/admin/components/TranslationEditor'
import { MissionClassificationFields, StatusSelect } from '@/modules/admin/components/MissionClassificationFields'
import { MissionSpecificationsFields } from '@/modules/admin/components/MissionSpecificationsFields'
import { MissionObjectivesFields } from '@/modules/admin/components/MissionObjectivesFields'
import { MissionTimelineBuilder } from '@/modules/admin/components/MissionTimelineBuilder'
import { TRANSLATION_LANGUAGES, type LanguageCode } from '@/lib/i18n'
import { emptyIdentity } from '@/modules/missions/services/missionIdentity'
import { emptyClassification } from '@/modules/missions/services/missionClassification'
import { emptySpecifications, validateSpecifications } from '@/modules/missions/services/missionSpecifications'
import { emptyObjectives, validateObjectives } from '@/modules/missions/services/missionObjectives'
import {
  validateMission, hasBlockingErrors, errorsOnly, issueForField, coerceUrl,
  MISSION_LIMITS, type FieldIssue,
} from '@/modules/missions/services/missionValidation'

interface FormState {
  name:             string
  slug:             string
  description:      string
  identity:         MissionIdentity
  classification:   MissionClassification
  specifications:   MissionSpecifications
  objectives:       MissionObjectives
  agencyId:         string
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
    identity:         mission?.identity      || emptyIdentity(),
    classification:   mission?.classification || emptyClassification(),
    specifications:   mission?.specifications || emptySpecifications(),
    objectives:       mission?.objectives    || emptyObjectives(),
    agencyId:         mission?.agencyId      || '',
    launchDate:       mission?.launchDate    || '',
    featuredImage:    mission?.featuredImage || '',
    featured:         mission?.featured      || false,
    timeline:         mission?.timeline      || [],
    _showMediaPicker: false,
  })

  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [warnings,   setWarnings]   = useState<string[]>([])
  const [attempted,  setAttempted]  = useState(false)
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')
  const [activeLang, setActiveLang] = useState<LanguageCode>('en')

  // Live validation (shared with the API). Errors block save; warnings advise.
  const issues = useMemo(
    () => [
      ...validateMission({ name: form.name, slug: form.slug, description: form.description, identity: form.identity }),
      ...validateSpecifications(form.specifications),
      ...validateObjectives(form.objectives),
    ],
    [form.name, form.slug, form.description, form.identity, form.specifications, form.objectives],
  )
  // Field-level errors are shown only after a save attempt (no nagging while
  // typing); URL-format errors show live because they're immediately useful.
  const errFor = (field: string): FieldIssue | undefined =>
    attempted ? issueForField(errorsOnly(issues), field) : undefined
  const urlIssue = (field: string): FieldIssue | undefined =>
    issueForField(issues, field) // present only when a URL is non-empty and invalid

  function handleNameChange(val: string) {
    setForm(f => ({ ...f, name: val, slug: slugEdited ? f.slug : slugify(val) }))
    setError('')
  }

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setError('')
  }

  // Update one enhanced-identity field.
  function setId<K extends keyof MissionIdentity>(key: K, val: string) {
    setForm(f => ({ ...f, identity: { ...f.identity, [key]: val } }))
    setError('')
  }

  // On blur, normalise a URL field (bare domain → https://…).
  function blurUrl(key: 'website' | 'wikipedia' | 'pressKit') {
    setForm(f => ({ ...f, identity: { ...f.identity, [key]: coerceUrl(f.identity[key]) } }))
  }


  // ── Save ──────────────────────────────────────────────────

  async function handleSave() {
    setAttempted(true)
    if (hasBlockingErrors(issues)) {
      setError(errorsOnly(issues)[0].message)
      return
    }

    setSaving(true); setError(''); setSuccess(''); setWarnings([])

    // Normalise URL fields before sending (bare domain → https://…).
    const identity: MissionIdentity = {
      ...form.identity,
      website:   coerceUrl(form.identity.website),
      wikipedia: coerceUrl(form.identity.wikipedia),
      pressKit:  coerceUrl(form.identity.pressKit),
    }

    const payload = {
      ...form,
      identity,
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

      if (Array.isArray(data.warnings)) setWarnings(data.warnings)
      setSuccess('Mission saved!')
      if (mode === 'new') {
        router.push(`/admin/missions/${data.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>

      {/* Language tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <LangTab active={activeLang === 'en'} onClick={() => setActiveLang('en')}>English</LangTab>
        {TRANSLATION_LANGUAGES.map(l => (
          <LangTab
            key={l.code}
            active={activeLang === l.code}
            disabled={mode === 'new'}
            title={mode === 'new' ? 'Save the mission first, then add translations' : undefined}
            onClick={() => { if (mode !== 'new') setActiveLang(l.code) }}
          >
            {l.native}
          </LangTab>
        ))}
      </div>

      {/* Translation panes (edit mode) — kept mounted so edits survive tab switches */}
      {mode === 'edit' && mission && TRANSLATION_LANGUAGES.map(l => (
        <div key={l.code} style={{ display: activeLang === l.code ? 'block' : 'none' }}>
          <TranslationEditor
            endpoint="/api/admin/missions/translations"
            idParam="id"
            entityId={mission.id}
            lang={l.code}
            fields={[
              { key: 'name',        label: 'Name',        type: 'input' },
              { key: 'description', label: 'Description', type: 'code', rows: 10 },
            ]}
            english={{ name: form.name, description: form.description }}
            requiredKeys={['name', 'description']}
          />
        </div>
      ))}

      {/* English pane */}
      <div style={{ display: activeLang === 'en' ? 'grid' : 'none', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

      {/* ── Left column ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <GroupHeading hint="The mission's core identity — how it's named, labelled and referenced across the platform.">
          Mission Identity
        </GroupHeading>

        {/* Name */}
        <div>
          <FieldLabel hint={<CharCount value={form.name} max={MISSION_LIMITS.name} />}>Mission Name</FieldLabel>
          <input
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Artemis III"
            style={inputStyle({ large: true })}
          />
          <FieldMsg issue={errFor('name')} />
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
          <FieldMsg issue={errFor('slug') || (attempted ? issueForField(issues, 'slug') : undefined)} />
        </div>

        {/* Short name + acronym */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <FieldLabel hint={<CharCount value={form.identity.shortName} max={MISSION_LIMITS.shortName} />}>Short Name</FieldLabel>
            <input
              value={form.identity.shortName}
              onChange={e => setId('shortName', e.target.value)}
              placeholder="e.g. ISS"
              style={inputStyle({})}
            />
          </div>
          <div>
            <FieldLabel hint={<CharCount value={form.identity.acronym} max={MISSION_LIMITS.acronym} />}>Acronym</FieldLabel>
            <input
              value={form.identity.acronym}
              onChange={e => setId('acronym', e.target.value)}
              placeholder="e.g. JWST"
              style={inputStyle({})}
            />
            <FieldMsg issue={errFor('acronym')} />
          </div>
        </div>

        {/* Subtitle */}
        <div>
          <FieldLabel hint={<CharCount value={form.identity.subtitle} max={MISSION_LIMITS.subtitle} />}>Subtitle</FieldLabel>
          <input
            value={form.identity.subtitle}
            onChange={e => setId('subtitle', e.target.value)}
            placeholder="A one-line tagline shown under the mission name"
            style={inputStyle({})}
          />
          <FieldMsg issue={errFor('subtitle')} />
        </div>

        {/* Alias */}
        <div>
          <FieldLabel hint={<CharCount value={form.identity.alias} max={MISSION_LIMITS.alias} />}>Alias <Muted>· optional</Muted></FieldLabel>
          <input
            value={form.identity.alias}
            onChange={e => setId('alias', e.target.value)}
            placeholder="Alternative name or former designation"
            style={inputStyle({})}
          />
          <FieldMsg issue={errFor('alias')} />
        </div>

        <GroupHeading hint="What the mission is and why it matters. Summary powers cards and the mission hero.">
          Summary &amp; Objective
        </GroupHeading>

        {/* Summary */}
        <div>
          <FieldLabel hint={<CharCount value={form.identity.summary} max={MISSION_LIMITS.summary} />}>
            Mission Summary <Muted>· recommended</Muted>
          </FieldLabel>
          <textarea
            value={form.identity.summary}
            onChange={e => setId('summary', e.target.value)}
            placeholder="A concise summary of the mission (1–3 sentences)…"
            rows={3}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7 }}
          />
          <FieldMsg issue={errFor('summary')} />
        </div>

        {/* Objective */}
        <div>
          <FieldLabel hint={<CharCount value={form.identity.objective} max={MISSION_LIMITS.objective} />}>
            Mission Objective <Muted>· recommended</Muted>
          </FieldLabel>
          <textarea
            value={form.identity.objective}
            onChange={e => setId('objective', e.target.value)}
            placeholder="The primary objective of the mission…"
            rows={3}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7 }}
          />
          <FieldMsg issue={errFor('objective')} />
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Full mission overview shown on the individual mission page…"
            rows={5}
            style={{ ...inputStyle({}), resize: 'vertical', lineHeight: 1.7 }}
          />
          <FieldMsg issue={errFor('description')} />
        </div>

        {/* Motto */}
        <div>
          <FieldLabel hint={<CharCount value={form.identity.motto} max={MISSION_LIMITS.motto} />}>Mission Motto <Muted>· optional</Muted></FieldLabel>
          <input
            value={form.identity.motto}
            onChange={e => setId('motto', e.target.value)}
            placeholder={'e.g. "Dare Mighty Things"'}
            style={inputStyle({})}
          />
          <FieldMsg issue={errFor('motto')} />
        </div>

        <GroupHeading hint="How the mission is categorised — type, destinations and the agencies behind it. (Status is set in the sidebar.)">
          Mission Classification
        </GroupHeading>

        <MissionClassificationFields
          value={form.classification}
          onChange={c => set('classification', c)}
          primaryAgencyId={form.agencyId}
          onPrimaryAgencyChange={id => set('agencyId', id)}
          agencies={agencies}
        />

        <GroupHeading hint="Engineering & programme facts about the spacecraft and mission. All optional.">
          Mission Specifications
        </GroupHeading>

        <MissionSpecificationsFields
          value={form.specifications}
          onChange={s => set('specifications', s)}
          destinations={form.classification.destinations}
        />

        <GroupHeading hint="The mission's science goals, beyond the primary objective. Drag list items to reorder.">
          Scientific Objectives
        </GroupHeading>

        <MissionObjectivesFields
          value={form.objectives}
          onChange={o => set('objectives', o)}
          primaryObjective={form.identity.objective}
        />

        <GroupHeading hint="Imagery for cards and the mission hero.">
          Media
        </GroupHeading>

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
                background:    form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.05)',
                border:        '1px solid',
                borderColor:   form._showMediaPicker ? 'var(--accent)' : 'rgba(var(--ink),0.12)',
                borderRadius:  '6px',
                color:         form._showMediaPicker ? 'var(--black)' : 'rgba(var(--ink),0.9)',
                fontFamily:    'var(--font-mono)',
                fontSize: '13px',
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
            <div style={{ marginTop: '12px', padding: '20px', background: 'rgba(var(--ink),0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
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

        <GroupHeading hint="Official references. Bare domains are fine — we'll add https:// for you.">
          Links &amp; References
        </GroupHeading>

        {/* Official website */}
        <div>
          <FieldLabel>Official Website <Muted>· optional</Muted></FieldLabel>
          <input
            value={form.identity.website}
            onChange={e => setId('website', e.target.value)}
            onBlur={() => blurUrl('website')}
            placeholder="https://…"
            style={inputStyle({})}
          />
          <FieldMsg issue={urlIssue('website')} />
        </div>

        {/* Wikipedia */}
        <div>
          <FieldLabel>Wikipedia URL <Muted>· optional</Muted></FieldLabel>
          <input
            value={form.identity.wikipedia}
            onChange={e => setId('wikipedia', e.target.value)}
            onBlur={() => blurUrl('wikipedia')}
            placeholder="https://en.wikipedia.org/wiki/…"
            style={inputStyle({})}
          />
          <FieldMsg issue={urlIssue('wikipedia')} />
        </div>

        {/* Press kit */}
        <div>
          <FieldLabel>Official Press Kit <Muted>· optional</Muted></FieldLabel>
          <input
            value={form.identity.pressKit}
            onChange={e => setId('pressKit', e.target.value)}
            onBlur={() => blurUrl('pressKit')}
            placeholder="https://…"
            style={inputStyle({})}
          />
          <FieldMsg issue={urlIssue('pressKit')} />
        </div>

        {/* ── Timeline builder ────────────────────── */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <FieldLabel>Mission Timeline</FieldLabel>
          </div>
          <MissionTimelineBuilder value={form.timeline} onChange={t => set('timeline', t)} />
        </div>

      </div>

      {/* ── Right sidebar ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

        {/* Error / success */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: '7px' }}>
            <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)' }}>
            ✓ {success}
          </div>
        )}
        {warnings.length > 0 && (
          <div style={{ padding: '12px 14px', background: 'rgba(243,156,18,0.06)', border: '1px solid rgba(243,156,18,0.25)', borderRadius: '7px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: '8px' }}>
              Saved · {warnings.length} suggestion{warnings.length > 1 ? 's' : ''}
            </span>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {warnings.map((w, i) => (
                <li key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.85)', lineHeight: 1.5 }}>{w}</li>
              ))}
            </ul>
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

        {/* Status — 15-stage lifecycle (base column stores the legacy projection) */}
        <SidePanel label="Status">
          <StatusSelect
            value={form.classification.status}
            onChange={v => set('classification', { ...form.classification, status: v })}
          />
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
                background: form.featured ? 'var(--black)' : 'rgba(var(--ink),0.62)',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
              Featured mission
            </span>
          </label>
        </SidePanel>

      </div>
      </div>
      {/* /English pane */}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function LangTab({ active, disabled, title, onClick, children }: { active: boolean; disabled?: boolean; title?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
        padding: '9px 16px', background: 'transparent', border: 'none',
        borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        color: active ? 'var(--accent)' : disabled ? 'rgba(var(--ink),0.35)' : 'rgba(var(--ink),0.7)',
        cursor: disabled ? 'not-allowed' : 'pointer', marginBottom: '-1px',
      }}
    >
      {children}
    </button>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
        {children}
      </label>
      {hint != null && hint !== '' && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.78)', letterSpacing: '0.04em', flexShrink: 0, whiteSpace: 'nowrap' }}>{hint}</span>
      )}
    </div>
  )
}

// Section heading inside the editor's left column — an accent eyebrow with an
// optional one-line description, matching the CMS's label typography.
function GroupHeading({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginTop: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>
        {children}
      </span>
      {hint && (
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(var(--ink),0.6)', lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  )
}

// Small "· optional" / "· recommended" annotation next to a field label.
function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'rgba(var(--ink),0.45)', letterSpacing: '0.08em' }}>{children}</span>
}

// Live character counter; ambers near the limit, reds when over.
function CharCount({ value, max }: { value: string; max: number }) {
  const len  = (value || '').trim().length
  const over = len > max
  const near = len > max * 0.9
  return (
    <span style={{ color: over ? 'var(--red)' : near ? 'var(--gold)' : 'rgba(var(--ink),0.5)' }}>
      {len}/{max}
    </span>
  )
}

// Inline field-level validation message (error = red, warning = gold).
function FieldMsg({ issue }: { issue?: FieldIssue }) {
  if (!issue) return null
  const color = issue.level === 'error' ? 'var(--red)' : 'var(--gold)'
  const Icon  = issue.level === 'error' ? AlertCircle : Info
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px' }}>
      <Icon size={12} style={{ color, flexShrink: 0, marginTop: '2px' }} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color, lineHeight: 1.5 }}>{issue.message}</span>
    </div>
  )
}

function SidePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>{label}</span>
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  )
}

function inputStyle({ large }: { large?: boolean }): React.CSSProperties {
  return {
    width: '100%', padding: large ? '12px 14px' : '9px 12px',
    background: 'var(--black)', border: '1px solid var(--border)',
    borderRadius: '7px', color: 'var(--white)',
    fontFamily: large ? 'var(--font-serif)' : 'var(--font-sans)',
    fontSize: large ? '20px' : '13px', outline: 'none',
    boxSizing: 'border-box', display: 'block', transition: 'border-color 0.2s',
  }
}

function btnStyle({ primary, disabled }: { primary?: boolean; disabled?: boolean }): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    width: '100%', padding: '9px 14px', borderRadius: '6px',
    fontFamily: 'var(--font-mono)', fontSize: '14px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    background: primary ? 'var(--accent)' : 'var(--surface)',
    color: primary ? 'var(--black)' : 'rgba(var(--ink),0.9)',
    border: primary ? 'none' : '1px solid var(--border-hi)',
    transition: 'all 0.15s',
  }
}
