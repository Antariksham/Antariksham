# Media Library — scale architecture (search, grouping, filtering at 10k+ assets)

**Status:** **Phases 1, 2 and 4 are implemented, plus Phase 5's detail drawer**
(§9) — the index, the search functions, server-side search with keyset
pagination, upload-time metadata with dedupe and content-hash keys, and
after-the-fact editing of any asset. Phase 3 and the rest of Phase 5 are still
design.
**Problem:** uploads are stored as `1753612345678-img-4471.jpg`. At a few hundred
images that is ugly; at a few thousand it makes the library unusable — you cannot
search, group, filter, or find anything.

---

## 0. The one insight

> **Renaming files does not solve this. Making the filename irrelevant does.**

Filenames are a *terrible* index: one flat string, one axis, no synonyms, no
facets, and renaming them breaks every published URL. Every serious DAM (Adobe
AEM Assets, Cloudinary MediaFlows, Contentful, WordPress ≥6, Ghost, Strapi)
converges on the same shape:

| Layer | Job |
|---|---|
| **Object storage** | holds bytes at a key nobody reads |
| **Postgres** | holds the *metadata* and answers every query |
| **UI** | queries Postgres, never the storage bucket |

So the plan is two-part, and the second part is the important one:

1. Fix the key scheme so new objects are diagnosable by a human in ops (§2).
2. **Put a Postgres metadata index in front of storage** and route 100% of
   library reads through it (§3–§5). This is what buys sub-second search at
   100k assets.

---

## 1. What is actually broken today

| # | Problem | Where |
|---|---|---|
| 1 | Key is `Date.now()-sanitised-original-name` — opaque, unsortable by meaning, no dedupe | `app/api/admin/media/route.ts:96-102` |
| 2 | **Supabase tab lists Storage directly, capped at 200 objects.** Asset 201 is invisible. Forever. No pagination. | `app/api/admin/media/route.ts:29-36` |
| 3 | Cloudinary tab is also hard-capped at 200 rows | `actions/cloudinary-media.ts:78` |
| 4 | Search is a **client-side substring match on the filename**, over only the loaded page | `modules/admin/media/SupabaseMediaPanel.tsx:92` |
| 5 | Cloudinary tab has **no search box at all** | `modules/admin/media/CloudinaryMediaPanel.tsx` |
| 6 | No tags, no collections, no folders, no date facets, no sort control | — |
| 7 | Supabase assets have **no database row** — `media_assets` is only written by the Cloudinary path | `actions/cloudinary-media.ts:44` |
| 8 | Grid renders every item at once, full-size `<img>` for Supabase (no derivative) | `modules/admin/media/MediaGrid.tsx:51,117` |
| 9 | No dedupe — the same photo uploaded 5× is 5 objects | — |
| 10 | No usage graph — `Del` deletes an image that may be live on 8 articles, with only a `confirm()` between you and a broken hero | `MediaGrid.tsx:145` |
| 11 | Attribution metadata is stored **per usage**, not per asset — `articles.featured_image_meta` and mission `MediaItem` both re-type alt/credit/licence for the same photo, every time | `20260724120000_article_featured_image_meta.sql`, `modules/missions/services/missionMedia.ts:14` |

Item 11 is the hidden cost. The newsroom-grade metadata (`alt, caption, credit,
photographer, organization, sourceUrl, license, copyright`) *already exists in
this codebase twice* — it is just attached to the wrong object. Attach it to the
asset and it becomes the search index for free.

---

## 2. Storage key scheme (for new uploads)

```
<yyyy>-<mm>-<slug>--<sha256[0..8]>.<ext>
```

```
2026-07-chandrayaan-3-vikram-lander-touchdown--a3f19c2b.webp
2026-07-artemis-ii-crew-portrait--7e01d4f9.jpg
```

**`slug`** — kebab-case of the title the editor types at upload (falls back to
the sanitised original filename), capped at 60 chars.
**`--<hash8>`** — first 8 hex of the SHA-256 of the file bytes.
**`yyyy-mm`** — keeps the bucket browsable in chronological order; it is for
ops, *not* for lookups.

> **Changed during implementation:** this was specified as real `yyyy/mm/`
> folders. It ships flat, because Supabase Storage's `list()` is per-prefix and
> non-recursive — folders would turn the resumable sync walk into a tree walk
> with a cursor per prefix, in exchange for a browsing nicety the database index
> already provides. A `thumbs/` prefix is the one real folder, and sync skips it
> by ignoring entries with a null id.

