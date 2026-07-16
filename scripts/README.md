# scripts

One-off maintenance / migration scripts. Not part of the Next build.

## `migrate-cosmosdaily-articles.mjs` — Phase 2 data migration

Moves articles from the **old CosmosDaily** Supabase project (the static
`space-website`) into **this** engine's Supabase project, reshaping the old flat
schema into the relational one. The two are separate projects, so it reads from
one and writes to the other.

### Run it

```bash
OLD_SUPABASE_URL=https://oufskgygyfnzlhfcteyi.supabase.co \
OLD_SUPABASE_SERVICE_KEY=<old service_role key> \
NEW_SUPABASE_URL=<new project url> \
NEW_SUPABASE_SERVICE_KEY=<new service_role key> \
node scripts/migrate-cosmosdaily-articles.mjs            # dry-run (default, read-only)
```

Then, once the dry-run plan looks right:

```bash
# migrate a single article first as a smoke test
node scripts/migrate-cosmosdaily-articles.mjs --slug=some-existing-slug --apply
# then the whole set
node scripts/migrate-cosmosdaily-articles.mjs --apply
```

Flags: `--apply` (write), `--mode=skip|update` (existing target slugs; default
skip), `--slug=X` (one article), `--limit=N`.

### Field mapping (old → new)

| old `articles` | new | notes |
|---|---|---|
| `slug` | `articles.slug` | **preserved exactly** (SEO) |
| `title` / `excerpt` | same | |
| `body` | `articles.content` | + folded-in references / image credit |
| `author` (string) | `authors` row → `articles.author_id` | upsert by name |
| `category` (lowercase) | `categories` + `article_categories` | via `CONFIG.categoryMap` |
| `tags` (array) | `tags` + `article_tags` | upsert by slug |
| `image` | `articles.featured_image` | |
| `date` + `published` | `published_at` + `status` | |
| `read_time` / `views` | `reading_time` / `views` | |
| — | `seo_metadata` | back-filled from title/excerpt/image |

### Gap decisions (defaults in `CONFIG`, one-line to change)

- **`article_type`** — old rows have none; all import as `analysis`. Change
  `defaultArticleType` if you'd rather set another, or curate per-article after.
- **`references` + `image_credit`** — no target columns, so they're appended into
  the article `content` (a *References* list + a credit caption). Set
  `appendReferences` / `appendImageCredit` to `false` to drop them.
- **`likes`** — the new article schema has no per-article like counter; not
  migrated. (The old `likes` table can be migrated separately if wanted.)
- **`featured`** — all import as `featured=false`; pick the homepage featured
  story in the CMS afterwards.

### URL / SEO cutover (do NOT skip — MIGRATION.md §6/§9)

Slugs are preserved, but the **path shape changes**: old `/article/:slug` → new
`/news/:slug`. Before pointing `cosmosdaily.space` traffic at the new engine:

1. Add **301 redirects** `/article/:slug → /news/:slug` (Next `redirects()` or
   `space-website/vercel.json`).
2. Confirm JSON-LD / OG / canonical parity (the script writes `canonical_url`).
3. Keep the sitemap in sync, then cut over **page-by-page** behind the
   `vercel.json` rewrite and verify each batch in Search Console. A bad batch is
   a one-line revert.
