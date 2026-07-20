import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

export interface AdminUser {
  id:    string
  email: string | null
  role:  string
}

/**
 * The single source of truth for "is the current request an active admin?"
 *
 * Reads the signed-in Supabase user from the request session, then confirms
 * they have an active row in `admin_users`. The membership lookup uses the
 * service-role client so it works regardless of RLS. Returns the admin (with
 * role, for future role-based checks) or null.
 *
 * Used by the admin layout (page gate) and every /api/admin/* route.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data, error } = await supabaseAdmin()
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (error || !data || !data.is_active) return null

  return { id: user.id, email: user.email ?? null, role: data.role }
}