Why a content hash rather than `Date.now()`:

- **Idempotent.** Re-uploading the same bytes produces the same key — no
  duplicate objects, upload retries are safe.
- **Free dedupe.** Hash collision on insert = "this image is already in your
  library", link to the existing asset instead of storing it twice.
- **Free cache-busting.** The URL changes if and only if the bytes change, so
  these can be served `Cache-Control: public, max-age=31536000, immutable`.
- **Free integrity check.** Reconciliation can verify storage against the DB.
- **No collisions on bulk upload.** `Date.now()` can repeat inside one
  `Promise.all` batch; content hashes cannot.

The double dash separates the human part from the machine part unambiguously, so
`slug` can safely contain single dashes.

> **The hash is not what makes assets findable.** It is there so the key is
> unique and stable. Findability comes entirely from §3.

---

## 3. Schema — Postgres becomes the index of record

Additive migration, in this repo's idempotent house style
(`supabase/migrations/2026xxxx_media_assets_index.sql`). Existing columns
(`title, file_url, copyright, license, attribution_required, source_agency,
editor_verified, provider, storage_key, bucket, folder, width, height,
file_size, file_type`) are untouched.

```sql
-- ── 3.1 Descriptive metadata (moves alt/credit from per-usage to per-asset) ──
alter table public.media_assets
  add column if not exists slug            text,
  add column if not exists alt_text        text,
  add column if not exists caption         text,
  add column if not exists credit          text,
  add column if not exists photographer    text,
  add column if not exists source_url      text,
  add column if not exists tags            text[] not null default '{}',
  add column if not exists collection_id   uuid,
  add column if not exists checksum_sha256 text,
  add column if not exists captured_at     timestamptz,   -- when shot ≠ when uploaded
  add column if not exists thumb_url       text,
  add column if not exists blurhash        text,          -- also closes MIGRATION.md §10 "blur placeholders"
  add column if not exists dominant_color  text,
  add column if not exists usage_count     integer not null default 0,
  add column if not exists last_used_at    timestamptz,
  add column if not exists deleted_at      timestamptz;   -- soft delete

-- ── 3.2 Collections: ONE level. Deep trees are where DAMs go to die. ─────────
create table if not exists public.media_collections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- ── 3.3 Usage graph: which entity uses which asset, and where ───────────────
create table if not exists public.media_usages (
  asset_id    uuid not null references public.media_assets (id) on delete cascade,
  entity_type text not null,          -- 'article' | 'mission' | 'knowledge' | 'author' | 'gallery'
  entity_id   uuid not null,
  field       text not null,          -- 'featured_image' | 'body' | 'media.hero' | 'media.gallery[2]'
  updated_at  timestamptz not null default now(),
  primary key (asset_id, entity_type, entity_id, field)
);
create index if not exists media_usages_entity_idx
  on public.media_usages (entity_type, entity_id);

-- ── 3.4 The search vector — one generated column, weighted ──────────────────
alter table public.media_assets
  add column if not exists search_vector tsvector
  generated always as (
      setweight(to_tsvector('simple', coalesce(title, '')),                            'A')
   || setweight(to_tsvector('simple', array_to_string(tags, ' ')),                      'A')
   || setweight(to_tsvector('simple', coalesce(alt_text, '')),                          'B')
   || setweight(to_tsvector('simple', coalesce(caption, '')),                           'C')
   || setweight(to_tsvector('simple', coalesce(credit, '') || ' ' ||
                                      coalesce(photographer, '') || ' ' ||
                                      coalesce(source_agency, '')),                     'C')
   || setweight(to_tsvector('simple', coalesce(slug, '')),                              'D')
  ) stored;
```

### Indexes — this is where the "one second" comes from

```sql
create extension if not exists pg_trgm;

-- Full-text search over everything descriptive
create index if not exists media_assets_search_idx
  on public.media_assets using gin (search_vector);

-- Typo tolerance + infix match: "chandryan" still finds "chandrayaan"
create index if not exists media_assets_title_trgm_idx
  on public.media_assets using gin (title gin_trgm_ops);

-- Tag filtering: tags @> '{mars,rover}'
create index if not exists media_assets_tags_idx
  on public.media_assets using gin (tags);

-- Default sort + keyset pagination (partial: skips soft-deleted rows entirely)
create index if not exists media_assets_recent_idx
  on public.media_assets (created_at desc, id desc)
  where deleted_at is null;

-- Dedupe
create unique index if not exists media_assets_checksum_uidx
  on public.media_assets (checksum_sha256)
  where checksum_sha256 is not null and deleted_at is null;

-- Faceted filters that get combined with search
create index if not exists media_assets_collection_idx
  on public.media_assets (collection_id) where deleted_at is null;
create index if not exists media_assets_unused_idx
  on public.media_assets (usage_count) where deleted_at is null;
```

