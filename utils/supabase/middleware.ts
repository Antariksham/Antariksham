import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

// Refreshes the Supabase auth cookie for a request and reports the current
// user. Follows the canonical Supabase SSR pattern: cookies written by the
// auth library are mirrored onto both the outgoing request (so downstream
// server code sees them) and the response (so the browser is updated). The
// caller passes pre-built request headers (e.g. carrying x-pathname) which are
// preserved across the response so layouts can still read them.
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() validates the token with Supabase; do not remove it.
  const { data: { user } } = await supabase.auth.getUser()

  return { response, user }
}
