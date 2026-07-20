'use client'

// Admin sign-in via Supabase Auth. Two ways in:
//   - password: signInWithPassword
//   - email code: signInWithOtp({ shouldCreateUser:false }) sends a 6-digit
//     code, verifyOtp({ type:'email' }) signs in. shouldCreateUser:false so a
//     login code can never mint a brand-new account.
// After either path finishLogin() confirms the user is an active admin (via the
// admin_users self-select policy) before sending them to the dashboard; the
// server layout + API routes enforce the same membership independently.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useCooldown } from '@/utils/useCooldown'
import {
  AuthShell, Banner, authLabelStyle, authInputStyle,
  primaryBtnStyle, secondaryBtnStyle, authLinkStyle,
} from '@/modules/admin/components/AuthShell'

type Mode = 'password' | 'otp-email' | 'otp-code'

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode,     setMode]     = useState<Mode>('password')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [token,    setToken]    = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [notice,   setNotice]   = useState('')
  const cooldown = useCooldown(45)

  // Surface why the layout bounced someone back here.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('error')
    if (p === 'not_admin')        setNotice("This account doesn't have admin access.")
    else if (p === 'account_disabled') setNotice('Your admin access has been deactivated.')
    else if (p === 'auth_callback')    setNotice('That link is invalid or has expired.')
  }, [])

  // Shared post-auth routing: verify active admin membership, then go.
  async function finishLogin() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sign in failed. Try again.'); setLoading(false); return }

    const { data: membership } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (!membership || !membership.is_active) {
      await supabase.auth.signOut()
      setError("This account doesn't have admin access.")
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }
    await finishLogin()
  }

  async function sendLoginCode(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: false },
    })
    if (otpError) {
      const m = otpError.message.toLowerCase()
      setError(m.includes('signups not allowed') || m.includes('not found')
        ? 'No account is registered with this email.'
        : otpError.message)
      setLoading(false)
      return
    }
    cooldown.start()
    setMode('otp-code')
    setLoading(false)
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(token.trim())) { setError('Enter the 6-digit code from your email.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email, token: token.trim(), type: 'email',
    })
    if (verifyError) {
      setError('That code is invalid or has expired. Request a new one.')
      setLoading(false)
      return
    }
    await finishLogin()
  }

  const subtitle = mode === 'password' ? 'Sign in to your account' : 'Sign in with an email code'

  return (
    <AuthShell
      title="Welcome back"
      subtitle={subtitle}
      footer={<>Restricted access · Antariksham CMS</>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {notice && <Banner kind="info">{notice}</Banner>}

        {/* ── Password sign-in ─────────────────────────── */}
        {mode === 'password' && (
          <>
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={authLabelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email" style={authInputStyle} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...authLabelStyle, marginBottom: 0 }}>Password</label>
                  <Link href="/admin/forgot-password" style={{ ...authLinkStyle, fontSize: '12px' }}>Forgot?</Link>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password" style={authInputStyle} />
              </div>

              {error && <Banner kind="error">{error}</Banner>}

              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(var(--ink),0.5)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button type="button" onClick={() => { setMode('otp-email'); setError('') }} style={secondaryBtnStyle()}>
              Email me a login code
            </button>
          </>
        )}

        {/* ── Request an email code ────────────────────── */}
        {mode === 'otp-email' && (
          <>
            <form onSubmit={sendLoginCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={authLabelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email" style={authInputStyle} />
              </div>

              {error && <Banner kind="error">{error}</Banner>}

              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                {loading ? 'Sending…' : 'Send code'}
              </button>
            </form>

            <button type="button" onClick={() => { setMode('password'); setError('') }}
              style={{ ...authLinkStyle, color: 'rgba(var(--ink),0.6)', textAlign: 'center', background: 'none', border: 'none' }}>
              Use password instead
            </button>
          </>
        )}

        {/* ── Enter the email code ─────────────────────── */}
        {mode === 'otp-code' && (
          <>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'rgba(var(--ink),0.7)', margin: 0 }}>
              We sent a 6-digit code to <span style={{ color: 'var(--white)' }}>{email}</span>.
            </p>
            <form onSubmit={handleOtpLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={authLabelStyle}>6-digit code</label>
                <input inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6}
                  value={token} onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ ...authInputStyle, textAlign: 'center', letterSpacing: '0.4em', fontFamily: 'var(--font-mono)', fontSize: '18px' }} />
              </div>

              {error && <Banner kind="error">{error}</Banner>}

              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => sendLoginCode()} disabled={cooldown.active || loading}
                style={{ ...authLinkStyle, background: 'none', border: 'none', opacity: cooldown.active ? 0.5 : 1, cursor: cooldown.active ? 'default' : 'pointer' }}>
                {cooldown.active ? `Resend in ${cooldown.remaining}s` : 'Resend code'}
              </button>
              <button type="button" onClick={() => { setMode('otp-email'); setToken(''); setError('') }}
                style={{ ...authLinkStyle, color: 'rgba(var(--ink),0.6)', background: 'none', border: 'none' }}>
                Change email
              </button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  )
}