**Two axes, deliberately different:**

- **Collections** = *where it lives* — one per asset, one level deep
  ("Chandrayaan 3", "Artemis", "Stock / Earth"). Mutually exclusive, browsable.
- **Tags** = *what it is about* — many per asset, flat
  (`mars`, `rover`, `nasa`, `launch`, `infographic`, `hero-safe`).

Nested folder trees look organised for the first month and become a filing
argument by the third. Tags carry the load; one level of collections is enough.

---

## 4. The query — two inlinable functions

Implemented in `supabase/migrations/20260729120000_media_library_index.sql`,
mirroring the existing `20260720140000_article_views_rpc.sql` pattern.

```sql
-- One page. Keyset cursor, never OFFSET.
search_media_assets(p_query, p_provider, p_bucket, p_tags, p_collection,
                    p_cursor_ts, p_cursor_id, p_limit)  -> returns table (...)

-- Row total for the same filters. First page only.
count_media_assets(p_query, p_provider, p_bucket, p_tags, p_collection)
                                                       -> returns table (total bigint)
```

The predicate is full-text first —
`search_vector @@ websearch_to_tsquery('english', q)`, which stems (`rovers`
finds `rover`) and supports `mars -curiosity` and `"quoted phrases"` — OR an
ILIKE fallback on `title` and `storage_key` so partial words and raw filenames
still match.

### Four things that EXPLAIN, not intuition, decided

Each of these was written the obvious way first and measured at 50k rows.

1. **The body must be one flat SELECT.** A `with q as (...)` holding the parsed
   tsquery reads much better, but it stops Postgres inlining the function, so
   the planner never sees the search term as a constant and cannot turn it into
   an index condition. Selective search went from a 50,000-row sequential scan
   to a three-way `BitmapOr`: **88 ms → 0.7 ms**.

2. **The row total needs its own function.** `count(*) over ()` beside the rows
   is one round trip and reads well, but a window count must visit every
   matching row *on every page* — it turned a 48-row page into a 37,500-row scan
   and cancelled out the keyset index entirely.

3. **That count function must be set-returning.** As a scalar
   `returns bigint` it is never inlined and plans blind to its arguments:
   **190 ms**. Declared `returns table (total bigint)` and called from the FROM
   clause it inlines like the search does: **0.7 ms**.

4. **Every OR branch needs an index.** One unindexed branch forces a sequential
   scan no matter how good the other indexes are, so `storage_key` gets a
   trigram index alongside `title` — otherwise the whole `BitmapOr` collapses.

Two more that are easy to get wrong:

- `array_to_string(tags, ' ')` is only STABLE, so a generated column rejects it.
  It goes through an immutable `media_tags_text` wrapper — and it must keep the
  `english` stemming, or a `mars` tag never matches a search for `mars`, which
  the stemmer reduces to `mar`.
- The provider filter casts the **parameter** to the enum
  (`a.provider = p_provider::media_provider`), not the column. Casting the
  column makes it unindexable and throws away the scope index.

### Not yet wired

`p_sort`, orientation, date-range and unused-only filters, and facet counts are
deferred to Phase 5 with the filter rail that would expose them. Ordering is
newest-first throughout, which keeps the keyset cursor provably correct;
relevance ranking needs a cursor that encodes rank, and is not worth it before
there is a UI to sort from.


## 5. API contract

Replace the bucket-listing route with a query route. `GET /api/admin/media`:

```
?q=chandrayaan lander
&tags=mars,rover
&collection=<uuid>
&provider=supabase|cloudinary
&orientation=landscape
&unused=1
&from=2026-01-01&to=2026-07-31
&sort=recent|relevance|name|size|usage
&cursor=<opaque>
&limit=48
```

