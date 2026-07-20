import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Thrown when a create/update would collide with an existing row's slug.
 * Routes catch this and return a 409 with a human-readable message instead of
 * the generic "Server error" 500.
 */
export class SlugConflictError extends Error {
  constructor(message = 'That slug is already in use. Choose a different one.') {
    super(message)
    this.name = 'SlugConflictError'
  }
}

/**
 * Detects a Postgres unique-constraint violation (SQLSTATE 23505) in a Supabase
 * error. Used as a safety net around inserts/updates in case a duplicate slips
 * past the pre-check (e.g. a race) but the DB has a unique index on `slug`.
 */
export function isUniqueViolation(error: any): boolean {
  if (!error) return false
  if (error.code === '23505') return true
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase()
  return msg.includes('duplicate key') || msg.includes('unique constraint')
}

/**
 * Throws SlugConflictError if another row in `table` already uses `slug`.
 * Pass `exceptId` on updates so a row doesn't conflict with itself. Works
 * whether or not the table has a unique index on `slug`, so the friendly
 * message shows either way. A failed lookup is treated as "unknown, don't
 * block" — the write and any DB constraint still guard the invariant.
 */
export async function assertSlugAvailable(
  db: SupabaseClient,
  table: string,
  slug: string,
  exceptId?: string,
): Promise<void> {
  if (!slug) return
  let query = db.from(table).select('id').eq('slug', slug).limit(1)
  if (exceptId) query = query.neq('id', exceptId)

  const { data, error } = await query
  if (error) return
  if (data && data.length > 0) throw new SlugConflictError()
}
