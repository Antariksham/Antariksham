import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const ADMIN_PREFIX = '/admin'
const LOGIN_PATH    = '/admin/login'

// Auth pages must stay reachable without a session.
const AUTH_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass the pathname to the layouts (root + admin read x-pathname).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const isAdmin    = pathname.startsWith(ADMIN_PREFIX)
  const isAuthFlow = pathname.startsWith('/auth')

  // Public routes: forward x-pathname only. Don't tax them with an auth call.
  if (!isAdmin && !isAuthFlow) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Admin + auth-callback routes: refresh the Supabase session and read the user.
  const { response, user } = await updateSession(request, requestHeaders)

  // Security headers for the whole admin surface.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Protect real admin pages: require a session. Membership/role is enforced in
  // the admin layout and each API route (via getAdminUser).
  if (isAdmin && !isAuthPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    const redirectRes = NextResponse.redirect(url)
    // Carry the refreshed auth cookies onto the redirect so the session sticks.
    response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value, c))
    redirectRes.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return redirectRes
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