```jsonc
{
  "items": [{
    "id": "…", "url": "…", "thumbUrl": "…", "blurhash": "L6P…",
    "title": "Chandrayaan-3 Vikram lander touchdown",
    "alt": "…", "caption": "…", "credit": "ISRO",
    "tags": ["chandrayaan", "isro", "lander"],
    "width": 3840, "height": 2160, "sizeBytes": 812344,
    "provider": "supabase", "usageCount": 3, "createdAt": "…"
  }],
  "facets": {
    "tags":        [{ "value": "mars", "count": 412 }],
    "collections": [{ "id": "…", "name": "Artemis", "count": 88 }],
    "providers":   [{ "value": "supabase", "count": 5120 }]
  },
  "total": 5308,
  "nextCursor": "eyJ0cyI6…"
}
```

The existing storage-listing GET is kept only for a reconciliation job
(§8), never for the UI.

Supporting routes:

| Route | Purpose |
|---|---|
| `POST /api/admin/media/precheck` | `{ sha256 }` → existing asset or `null` (dedupe before upload) |
| `POST /api/admin/media` | upload + derive + insert row (existing route, extended) |
| `PATCH /api/admin/media/:id` | ✅ edit title / alt / caption / credit / tags (title change moves the slug, which feeds the search vector) |
| `POST /api/admin/media/bulk` | tag / move / delete N selected assets |
| `GET /api/admin/media/:id/usages` | "where is this used" |
| `POST /api/admin/media/:id/replace` | swap bytes, **keep the URL** — fixes a bad crop everywhere at once |

---

## 6. UI changes

Everything below uses the CosmosDaily tokens and classes per `CLAUDE.md` §1–§4
(`rgba(var(--ink), a)`, `var(--accent)`, `.card`, `.btn*`), and must be verified
in both light and dark.

**`modules/admin/media/`**

- **`MediaFilterRail`** — search box (debounced 200 ms, server-side), tag chips
  with live counts, collection select, provider, orientation, date range,
  “unused only”, sort. Filters live in the URL query string so a filtered view
  is shareable and survives a refresh.
- **`MediaGrid`** — **virtualised**. Only the visible window is in the DOM; at
  5k items an unwindowed grid is ~5k `<img>` nodes and hundreds of MB. Infinite
  scroll on `nextCursor`, `blurhash`/`dominant_color` as the placeholder.
- **Thumbnails, not originals.** Cloudinary already derives one
  (`CloudinaryMediaPanel.tsx:12`). Supabase Storage needs the same: either the
  render transform (`getPublicUrl(key, { transform: { width: 400, quality: 60 }})`)
  or a `…--thumb.webp` derivative written at upload time into `thumb_url`.
  Today the grid downloads full 4K originals — **this single change is the
  biggest perceived speed win.**
- **`MediaDetailDrawer`** — title, alt, caption, credit, photographer, licence,
  tags, collection, "used in 3 places" with links, Replace file, Delete.
- **Bulk select** — shift-click range, then tag / move / delete.
- **`MediaQuickPick`** — a `⌘K` palette inside the article editor: type two
  words, top 8 results, Enter inserts. Opens on **Recent** + **Most used**,
  because most reuse is recent. *This* is the "find it in one second"
  experience; the full library page is for curation.

The public props of `MediaLibrary` (`pickerMode`, `onPick`, `defaultBucket`)
stay unchanged, so `ContentEditorField`, `FeaturedImageManager`, `LearnForm`,
`MissionMediaFields` and `AuthorsAdmin` keep working untouched.

---

## 7. Upload pipeline — implemented

Files picked or dropped are **staged, not uploaded**. `MediaUploadDialog` opens
between the two.

```
1. Browser   SHA-256 each file (crypto.subtle), read dimensions, build preview
2. Browser → POST /api/admin/media/precheck { checksums[] }
               one batched lookup; matches are marked "already in the library"
               and skipped — no bytes uploaded
3. Editor    fills Title (prefilled from the filename) + Alt + tags   ← the point
4. Browser   400x250 WebP thumbnail via canvas
5. Server    re-computes the checksum itself (never trusts the client),
             re-checks for duplicates, builds the key, uploads original + thumb,
             inserts the row — rolling the objects back if indexing fails
```

**Step 3 is the whole reason this phase exists.** Everything in §3 and §4 can
only find words that already exist; `IMG_4471.jpg` has none. Metadata entered
"later" is never entered.

What keeps it from feeling like data entry:

- **Title is prefilled** from the filename, de-slugified and sentence-cased —
  usually just needs a glance.
- **Tags apply to the whole batch** by default, with per-image extras. Uploading
  twelve Chandrayaan photos is one tag entry, not twelve.
