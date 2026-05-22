import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PREFIX  = '/admin'
const LOGIN_PATH    = '/admin/login'
const AUTH_COOKIE   = 'antariksham_admin'
const LOCK_COOKIE   = 'antariksham_lock'
const LOCK_DURATION = 15 * 60 * 1000

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass the pathname as a header so root layout can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Only enforce auth on /admin routes
  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Security headers on all admin routes
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Allow login page through
  if (pathname === LOGIN_PATH) {
    const authCookie = request.cookies.get(AUTH_COOKIE)
    if (authCookie?.value === process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  // Check brute force lock
  const lockCookie = request.cookies.get(LOCK_COOKIE)
  if (lockCookie) {
    try {
      const lockData = JSON.parse(lockCookie.value)
      if (lockData.lockedUntil && Date.now() < lockData.lockedUntil) {
        return NextResponse.redirect(new URL(`${LOGIN_PATH}?locked=1`, request.url))
      }
    } catch {}
  }

  // Check auth
  const authCookie = request.cookies.get(AUTH_COOKIE)
  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
