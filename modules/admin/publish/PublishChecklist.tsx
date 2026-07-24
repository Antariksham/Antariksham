'use client'

import { useState } from 'react'
import { Check, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import type { Check as CheckType, ValidationReport } from './validation'

function Row({ c }: { c: CheckType }) {
  const icon = c.status === 'pass' ? <Check size={12} style={{ color: 'var(--green)' }} />
    : c.status === 'warn' ? <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />
    : <XCircle size={12} style={{ color: 'var(--red)' }} />
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '3px 0' }}>
      <span style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: c.status === 'pass' ? 'rgba(var(--ink),0.7)' : 'var(--white)' }}>
          {c.label}
        </span>
        {c.detail && (
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(var(--ink),0.5)', marginTop: '1px' }}>
            {c.detail}
          </span>
        )}
      </span>
    </li>
  )
}

/**
 * The pre-flight publish checklist. Shows required checks (a failing one blocks
 * Publish), plus a collapsible list of suggestions (warnings + SEO). This is the
 * professional "checklist, not an error popup" surface the spec asks for.
 */
export function PublishChecklist({ report }: { report: ValidationReport }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestions = [...report.warnings, ...report.seo].filter(c => c.status !== 'pass')

  return (
    <div>
      {/* Gate summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {report.canPublish
          ? <><Check size={13} style={{ color: 'var(--green)' }} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)', letterSpacing: '0.05em' }}>Ready to publish</span></>
          : <><XCircle size={13} style={{ color: 'var(--red)' }} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)', letterSpacing: '0.05em' }}>{report.failCount} to fix before publishing</span></>}
      </div>

      {/* Required checks */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {report.required.map(c => <Row key={c.id} c={c} />)}
      </ul>

      {/* Suggestions (warnings + SEO) */}
      {suggestions.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setShowSuggestions(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--gold)' }}
          >
            {showSuggestions ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em' }}>
              {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
            </span>
          </button>
          {showSuggestions && (
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
              {suggestions.map(c => <Row key={c.id} c={c} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
