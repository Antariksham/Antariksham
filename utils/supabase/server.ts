import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options: CookieOptions }

// Server-side Supabase client bound to the request cookies. Used by server
// components (the admin layout), route handlers, and the admin guard to read
// the signed-in user. The session is refreshed in middleware, so a Server
// Component that can't write cookies is fine — we swallow that specific error.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // Middleware handles the refresh, so this is safe to ignore.
          }
        },
      },
    },
  )
}