- **Autocomplete over existing tags** (`media_tag_suggestions`, most-used
  first), so the vocabulary converges instead of drifting into
  `isro`/`ISRO`/`Isro` as three separate filters. `normalizeTags` enforces one
  spelling regardless.
- **Duplicates are shown before you commit**, not discovered afterwards.

**Alt text is required**, with a *Decorative — no alt text needed* checkbox that
writes an explicitly empty alt. That is the accessibility-correct escape hatch:
a decorative image genuinely should have `alt=""`, which is a different thing
from a missing one. Title is required too, since it is the search anchor.

**Thumbnails are generated in the browser**, in a canvas. The browser has
already decoded the image, so it costs nothing extra, and it avoids both a
native image dependency in the serverless bundle and the paid Supabase Storage
render transform. They live under a `thumbs/` prefix and are deleted with their
asset. Every step degrades to null rather than throwing — a browser that cannot
encode WebP costs the upload its thumbnail, not the upload.

### Cloudinary takes the same metadata, one step later

`<CldUploadWidget>` is a third-party iframe that hands the file over only after
it has landed, so there is nowhere to interrupt beforehand. Each upload is
recorded, its asset id reported back, and `MediaMetadataDialog` opens once the
widget closes to `PATCH` the same title / alt / credit / tags onto the rows.
Both providers share `MediaMetaFields`, so they cannot drift into asking for
different things in different ways.

The dialog can be dismissed with *Skip for now*, which says plainly that the
images will be hard to find until they are described — better than a modal that
cannot be escaped.

### Search spans buckets; tabs only scope browsing

`article-images` and `mission-images` are storage locations, not subject
boundaries. Scoping a query to the open tab means an editor who uploaded to one
bucket and searches from the other is told "no matches" about an image that is
right there. So a query drops the bucket filter, the count says *all buckets*,
and each result card carries a bucket badge. The tabs still scope browsing,
which is what they are actually good for.

### Still open here

Context pre-fill — seeding tags from the article's own categories when the
picker is opened from an editor — needs a `defaultTags` prop threaded through
the callers, and is not wired up.


## 8. Backfilling what already exists

> **Do not rename existing objects.** Every published article, mission and
> `knowledge_articles` thumbnail stores an absolute Storage URL. Renaming the
> object 404s the live site. There is no rename in Supabase Storage that
> preserves the old URL.

`scripts/backfill-media-assets.mjs` (dry-run by default, like
`scripts/migrate-cosmosdaily-articles.mjs`):

1. Paginate `storage.list()` 1000 at a time over both buckets (the current code
   stops at 200 — that is why this must paginate).
2. For each object insert a `media_assets` row: `provider`, `storage_key`,
   `bucket`, `file_url`, `file_size`, `file_type`, `created_at`.
3. `title` ← existing filename with the `^\d{13}-` prefix stripped and dashes
   turned into spaces, title-cased. The same rule `SupabaseMediaPanel.tsx:24`
   already applies for display — it just becomes durable.
4. Stream each object once to compute `sha256`, dimensions, blurhash. Flag
   duplicate checksums in a report rather than deleting anything.
5. Build `media_usages` by scanning `articles.featured_image`,
   `articles.content` (regex over `<img src>`), `missions.details.media.*`,
   `knowledge_articles.thumbnail`, `authors.avatar`, `gallery_images`.
6. **Harvest existing metadata**: copy `articles.featured_image_meta`
   (`alt/caption/credit/photographer/organization/license/copyright`) onto the
   matching asset row. Hundreds of images arrive already described, for free.

Old keys stay ugly forever and that is fine — nobody reads them, because the UI
reads `title`. New uploads get the §2 scheme.

---

## 9. Phasing

| Phase | Scope | Unblocks | Status |
|---|---|---|---|
| **1** | Schema + indexes + search functions; write a `media_assets` row on **every** upload (Supabase path included) | the whole rest | ✅ **done** |
| **2** | `GET /api/admin/media` reads the functions; keyset pagination; both provider panels read it | **the 200-file ceiling and the client-side search both disappear** | ✅ **done** |
| **3** | Backfill script + `media_usages` + metadata harvest | safe deletes, "unused" filter | ~1 day |
| **4** | Upload dialog (title/alt/tags), dedupe precheck, new key scheme, thumbnails | new uploads stop being the problem | ✅ **done** |
| **5a** | Per-asset detail drawer — edit title / alt / caption / credit / tags after upload | ✅ **done** |  |
| **5b** | Filter rail, virtualised grid, bulk ops, `⌘K` quick-pick | the "one second" experience | ~1.5 days |

