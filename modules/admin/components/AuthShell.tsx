'use client'

import React from 'react'

// Shared chrome + field styles for the admin auth pages (login, forgot, reset).
// Uses the CosmosDaily tokens so it themes in light/dark like the rest of the site.

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title:     string
  subtitle?: string
  children:  React.ReactNode
  footer?:   React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #232338, #0a0a0f)', border: '1px solid rgba(79,142,247,0.3)', margin: '0 auto 14px' }} />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--white)', lineHeight: 1.1 }}>Antariksham</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.7)' }}>
            Mission Control
          </span>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px 26px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 400, color: 'var(--white)', margin: '0 0 4px' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.7)', margin: '0 0 20px' }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {footer && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.6)', marginTop: '18px', letterSpacing: '0.04em' }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  )
}

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const c = kind === 'error'
    ? { bg: 'rgba(231,76,60,0.08)',  bd: 'rgba(231,76,60,0.25)',  fg: 'var(--red)'   }
    : kind === 'success'
    ? { bg: 'rgba(46,204,113,0.08)', bd: 'rgba(46,204,113,0.25)', fg: 'var(--green)' }
    : { bg: 'rgba(79,142,247,0.08)', bd: 'rgba(79,142,247,0.25)', fg: 'var(--accent)' }
  return (
    <div style={{ padding: '10px 14px', background: c.bg, border: `1px solid ${c.bd}`, borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: c.fg }}>
      {children}
    </div>
  )
}

export const authLabelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: '13px',
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'rgba(var(--ink),0.72)', marginBottom: '6px',
}

export const authInputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'var(--black)',
  border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--white)',
  fontFamily: 'var(--font-sans)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export function primaryBtnStyle(disabled?: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: disabled ? 'rgba(79,142,247,0.45)' : 'var(--accent)',
    color: 'var(--black)', fontFamily: 'var(--font-mono)', fontSize: '14px',
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
  }
}

export function secondaryBtnStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '11px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border-hi)',
    color: 'rgba(var(--ink),0.85)', fontFamily: 'var(--font-mono)', fontSize: '14px',
    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
  }
}

// A link styled like an inline text button (accent).
export const authLinkStyle: React.CSSProperties = {
  color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '13px',
  fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em', cursor: 'pointer',
}
