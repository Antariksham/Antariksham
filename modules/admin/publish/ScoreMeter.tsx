'use client'

function scoreColor(v: number): string {
  if (v >= 75) return 'var(--green)'
  if (v >= 45) return 'var(--gold)'
  return 'var(--red)'
}

/** A compact 0–100 score meter — SEO / Readability / Content quality. */
export function ScoreMeter({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  const color = scoreColor(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: compact ? '10px' : '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: compact ? '12px' : '13px', fontWeight: 700, color }}>
          {value}
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(var(--ink),0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s ease, background 0.4s ease' }} />
      </div>
    </div>
  )
}
