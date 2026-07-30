import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'
import { isUniqueViolation } from './adminErrors'
import type { TagOption } from './adminArticles'
import { normalizeTagName, tagSlug } from '@/modules/admin/tags/tagNames'
import { planTagMerge, chunk } from '@/modules/admin/tags/tagMerge'

/**
 * Tag reads and writes for the admin — the whole lifecycle of the taxonomy.
 *
 * The article editor lets an author type a tag that does not exist yet, so
 * something has to turn a typed name into a row (`resolveOrCreateTag`). That
 * cuts both ways: a typo mints a row too, so the Tags screen needs to rename,
 * merge and delete as well.
 *
 * Everything keys off the slug, never the name: `Falcon 9` typed against an
 * existing "falcon-9" selects that tag instead of minting a near-duplicate.
 */

/** Thrown when a typed name has nothing left to key on once slugged. */
export class InvalidTagNameError extends Error {
  constructor(message = 'Enter a tag name with at least one letter or number.') {
    super(message)
    this.name = 'InvalidTagNameError'
  }
}

/**
 * Thrown when a rename would land on another tag's slug. Renaming is not the
 * operation the author wants there — merging is — so this says so by name.
 */
export class TagSlugConflictError extends Error {
  constructor(otherName?: string) {
    super(otherName
      ? `“${otherName}” already uses that name. Merge into it instead of renaming.`
      : 'Another tag already uses that name. Merge into it instead of renaming.')
    this.name = 'TagSlugConflictError'
  }
}

/**
 * Resolve a typed tag name to a tag row, creating it only if its slug is new.
 *
 * `created` tells the caller whether a row was minted, so the API can answer
 * 201 vs 200 — and so the UI can say "added" rather than "created" when the
 * author has simply retyped a tag that already existed.
 */
export async function resolveOrCreateTag(
  rawName: string
): Promise<{ tag: TagOption; created: boolean }> {
  const name = normalizeTagName(rawName)
  const slug = tagSlug(name)
  if (!slug) throw new InvalidTagNameError()

  const db = supabaseAdmin()

  const existing = await findTagBySlug(db, slug)
  if (existing) return { tag: existing, created: false }

  const { data, error } = await db
    .from('tags')
    .insert({ name, slug })
    .select('id, name, slug')
    .single()

  if (!error && data) return { tag: data as TagOption, created: true }

  // Two editors typing the same new tag in the same moment: the loser of the
  // race reads the winner's row rather than failing the save. Needs the unique
  // index from 20260730130000_tags_slug_unique.sql to be a real race — without
  // it the insert succeeds and this branch never runs.
  if (isUniqueViolation(error)) {
    const raced = await findTagBySlug(db, slug)
    if (raced) return { tag: raced, created: false }
  }

  console.error('resolveOrCreateTag error:', error)
  throw new Error('Failed to create tag')
}

// ── List ──────────────────────────────────────────────────────

export interface AdminTagRow {
  id:           string
  name:         string
  slug:         string
  articleCount: number
}

/** Every tag with the number of articles using it — the Tags screen's list. */
export async function getAdminTags(): Promise<AdminTagRow[]> {
  const db = supabaseAdmin()

  const { data, error } = await db.from('tags').select('id, name, slug').order('name')
  if (error) { console.error('getAdminTags error:', error); return [] }

  const counts = await countArticlesPerTag(db)

  return (data || []).map((r: any) => ({
    id:           r.id,
    name:         r.name,
    slug:         r.slug || '',
    articleCount: counts[r.id] || 0,
  }))
}

// ── Rename ────────────────────────────────────────────────────

/**
 * Rename a tag, keeping its slug in step with the new name.
 *
 * The slug has to follow, or the identity key drifts from what an author sees:
 * a tag displaying "Starship" while still keyed to "falcon-9" would let a fresh
 * "Starship" be created alongside it. Nothing links to `/tags/<slug>` yet, so
 * there is no URL to break — revisit if that archive page ever ships.
 */
export async function renameTag(id: string, rawName: string): Promise<TagOption> {
  const name = normalizeTagName(rawName)
  const slug = tagSlug(name)
  if (!slug) throw new InvalidTagNameError()

  const db = supabaseAdmin()

  // A different tag on this slug means the author is asking for a merge, not a
  // rename. Say that, rather than letting the unique index answer with a 23505.
  const clash = await findTagBySlug(db, slug)
  if (clash && clash.id !== id) throw new TagSlugConflictError(clash.name)

  const { data, error } = await db
    .from('tags')
    .update({ name, slug })
    .eq('id', id)
    .select('id, name, slug')
    .single()

  if (error || !data) {
    if (isUniqueViolation(error)) throw new TagSlugConflictError()
    console.error('renameTag error:', error)
    throw new Error('Failed to rename tag')
  }
  return data as TagOption
}

