import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE   = 'antariksham_admin'
const LOCK_COOKIE   = 'antariksham_lock'
const MAX_ATTEMPTS  = 5
const LOCK_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  // Check if locked
  const lockCookie = request.cookies.get(LOCK_COOKIE)
  if (lockCookie) {
    try {
      const lockData = JSON.parse(lockCookie.value)
      if (lockData.lockedUntil && Date.now() < lockData.lockedUntil) {
        const minutesLeft = Math.ceil((lockData.lockedUntil - Date.now()) / 60000)
        return NextResponse.json(
          { error: `Too many attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` },
          { status: 429 }
        )
      }
    } catch {}
  }

  // Wrong password
  if (password !== process.env.ADMIN_PASSWORD) {
    // Track failed attempts
    let attempts = 1
    if (lockCookie) {
      try {
        const lockData = JSON.parse(lockCookie.value)
        if (!lockData.lockedUntil) attempts = (lockData.attempts || 0) + 1
      } catch {}
    }

    const response = NextResponse.json(
      { error: 'Incorrect password.' },
      { status: 401 }
    )

    if (attempts >= MAX_ATTEMPTS) {
      // Lock the session
      response.cookies.set(LOCK_COOKIE, JSON.stringify({
        lockedUntil: Date.now() + LOCK_DURATION,
      }), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   LOCK_DURATION / 1000,
        path:     '/',
      })
    } else {
      response.cookies.set(LOCK_COOKIE, JSON.stringify({ attempts }), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   60 * 60, // 1 hour attempt window
        path:     '/',
      })
    }

    return response
  }

  // Correct password — set auth cookie and clear lock
  const response = NextResponse.json({ success: true })

  response.cookies.set(AUTH_COOKIE, process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     '/',
  })

  // Clear lock cookie
  response.cookies.delete(LOCK_COOKIE)

  return response
}
