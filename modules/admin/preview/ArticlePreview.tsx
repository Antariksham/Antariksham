'use client'

import { useEffect, useRef, useState } from 'react'
import { Monitor, Tablet, Smartphone, Sun, Moon } from 'lucide-react'
import { ArticleBody, countWords, type ArticleRenderModel } from '@/modules/articles/components/ArticleBody'
import { PreviewFrame } from './PreviewFrame'

type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICES: Record<Device, { w: number; h: number; label: string; icon: typeof Monitor }> = {
  desktop: { w: 1280, h: 800,  label: 'Desktop', icon: Monitor },
  tablet:  { w: 834,  h: 1112, label: 'Tablet',  icon: Tablet },
  mobile:  { w: 390,  h: 844,  label: 'Mobile',  icon: Smartphone },
}

/**
 * Live article preview. Renders the SAME <ArticleBody> the public site uses,
 * inside a real device viewport (PreviewFrame). Updates instantly as the model
 * changes — no refresh, no publish. Device + theme are simulated locally so an
 * editor can check both light/dark and all three breakpoints without leaving
 * the form.
 */
export function ArticlePreview({ model }: { model: ArticleRenderModel }) {
  const [device, setDevice] = useState<Device>('desktop')
  const [theme, setTheme]   = useState<'light' | 'dark'>('dark')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fitWidth, setFitWidth] = useState(880)

  // Adopt the site's current theme on mount (avoids an SSR mismatch by
  // starting from 'dark' and syncing after paint).
  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme')
    setTheme(t === 'light' ? 'light' : 'dark')
  }, [])

  // Track available width so the device frame scales to fit the panel.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setFitWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const d = DEVICES[device]
  const words = countWords(model.content)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

      {/* Toolbar — device switcher, theme, live stats */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        padding: '8px 12px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: '8px',
      }}>
        {/* Device segmented control */}
        <div role="group" aria-label="Preview device" style={{ display: 'inline-flex', gap: '2px', background: 'rgba(var(--ink),0.04)', padding: '3px', borderRadius: '7px' }}>
          {(Object.keys(DEVICES) as Device[]).map(key => {
            const Dv = DEVICES[key]
            const active = device === key
            const Icon = Dv.icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={active}
                title={`${Dv.label} — ${Dv.w}×${Dv.h}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 10px', borderRadius: '5px', cursor: 'pointer',
                  border: 'none',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--black)' : 'rgba(var(--ink),0.72)',
                  fontFamily: 'var(--font-mono)', fontSize: '12px',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} /> <span style={{ }}>{Dv.label}</span>
              </button>
            )
          })}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          title={`Preview in ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch preview to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 11px', borderRadius: '6px', cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'rgba(var(--ink),0.82)', fontFamily: 'var(--font-mono)',
            fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>

        {/* Live reading stats */}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.06em', color: 'rgba(var(--ink),0.6)' }}>
          {words.toLocaleString()} words · {model.readingTime} min read
        </span>
      </div>

      {/* Device stage */}
      <div
        ref={wrapRef}
        style={{
          minWidth: 0,
          padding: '16px',
          background: 'rgba(var(--ink),0.02)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <PreviewFrame deviceWidth={d.w} deviceHeight={d.h} theme={theme} fitWidth={Math.max(280, fitWidth - 32)}>
          <div style={{ background: 'var(--black)', minHeight: '100%' }}>
            <article
              lang="en"
              style={{
                maxWidth: '740px',
                margin:   '0 auto',
                padding:  'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)',
              }}
            >
              <ArticleBody model={model} lang="en" preview />
            </article>
          </div>
        </PreviewFrame>
      </div>
    </div>
  )
}
