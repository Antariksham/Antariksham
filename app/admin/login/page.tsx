'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router   = useRouter()
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || 'Authentication failed.')
        setPassword('')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #232338, #0a0a0f)', border: '1px solid rgba(79,142,247,0.3)', margin: '0 auto 16px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.3)' }}>
            Restricted Access
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter access key"
              required
              autoComplete="current-password"
              style={{
                width:        '100%',
                padding:      '14px 16px',
                background:   'var(--black)',
                border:       `1px solid ${error ? 'rgba(231,76,60,0.4)' : 'rgba(var(--ink),0.1)'}`,
                borderRadius: '8px',
                color:        '#ffffff',
                fontFamily:   'var(--font-mono)',
                fontSize:     '14px',
                letterSpacing:'0.05em',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.2s',
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
              onBlur={e   => (e.target.style.borderColor = error ? 'rgba(231,76,60,0.4)' : 'rgba(var(--ink),0.1)')}
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e74c3c', marginBottom: '16px', letterSpacing: '0.05em' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width:        '100%',
              padding:      '14px',
              background:   loading ? 'rgba(79,142,247,0.4)' : '#4f8ef7',
              color:        'var(--black)',
              border:       'none',
              borderRadius: '8px',
              fontFamily:   'var(--font-mono)',
              fontSize:     '12px',
              fontWeight:   700,
              letterSpacing:'0.15em',
              textTransform:'uppercase',
              cursor:       loading ? 'not-allowed' : 'pointer',
              transition:   'background 0.2s',
            }}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>

      </div>
    </div>
  )
}
