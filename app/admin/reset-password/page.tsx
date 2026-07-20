'use client'

// Landing page for the password-recovery email LINK. The user arrives here
// already holding a recovery session (created by /auth/callback), so we just
// let them set a new password via updateUser. Users who use the 6-digit code
// instead never need this page — they finish on /admin/forgot-password.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  AuthShell, Banner, authLabelStyle, authInputStyle,
  primaryBtnStyle, authLinkStyle,
} from '@/modules/admin/components/AuthShell'

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [hasSession,      setHasSession]      = useState<boolean | null>(null)

  // The recovery link is single-use and expires — without a session updateUser
  // would fail, so show the "request a new link" state instead.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6)          { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    router.push('/admin/login')
    router.refresh()
  }

  const footer = (
    <>Remember your password?{' '}
      <Link href="/admin/login" style={authLinkStyle}>Sign in</Link>
    </>
  )

  return (
    <AuthShell title="Set new password" subtitle="Choose a new password for your account" footer={footer}>
      {hasSession === false ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Banner kind="error">This reset link is invalid or has expired.</Banner>
          <Link href="/admin/forgot-password" style={{ ...primaryBtnStyle(), textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <button type="submit" disabled={loading || hasSession === null} style={primaryBtnStyle(loading || hasSession === null)}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
