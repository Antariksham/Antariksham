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
