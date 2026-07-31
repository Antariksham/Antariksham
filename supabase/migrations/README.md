# Database migrations

SQL migrations for the Antariksham Supabase database. Each file changes the
schema; run them **in filename order** (they are timestamp-prefixed:
`YYYYMMDDHHMMSS_description.sql`).

The app connects to Supabase via the environment variables in
`lib/supabase.ts` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`). These migrations target that same project.

---

## How to run a migration

Pick whichever you prefer — both apply the same SQL.

### Option A — Supabase dashboard (no tooling, quickest)

1. Open your project at <https://supabase.com/dashboard>.
2. Left sidebar → **SQL Editor** → **New query**.
3. Paste the contents of the migration `.sql` file.
4. Click **Run**.

### Option B — Supabase CLI

```bash
# one-time: link the local repo to your project
supabase link --project-ref <your-project-ref>

# apply every migration in supabase/migrations in order
supabase db push
```

All migrations here are written to be **idempotent** (`add column if not
exists`, etc.), so re-running one is harmless.

---

## Migrations

### `20260731120000_content_search.sql`

Full-text search for public content. Adds a weighted generated `search_vector`
to `articles`, `knowledge_articles` and `missions`, GIN indexes over each, and
the `search_content()` / `search_content_fuzzy()` functions the search page uses.

Replaces an `ILIKE '%q%'` scan over title + excerpt only — so **article bodies
were never searchable**, results were ordered by date rather than relevance, and
the query was interpolated into a PostgREST filter string.

Additive and idempotent; safe to re-run. **The site works before and after**:
`modules/search/services/search.ts` falls back to the old query path when these
functions are absent, so code and migration can be deployed in either order.

Needs `pg_trgm` for the "did you mean" fallback. The migration creates it and
only raises a NOTICE if it lacks permission — turn it on in Supabase → Database
→ Extensions and re-run, and the fuzzy suggestions start working. Everything
else functions without it.

The generated columns backfill on creation, so on a large `articles` table this
migration takes a moment and holds a lock while it rewrites. Run it off-peak if
the corpus is big. See the header comment in the file for measured timings at
50,000 rows and the point at which the ranking cost needs revisiting.

### `20260730130000_tags_slug_unique.sql`

Adds a unique index on `public.tags (slug)`.

The article editor's Tags panel now creates a tag when an author types a name
that doesn't exist yet, resolving by slug so `Falcon 9` / `falcon 9` /
`FALCON-9` cannot become three tags. The app checks before inserting; this index
closes the race between two editors typing the same new tag at once (the API
catches the 23505 and re-reads the winner's row).

⚠️ Fails if duplicate slugs already exist — the file opens with the query to
check and the steps to merge a duplicate. Until it is applied, type-to-create
still works; a simultaneous double-create would just leave two rows sharing a
slug.

### `20260730120000_media_tag_suggestions.sql`

Adds `media_tag_suggestions(prefix, provider, limit)` — existing media tags
matching a prefix, most-used first. Powers the tag autocomplete in the Media
Library upload dialog, which is what keeps the tag vocabulary converging on one
spelling per subject instead of drifting into `isro` / `ISRO` / `Isro`.

PostgREST cannot express `unnest` + `group by` through its select syntax, hence
a function. Read-only and idempotent; nothing depends on it existing, so the
dialog degrades to a plain tag input if it has not been applied.

### `20260729120000_media_library_index.sql`

Makes `media_assets` the **searchable index of record** for the admin Media
Library, across both providers. Before it, the Supabase tab listed Storage
directly with a hard `limit: 200` and filtered filenames in the browser, so the
library stopped working past ~200 images and could only ever match on a
filename.

Adds per-asset descriptive columns (`alt_text`, `caption`, `credit`,
`photographer`, `tags`, `collection_id`, `checksum_sha256`, `blurhash`,
`deleted_at`, …), a one-level `media_collections` table, a weighted generated
`search_vector`, GIN indexes (full text, tags, and `pg_trgm` on `title` +
`storage_key`), a partial btree for keyset pagination, and two functions:
`search_media_assets` (one page, keyset cursor) and `count_media_assets` (row
total). Additive and idempotent — existing columns and rows are untouched, and
the app degrades gracefully if it has not been applied.

Three details are load-bearing; see the comments in the file before editing it:

- Both functions must stay a **single flat SELECT** so Postgres inlines them and
  can use the GIN indexes. A CTE in the body costs ~300× on a selective search.
- `count_media_assets` returns a one-row **table**, not a bare `bigint` — scalar
  SQL functions are never inlined.
- The tags branch of `search_vector` cannot use `array_to_string` (only STABLE,
  so a generated column rejects it); it goes through the immutable
  `media_tags_text` helper.

After applying, run **Sync from Storage** in the Media Library once per bucket
to index files uploaded before this existed. Full design and the remaining
phases: [`docs/MEDIA_LIBRARY_ARCHITECTURE.md`](../../docs/MEDIA_LIBRARY_ARCHITECTURE.md).

### `20260726140000_mission_details.sql`

Adds an additive, nullable `details jsonb` column to `missions` — the extensible,
namespaced home for the Phase 1 Mission Management upgrade (`details.identity`
for Enhanced Mission Identity, with room for classification / specifications /
objectives / launch / media in later features). Fully backward compatible:
existing rows get `details = NULL`, every existing column is untouched, and both
the admin editor and the public mission page degrade gracefully (re-select
without `details`) if this hasn't been applied yet. Includes a `jsonb_path_ops`
GIN index for future containment queries. Run it before relying on the enhanced
mission fields.

### `20260720170000_authors_slug.sql`

Adds a `slug` column to `authors` (unique, backfilled from the name) so each
author gets a public profile page at `/authors/:slug` with their bio, links, and
articles. The admin author editor manages the slug (auto-generated from the name,
editable). Run this before relying on author pages.

### `20260720160000_rls_policies.sql`

**Pre-launch security — review + test before applying.** Enables Row-Level
Security and adds public **read-only** policies on the tables the site serves
through the anon key (`articles` published-only; `missions`, `knowledge_articles`
and reference/join tables fully readable; `media_assets` locked). No write
policies are defined for the anon role, so the public key can never write. The
admin CMS uses the service-role key (bypasses RLS) and is unaffected. Apply on a
Supabase branch/staging first, then load the public site and confirm nothing is
blank — a blank section means a missing SELECT policy for that table.

### `20260720150000_unique_slug_indexes.sql`

Adds unique indexes on `slug` for `articles`, `missions`, `knowledge_articles` —
the database's final guard against duplicate slugs (backs up the app-level
pre-check). **Check for existing duplicates first** (the file has the queries);
it will fail if any exist.

### `20260720140000_article_views_rpc.sql`

Adds `increment_article_views(uuid)`, a `SECURITY DEFINER` function that bumps an
article's view count. The public reader calls this RPC instead of doing a direct
`UPDATE` with the anon key — so anon can keep write access **off** on the
`articles` table while the view counter still works. Run this, then keep the
articles table's RLS write policies closed to anon.

### `20260720130000_media_assets.sql`

**Extends your existing `media_assets` table** (which already holds rights
metadata: `title`, `file_url`, `copyright_status`, `license_type`,
`attribution_required`, `source_agency`, `editor_verified`, …) so the Media
Library can also track and delete assets stored in Cloudinary. It adds
`provider` / `storage_key` / `bucket` / `folder` / `uploaded_by` — it does **not**
drop or redefine existing columns or data, and leaves RLS untouched (the app uses
the service-role client). The Cloudinary action writes onto your existing columns
(`file_url`, `file_type`, `file_size`, `title`). The Supabase tab still lists
Storage directly and doesn't use this table.

**Cloudinary env (set in `.env.local` + Vercel):**

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key        # api key is not secret; the widget needs it
CLOUDINARY_API_SECRET=your-api-secret              # secret — server only
```

