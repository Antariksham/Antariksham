'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'dark' | 'light'

export function ThemeToggle({ size = 38 }: { size?: number }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  // Read the theme the no-flash script already applied (avoids a hydration flash)
  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark'
    setTheme(current)
  }, [])

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch {}
    setTheme(next)
  }

  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, flexShrink: 0,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {/* Render nothing until mounted so SSR/CSR match; icon reflects current theme */}
      {theme === null ? null : isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
