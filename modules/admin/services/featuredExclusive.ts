import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Enforce "only one featured row per table".
 *
 * Content types with a single homepage/section "featured story" (articles,
 * missions) must have at most one row flagged `featured`. Marking a new item
 * featured has to automatically clear the flag on the previously featured one,
 * otherwise the homepage hero (which reads the most-recent featured row) can
 * keep showing a stale pick.
 *
 * Call this AFTER a create/update succeeds, passing whether the saved row was
 * set featured. It's a no-op when the row isn't featured. Best-effort: it logs
 * and swallows errors so a failed cleanup never blocks the save that succeeded.
 */
export async function enforceSingleFeatured(
  db: SupabaseClient,
  table: 'articles' | 'missions',
  keepId: string,
  isFeatured: boolean,
): Promise<void> {
  if (!isFeatured) return
  const { error } = await db
    .from(table)
    .update({ featured: false })
    .eq('featured', true)
    .neq('id', keepId)
  if (error) console.error(`enforceSingleFeatured(${table}) failed:`, error)
}
