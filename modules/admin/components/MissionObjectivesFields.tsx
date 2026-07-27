'use client'

/**
 * Scientific Objectives editor (Phase 1, Feature 4).
 *
 * The structured expansion of a mission's science goals: reorderable lists of
 * secondary objectives, technology demonstrations, scientific questions and
 * expected discoveries, plus a free-text mission significance. The PRIMARY
 * objective lives in the Identity section (single source of truth) and is shown
 * here read-only for context. Reuses `SubLabel` + `ReorderableTextList`.
 */
import type { MissionObjectives } from '@/types/mission'
import { ReorderableTextList } from './ReorderableTextList'
import { SubLabel } from './MissionClassificationFields'

interface Props {
  value:            MissionObjectives
  onChange:         (next: MissionObjectives) => void
  /** Read-only reference to the primary objective (identity.objective). */
  primaryObjective: string
}

export function MissionObjectivesFields({ value, onChange, primaryObjective }: Props) {
  const setList = (key: 'secondary' | 'technologyDemos' | 'scientificQuestions' | 'expectedDiscoveries', items: string[]) =>
    onChange({ ...value, [key]: items })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Primary objective — read-only reference (edited in Identity) */}
      <div>
        <SubLabel hint="Set in the Summary & Objective section above.">Primary Objective</SubLabel>
        <div style={{
          padding: '10px 12px', borderRadius: '7px',
          background: 'rgba(var(--ink),0.03)', border: '1px dashed var(--border)',
          fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.6,
          color: primaryObjective ? 'rgba(var(--ink),0.85)' : 'rgba(var(--ink),0.35)',
        }}>
          {primaryObjective || 'No primary objective set yet.'}
        </div>
      </div>

      <div>
        <SubLabel hint="Additional goals beyond the primary objective. Drag to reorder.">Secondary Objectives</SubLabel>
        <ReorderableTextList
          items={value.secondary}
          onChange={i => setList('secondary', i)}
          placeholder="e.g. Characterise the surface composition"
          addLabel="Add objective"
        />
      </div>

      <div>
        <SubLabel hint="New technologies the mission proves out.">Technology Demonstrations</SubLabel>
        <ReorderableTextList
          items={value.technologyDemos}
          onChange={i => setList('technologyDemos', i)}
          placeholder="e.g. Autonomous hazard-avoidance landing"
          addLabel="Add demonstration"
        />
      </div>

      <div>
        <SubLabel hint="The open questions this mission sets out to answer.">Scientific Questions</SubLabel>
        <ReorderableTextList
          items={value.scientificQuestions}
          onChange={i => setList('scientificQuestions', i)}
          placeholder="e.g. Was the region ever habitable?"
          addLabel="Add question"
        />
      </div>

      <div>
        <SubLabel hint="What the mission hopes to find.">Expected Discoveries</SubLabel>
        <ReorderableTextList
          items={value.expectedDiscoveries}
          onChange={i => setList('expectedDiscoveries', i)}
          placeholder="e.g. Subsurface water-ice deposits"
          addLabel="Add discovery"
        />
      </div>

      <div>
        <SubLabel hint="Why this mission matters — its place in the wider programme.">Mission Significance</SubLabel>
        <textarea
          value={value.significance}
          onChange={e => onChange({ ...value, significance: e.target.value })}
          placeholder="A short statement of the mission's significance…"
          rows={3}
          style={{
            width: '100%', resize: 'vertical', padding: '9px 12px',
            background: 'var(--black)', border: '1px solid var(--border)',
            borderRadius: '7px', color: 'var(--white)', fontFamily: 'var(--font-sans)',
            fontSize: '13px', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