The Cloudinary tab in the Media Library only appears when
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is present, so the admin panel is unchanged
until you add these. R2 stays unbuilt for now (the `r2` enum slot is reserved).

### `20260720120000_admin_users.sql`

Creates the `admin_users` table that gates the `/admin` CMS now that admin auth
uses **Supabase Auth** (real accounts) instead of a shared password. A person
reaches `/admin` only if they are a Supabase Auth user **and** have an active
`admin_users` row. The `role` column (default `admin`) is the hook for future
team roles.

**After running it — bootstrap your account (one time):**

1. Enable **Email** auth in the Supabase dashboard (Authentication → Providers).
2. Create your login: Authentication → Users → *Add user* (email + password), or
   send yourself an invite.
3. Grant access by inserting your `admin_users` row (use **your** email):

   ```sql
   insert into public.admin_users (id, email)
   select id, email from auth.users where email = 'you@example.com'
   on conflict (id) do update set is_active = true;
   ```

4. Sign in at `/admin/login`.

Add teammates the same way; revoke with
`update public.admin_users set is_active = false where email = '…';`.
The old `ADMIN_PASSWORD` env var is no longer used.

### `20260713120000_add_knowledge_article_thumbnail.sql`

Adds an optional `thumbnail` (text) column to `knowledge_articles` — a
cover-image URL for Learn articles.

**Why it's optional:** the app already renders a generated, space-themed cover
for every Learn card (`modules/learn/components/LearnThumb.tsx`). This column
just lets a real image override the generated one per article. Rows left with
`thumbnail = NULL` keep the generated cover, so nothing breaks before or after
running it.

**After running it — activate real thumbnails (2 one-line edits):**

The pass-through wiring is already in place (types, normalizer, and both card
components read an optional `thumbnail`). The only thing gated on this column
is the two `SELECT` statements — add `thumbnail` to them so the value is
fetched:

1. `modules/homepage/components/LearnSection.tsx`

   ```diff
   - .select('id, title, slug, excerpt, difficulty_level, icon')
   + .select('id, title, slug, excerpt, difficulty_level, icon, thumbnail')
   ```

2. `modules/learn/services/getKnowledgeArticles.ts` (the `CARD_SELECT` constant)

   ```diff
   - id, title, slug, excerpt, difficulty_level, related_topics, icon, featured
   + id, title, slug, excerpt, difficulty_level, related_topics, icon, featured, thumbnail
   ```

   > Do these edits **only after** the column exists — selecting a column that
   > isn't there yet makes the query fail and the Learn list fall back to empty.

3. Set a thumbnail on any article, e.g.:

   ```sql
   update public.knowledge_articles
   set thumbnail = 'https://…/orbital-mechanics.jpg'
   where slug = 'orbital-mechanics';
   ```

That article's card now shows the photo; everything else keeps its generated
cover.

**Managing topics without SQL:** the admin CMS has a **Learn** section
(`/admin/learn`) to create/edit/delete topics, including a thumbnail field with
Media Library upload. The editor is resilient — it works *before* this
migration (managing every field except the thumbnail) and starts persisting
thumbnails automatically once the column exists, so no code change is needed to
save images through the CMS.