Phases 1+2 fixed the two things that actually break at scale: the 200-file cap
and filename-only client-side search. A **Sync from Storage** action
(`POST /api/admin/media/sync`, resumable) ships with them — without it, files
uploaded before the index existed would vanish from a library that now reads
the index rather than the bucket. It is the minimum slice of Phase 3 needed to
make Phase 2 non-destructive; checksums, dimensions, blurhash, the usage graph
and the `featured_image_meta` harvest are still Phase 3.

**Phase 4 closed the loop.** Phases 1+2 made the library searchable and
instant, but could only index words that already existed — a title derived from
the filename. The upload dialog now asks for a title, alt text and tags at the
moment of upload, so new images arrive findable.

**The detail drawer closes the retroactive gap.** Clicking any card opens it:
title, alt text, caption, credit and tags, saved through
`PATCH /api/admin/media/:id`, plus the read-only file facts and copy/open/delete.
Two decisions worth recording:

- **Alt text is required at upload but only warned about in the drawer.**
  Blocking a title fix because a *different* field is incomplete punishes the
  person improving the record. Cards carry a `No alt` badge instead, so the gap
  stays visible without being an obstacle.
- **A save merges into the grid in place rather than refetching.** Refetching
  would be simpler but would reset scroll and can reorder or drop the row being
  edited, since results depend on the very fields just changed.

**What is left is about the images already there.** Anything uploaded before
Phase 4 still has only a filename-derived title. Phase 3's metadata harvest
(pulling alt/caption/credit off `articles.featured_image_meta` and
`missions.details.media` onto the assets that use them) is the cheapest way to
fix that in bulk; the rest needs the Phase 5 detail drawer and bulk tagging. The
backfill also cannot compute checksums for existing rows, so dedupe only
protects images uploaded from Phase 4 onward until it runs.

---

## 10. Budget at scale

Measured on Postgres 16 against **50,003 rows**, after `VACUUM ANALYZE`, with
the shipped functions:

| Operation | Plan | Time |
|---|---|---|
| Panel opening (first page, no query) | index scan on `scope_recent_idx` | **0.6 ms** |
| Deep keyset page (~page 500) | same index, cursor as index cond | **0.5 ms** |
| Selective search (3 of 50,003) | `BitmapOr` across FTS + both trigram indexes | **0.7 ms** |
| Common search (10k of 50,003) | ordered index scan, early exit | **1.1 ms** |
| Row total, selective | inlined count | **0.7 ms** |
| Row total, common (10k matches) | inlined count | **16 ms** |
| Row total, unfiltered (37.5k matches) | inlined count | **5.9 ms** |

Deep pages cost the same as the first page, which is the whole point of the
keyset cursor. The remaining budget goes to network and thumbnail decode — which
is why Phase 5's thumbnails and virtualised grid matter more from here than any
further query tuning.

**One caveat worth knowing:** immediately after a bulk insert, before statistics
catch up, the planner misjudges the selective search and falls back to a
sequential scan (~88 ms). `VACUUM ANALYZE` fixes it. Run it after the initial
Sync from Storage.

**No Elasticsearch / Algolia / Typesense.** At the scale of a space-news
newsroom, Postgres GIN + trigram is faster than the network hop to an external
index, and it removes an entire sync-consistency failure mode. Revisit only if
you need cross-entity search over millions of documents with per-field boosting.

---

## 11. Deliberately not building

- **Nested folder trees** — one level of collections + tags covers it, without
  the "which folder does this belong in" tax.
- **AI auto-tagging on upload** — tempting, but it produces plausible-wrong tags
  for spacecraft and mission names, which is worse than no tag in a publication
  that is accuracy-first. A *suggest-and-confirm* pass over the backfilled
  library is the safe version, later.
- **Renaming existing objects** — see §8. Never worth a live 404.
- **A second storage provider** — Supabase + Cloudinary is already two. The
  index makes them look like one library; that is the win.

---

## 12. Migration-doc bookkeeping

When implemented, move the completed phases into `MIGRATION.md` §2 and strike
the corresponding lines from §10, including the existing
*"Media blur placeholders / build-time optimisation"* item — `blurhash` +
`dominant_color` in §3 closes it.
