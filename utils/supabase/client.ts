import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client for the auth pages and the sidebar logout.
// Reads the same public env the rest of the app uses.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
