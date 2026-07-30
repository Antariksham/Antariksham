'use client'

import { TagInput } from './TagInput'
import { hasAlt, type MediaMeta } from './mediaMeta'

/**
 * The title / alt / credit / tags form, shared by every place that asks for
 * media metadata — the Supabase upload dialog and the Cloudinary post-upload
 * dialog. One definition, so the two providers cannot drift into asking for
 * different things in different ways.
 *
 * The shape and its rules live in `mediaMeta.ts` so they can be tested without
 * a DOM; re-exported here so callers need only one import.
 */

export { emptyMeta, resolveTags, hasAlt, type MediaMeta } from './mediaMeta'

interface Props {
  value:     MediaMeta
  onChange:  (meta: MediaMeta) => void
  disabled?: boolean
  /** Hide the per-item tag field when tags are being set for a whole batch. */
  tagLabel?: string
}

export function MediaMetaFields({ value, onChange, disabled, tagLabel }: Props) {
  const set = <K extends keyof MediaMeta>(key: K, val: MediaMeta[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <>
      <div>
        <label style={labelStyle}>Title</label>
        <input
          value={value.title}
          onChange={e => set('title', e.target.value)}
          disabled={disabled}
          placeholder="What is in this image?"
          style={inputStyle(!value.title.trim())}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Alt text
          <span style={{ marginLeft: '8px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(var(--ink),0.5)' }}>
            described for screen readers and search
          </span>
        </label>
        <input
          value={value.altText}
          onChange={e => set('altText', e.target.value)}
          disabled={disabled || value.decorative}
          placeholder={value.decorative ? 'Decorative — no alt text needed' : 'e.g. The Vikram lander on the lunar south pole'}
          style={inputStyle(!hasAlt(value))}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '5px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.6)' }}>
          <input
            type="checkbox"
            checked={value.decorative}
            onChange={e => set('decorative', e.target.checked)}
            disabled={disabled}
          />
          Decorative — no alt text needed
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 190px' }}>
          <label style={labelStyle}>Credit</label>
          <input
            value={value.credit}
            onChange={e => set('credit', e.target.value)}
            disabled={disabled}
            placeholder="e.g. ISRO"
            style={inputStyle(false)}
          />
        </div>
        <div style={{ flex: '2 1 230px' }}>
          <label style={labelStyle}>{tagLabel || 'Tags'}</label>
          <TagInput
            value={value.tags}
            draft={value.tagDraft}
            onChange={tags => set('tags', tags)}
            onDraftChange={draft => set('tagDraft', draft)}
            placeholder="e.g. mars, rover — Enter to add"
          />
        </div>
      </div>
    </>
  )
}

// ── Styles, shared with the dialogs ──────────────────────────────────────────

export const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '4px',
  fontFamily: 'var(--font-mono)', fontSize: '11px',
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'rgba(var(--ink),0.6)',
}

export function inputStyle(invalid: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
    background: 'rgba(var(--ink),0.04)',
    border: `1px solid ${invalid ? 'rgba(var(--red-rgb),0.45)' : 'rgba(var(--ink),0.12)'}`,
    borderRadius: '7px', outline: 'none',
    color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '14px',
  }
}

export function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 20px', borderRadius: '7px',
    background: disabled ? 'rgba(var(--accent-rgb),0.25)' : 'var(--accent)',
    border: '1px solid transparent',
    color: disabled ? 'rgba(var(--ink),0.55)' : 'var(--black)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export function secondaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 18px', borderRadius: '7px',
    background: 'transparent', border: '1px solid rgba(var(--ink),0.14)',
    color: 'rgba(var(--ink),0.8)',
    fontFamily: 'var(--font-mono)', fontSize: '13px',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