// ── Merge ─────────────────────────────────────────────────────

/**
 * Fold `sourceId` into `targetId`: every article tagged with the source ends up
 * tagged with the target, and the source row is deleted.
 *
 * Not a transaction — PostgREST has no way to ask for one. The order is chosen
 * so a failure part-way through leaves the data usable rather than corrupt:
 * rows are repointed first, so an interrupted merge looks like a partly-merged
 * pair of tags that can simply be merged again.
 */
export async function mergeTags(sourceId: string, targetId: string): Promise<{ moved: number; dropped: number }> {
  if (sourceId === targetId) throw new InvalidMergeError()

  const db = supabaseAdmin()

  const [sourceArticles, targetArticles] = await Promise.all([
    articleIdsForTag(db, sourceId),
    articleIdsForTag(db, targetId),
  ])

  const { moveable, dropped } = planTagMerge(sourceArticles, targetArticles)

  for (const batch of chunk(moveable, 200)) {
    const { error } = await db
      .from('article_tags')
      .update({ tag_id: targetId })
      .eq('tag_id', sourceId)
      .in('article_id', batch)
    if (error) { console.error('mergeTags repoint error:', error); throw new Error('Failed to merge tags') }
  }

  // Anything still on the source is a pair the target already had.
  const { error: delRelErr } = await db.from('article_tags').delete().eq('tag_id', sourceId)
  if (delRelErr) { console.error('mergeTags cleanup error:', delRelErr); throw new Error('Failed to merge tags') }

  const { error: delTagErr } = await db.from('tags').delete().eq('id', sourceId)
  if (delTagErr) { console.error('mergeTags delete error:', delTagErr); throw new Error('Failed to merge tags') }

  return { moved: moveable.length, dropped: dropped.length }
}

/** Thrown when a merge names the same tag on both sides. */
export class InvalidMergeError extends Error {
  constructor(message = 'Pick a different tag to merge into.') {
    super(message)
    this.name = 'InvalidMergeError'
  }
}

// ── Delete ────────────────────────────────────────────────────

/**
 * Delete a tag and untag every article carrying it. The join rows go first: the
 * base schema predates this repo's migrations, so ON DELETE CASCADE cannot be
 * assumed, and orphaned `article_tags` rows would break the editor's lookups.
 */
export async function deleteTag(id: string): Promise<boolean> {
  const db = supabaseAdmin()

  const { error: relErr } = await db.from('article_tags').delete().eq('tag_id', id)
  if (relErr) { console.error('deleteTag relations error:', relErr); return false }

  const { error } = await db.from('tags').delete().eq('id', id)
  if (error) { console.error('deleteTag error:', error); return false }
  return true
}

// ── Internal helpers ──────────────────────────────────────────

/** PostgREST caps a response at 1000 rows, and join rows outnumber articles. */
const PAGE = 1000

async function countArticlesPerTag(db: SupabaseClient): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  for (let from = 0; ; from += PAGE) {
    // Ordered, because keyset-less pagination over an unordered result is free
    // to repeat or skip rows between requests.
    const { data, error } = await db
      .from('article_tags')
      .select('tag_id')
      .order('tag_id')
      .range(from, from + PAGE - 1)

    if (error) { console.error('countArticlesPerTag error:', error); break }
    for (const r of (data || []) as any[]) counts[r.tag_id] = (counts[r.tag_id] || 0) + 1
    if (!data || data.length < PAGE) break
  }

  return counts
}

async function articleIdsForTag(db: SupabaseClient, tagId: string): Promise<string[]> {
  const ids: string[] = []

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('article_tags')
      .select('article_id')
      .eq('tag_id', tagId)
      .order('article_id')
      .range(from, from + PAGE - 1)

    if (error) { console.error('articleIdsForTag error:', error); break }
    for (const r of (data || []) as any[]) ids.push(r.article_id)
    if (!data || data.length < PAGE) break
  }

  return ids
}

async function findTagBySlug(db: SupabaseClient, slug: string): Promise<TagOption | null> {
  const { data, error } = await db
    .from('tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .limit(1)

  if (error) {
    console.error('findTagBySlug error:', error)
    return null
  }
  return (data?.[0] as TagOption | undefined) ?? null
}
