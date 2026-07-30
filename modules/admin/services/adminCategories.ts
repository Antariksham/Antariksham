import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'
import { assertSlugAvailable, isUniqueViolation, SlugConflictError } from './adminErrors'
import { categorySlug, normalizeCategoryName } from '@/modules/admin/categories/categoryFields'

/**
 * Category CRUD for the admin.
 *
 * `categories` was read-only in the whole app — `getFormOptions()` was its only
 * reader — while the ten seeded names were *also* hardcoded in a TypeScript union
 * and again in the public listing's filter rail. Adding one meant editing three
 * files and the database by hand. This is the write side; the union is now
 * `string` and the rail reads the table.
 */

export interface AdminCategoryRow {
  id:           string
  name:         string
  slug:         string
  color:        string | null
  articleCount: number
}

export interface CategoryPayload {
  name:  string
  slug:  string
  color: string | null
}

export class CategoryInUseError extends Error {
  count: number
  constructor(count: number) {
    super(`${count} article${count === 1 ? '' : 's'} still use${count === 1 ? 's' : ''} this category. Recategorise them first.`)
    this.name  = 'CategoryInUseError'
    this.count = count
  }
}

// ── List ──────────────────────────────────────────────────────

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const db = supabaseAdmin()

  const { data, error } = await db.from('categories').select('id, name, slug, color').order('name')
  if (error) { console.error('getAdminCategories error:', error); return [] }

  const counts = await countArticlesPerCategory(db)

  return (data || []).map((c: any) => ({
    id:           c.id,
    name:         c.name || '',
    slug:         c.slug || '',
    color:        c.color || null,
    articleCount: counts[c.id] || 0,
  }))
}

// ── Create / update ───────────────────────────────────────────

export async function createAdminCategory(payload: CategoryPayload): Promise<{ id: string } | null> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'categories', payload.slug)

  const { data, error } = await db.from('categories').insert(toRow(payload)).select('id').single()
  if (error || !data) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('createAdminCategory error:', error)
    return null
  }
  return { id: data.id }
}

/**
 * Update a category.
 *
 * The name is what the public listing filters on (`?category=NASA` →
 * `article_categories.categories.name`), so renaming changes that URL. The admin
 * dialog warns about it; there is nothing to migrate, because the filter is a
 * query param on a client-rendered list rather than an indexed page.
 */
export async function updateAdminCategory(id: string, payload: CategoryPayload): Promise<boolean> {
  const db = supabaseAdmin()
  await assertSlugAvailable(db, 'categories', payload.slug, id)

  const { error } = await db.from('categories').update(toRow(payload)).eq('id', id)
  if (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError()
    console.error('updateAdminCategory error:', error)
    return false
  }
  return true
}

// ── Delete ────────────────────────────────────────────────────

/**
 * Delete a category, but only once no article uses it.
 *
 * Unlike a tag, a category is how the site groups an article — dropping the join
 * rows would silently unfile published work from the listing it appears in, so
 * this refuses and reports the count instead.
 */
export async function deleteAdminCategory(id: string): Promise<boolean> {
  const db = supabaseAdmin()

  const { count, error: countErr } = await db
    .from('article_categories')
    .select('article_id', { count: 'exact', head: true })
    .eq('category_id', id)

  // Don't fail open: if the check itself failed we can't claim it's unused.
  if (countErr) {
    console.error('deleteAdminCategory count error:', countErr)
    throw new Error('Could not check whether this category is still in use')
  }
  if ((count || 0) > 0) throw new CategoryInUseError(count || 0)

  const { error } = await db.from('categories').delete().eq('id', id)
  if (error) { console.error('deleteAdminCategory error:', error); return false }
  return true
}

// ── Internals ─────────────────────────────────────────────────

/** PostgREST caps a response at 1000 rows, and join rows outnumber articles. */
const PAGE = 1000

async function countArticlesPerCategory(db: SupabaseClient): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('article_categories')
      .select('category_id')
      .order('category_id')
      .range(from, from + PAGE - 1)

    if (error) { console.error('countArticlesPerCategory error:', error); break }
    for (const r of (data || []) as any[]) counts[r.category_id] = (counts[r.category_id] || 0) + 1
    if (!data || data.length < PAGE) break
  }

  return counts
}

function toRow(p: CategoryPayload): Record<string, any> {
  const name = normalizeCategoryName(p.name)
  return {
    name,
    slug:  p.slug || categorySlug(name),
    color: p.color,
  }
}
