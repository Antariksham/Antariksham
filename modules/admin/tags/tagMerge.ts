/**
 * Pure planning for a tag merge.
 *
 * Merging tag A into tag B means repointing A's `article_tags` rows at B — but
 * only the rows B does not already have, because `(article_id, tag_id)` is one
 * pair per article and re-pointing a collision would try to insert a duplicate.
 * PostgREST cannot express `not in (subquery)`, so the diff is computed here and
 * the caller issues the narrowed update.
 *
 * DOM-free and dependency-free so the service and `node:test` can share it.
 */

export interface TagMergePlan {
  /** Article ids whose join row moves from the source tag to the target. */
  moveable: string[]
  /** Article ids already carrying the target — their source row is dropped. */
  dropped:  string[]
}

export function planTagMerge(sourceArticleIds: string[], targetArticleIds: string[]): TagMergePlan {
  const onTarget = new Set(targetArticleIds)
  const moveable: string[] = []
  const dropped:  string[] = []
  const seen = new Set<string>()

  for (const id of sourceArticleIds) {
    if (seen.has(id)) continue          // a duplicate pair can only exist if the
    seen.add(id)                        // unique constraint is missing; ignore it
    if (onTarget.has(id)) dropped.push(id)
    else moveable.push(id)
  }

  return { moveable, dropped }
}

/**
 * Split a list into fixed-size batches. `.in('article_id', […])` becomes a query
 * string, so a tag used on thousands of articles has to go over in pieces or the
 * URL blows past what PostgREST will accept.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error('chunk size must be at least 1')
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
