import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Exchanges the ?code from a Supabase email link (password recovery, magic
// link) for a session cookie, then forwards to `next`. Recovery links point
// here with next=/admin/reset-password; anything else defaults to /admin.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback`)
}
