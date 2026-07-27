'use client'

/**
 * Mission Completeness panel (Phase 1, Feature 8).
 *
 * A live 0–100 score + progress bar + a professional ✓/⚠/✕ checklist, driven by
 * the pure `evaluateCompleteness`. Purely presentational. By default it lists
 * the outstanding items (the to-do list); "Show all" reveals the completed ones
 * too. Matches the CMS sidebar styling (both themes).
 */
import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { CompletenessResult, CheckStatus } from '@/modules/missions/services/missionCompleteness'
import { scoreColor } from '@/modules/missions/services/missionCompleteness'

export function MissionCompletenessPanel({ result }: { result: CompletenessResult }) {
  const [showAll, setShowAll] = useState(false)
  const color = scoreColor(result.score)
  const incomplete = result.items.filter(i => !i.done)
  const shown = showAll ? result.items : incomplete

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(var(--ink),0.02)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.82)' }}>
          Completeness
        </span>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '30px', fontWeight: 700, color, lineHeight: 1 }}>{result.score}%</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(var(--ink),0.55)' }}>
            {result.requiredDone}/{result.requiredTotal} required
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(var(--ink),0.08)', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${result.score}%`, background: color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>

        <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(var(--ink),0.55)' }}>
          {result.recommendedDone}/{result.recommendedTotal} recommended complete
        </p>

        {/* Checklist */}
        {incomplete.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--green)', fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
            <CheckCircle2 size={14} /> Everything complete
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {shown.map(item => (
              <li key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusIcon status={item.status} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: item.done ? 'rgba(var(--ink),0.5)' : 'rgba(var(--ink),0.9)', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
                {item.level === 'required' && !item.done && (
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)' }}>Required</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {result.items.length > incomplete.length && incomplete.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            style={{ marginTop: '12px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}
          >
            {showAll ? 'Show remaining only' : `Show all ${result.items.length} items`}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'done')    return <CheckCircle2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
  if (status === 'missing') return <XCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
  return <AlertTriangle size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
}
