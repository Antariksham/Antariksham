'use client'

// OTP-based password reset.
//   Step 1 (email): resetPasswordForEmail sends a 6-digit code (+ a fallback
//     link that lands on /reset-password via /auth/callback).
//   Step 2 (otp): verifyOtp({ type:'recovery' }) mints a recovery session, then
//     updateUser sets the new password.
// We don't pre-check whether the email exists — that avoids account enumeration
// and Supabase simply no-ops unknown addresses.

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useCooldown } from '@/utils/useCooldown'
import {
  AuthShell, Banner, authLabelStyle, authInputStyle,
  primaryBtnStyle, authLinkStyle,
} from '@/modules/admin/components/AuthShell'

type Step = 'email' | 'otp' | 'done'

export default function AdminForgotPasswordPage() {
  const router = useRouter()
  const [step,            setStep]            = useState<Step>('email')
  const [email,           setEmail]           = useState('')
  const [token,           setToken]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const cooldown = useCooldown(45)

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }
    cooldown.start()
    setStep('otp')
    setLoading(false)
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(token.trim())) { setError('Enter the 6-digit code from your email.'); return }
    if (password.length < 6)            { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword)   { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email, token: token.trim(), type: 'recovery',
    })
    if (verifyError) {
      setError('That code is invalid or has expired. Request a new one.')
      setLoading(false)
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setStep('done')
    setLoading(false)
    setTimeout(() => { router.push('/admin/login'); router.refresh() }, 1600)
  }

  const footer = (
    <>Remember your password?{' '}
      <Link href="/admin/login" style={authLinkStyle}>Sign in</Link>
    </>
  )

  if (step === 'done') {
    return (
      <AuthShell title="Password updated" footer={footer}>
        <Banner kind="success">Your password has been changed. Taking you to sign in…</Banner>
      </AuthShell>
    )
  }

  if (step === 'otp') {
    return (
      <AuthShell
        title="Enter reset code"
        subtitle={`We sent a 6-digit code to ${email}. Enter it with your new password.`}
        footer={footer}
      >
        <form onSubmit={verifyAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={authLabelStyle}>6-digit code</label>
            <input inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6}
              value={token} onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...authInputStyle, textAlign: 'center', letterSpacing: '0.4em', fontFamily: 'var(--font-mono)', fontSize: '18px' }} />
          </div>
          <div>
            <label style={authLabelStyle}>New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password" minLength={6} style={authInputStyle} />
          </div>
          <div>
            <label style={authLabelStyle}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password" minLength={6} style={authInputStyle} />
          </div>

          {error && <Banner kind="error">{error}</Banner>}

          <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <button type="button" onClick={() => sendCode()} disabled={cooldown.active || loading}
            style={{ ...authLinkStyle, background: 'none', border: 'none', opacity: cooldown.active ? 0.5 : 1, cursor: cooldown.active ? 'default' : 'pointer' }}>
            {cooldown.active ? `Resend in ${cooldown.remaining}s` : 'Resend code'}
          </button>
          <button type="button" onClick={() => { setStep('email'); setToken(''); setError('') }}
            style={{ ...authLinkStyle, color: 'rgba(var(--ink),0.6)', background: 'none', border: 'none' }}>
            Change email
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we'll send you a 6-digit code to reset your password."
      footer={footer}
    >
      <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
    </AuthShell>
  )
}
