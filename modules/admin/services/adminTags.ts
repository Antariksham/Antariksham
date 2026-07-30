import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'
import { isUniqueViolation } from './adminErrors'
import type { TagOption } from './adminArticles'
import { normalizeTagName, tagSlug } from '@/modules/admin/tags/tagNames'

/**
 * Tag writes for the admin. The article editor lets an author type a tag that
 * does not exist yet, so something has to turn a typed name into a row — that's
 * this file.
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
