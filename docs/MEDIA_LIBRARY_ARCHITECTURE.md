# Media Library — scale architecture (search, grouping, filtering at 10k+ assets)

**Status:** proposal / design doc. Nothing here is implemented yet.
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
<bucket>/<yyyy>/<mm>/<slug>--<sha256[0..8]>.<ext>
```

```
article-images/2026/07/chandrayaan-3-vikram-lander-touchdown--a3f19c2b.webp
mission-images/2026/07/artemis-ii-crew-portrait--7e01d4f9.jpg
```

**`slug`** — kebab-case of the title the editor types at upload (falls back to
the sanitised original filename), capped at 60 chars.
**`--<hash8>`** — first 8 hex of the SHA-256 of the file bytes.
**`yyyy/mm`** — keeps any single storage prefix small and gives a natural
archival boundary; it is for ops, *not* for lookups.

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

## 4. The query — a single RPC, one round trip

Mirrors the existing `20260720140000_article_views_rpc.sql` pattern.

```sql
create or replace function public.search_media_assets(
  p_query      text default null,
  p_tags       text[] default null,
  p_collection uuid default null,
  p_provider   text default null,
  p_orientation text default null,          -- 'landscape' | 'portrait' | 'square'
  p_unused_only boolean default false,
  p_from       timestamptz default null,
  p_to         timestamptz default null,
  p_sort       text default 'recent',       -- recent | name | size | usage | relevance
  p_cursor_ts  timestamptz default null,    -- keyset pagination, never OFFSET
  p_cursor_id  uuid default null,
  p_limit      int default 48
)
returns table (...) language sql stable as $$
  with q as (select case when coalesce(p_query,'') = '' then null
                    else websearch_to_tsquery('simple', p_query) end as tsq)
  select a.*, count(*) over () as total_count
  from public.media_assets a, q
  where a.deleted_at is null
    and (q.tsq is null or a.search_vector @@ q.tsq
         or a.title % p_query)                              -- trigram fallback: typos
    and (p_tags is null       or a.tags @> p_tags)
    and (p_collection is null or a.collection_id = p_collection)
    and (p_provider is null   or a.provider::text = p_provider)
    and (p_from is null       or a.created_at >= p_from)
    and (p_to is null         or a.created_at <= p_to)
    and (not p_unused_only    or a.usage_count = 0)
    and (p_orientation is null or case p_orientation
           when 'landscape' then a.width > a.height
           when 'portrait'  then a.height > a.width
           else a.width = a.height end)
    and (p_cursor_ts is null or (a.created_at, a.id) < (p_cursor_ts, p_cursor_id))
  order by
    case when p_sort = 'relevance' and q.tsq is not null
         then ts_rank_cd(a.search_vector, q.tsq) end desc nulls last,
    case when p_sort = 'usage' then a.usage_count end desc nulls last,
    case when p_sort = 'size'  then a.file_size  end desc nulls last,
    a.created_at desc, a.id desc
  limit p_limit;
$$;
```

Notes that matter:

- **`websearch_to_tsquery`** gives editors real query syntax for free:
  `mars rover -curiosity`, `"solar eclipse"`.
- **Trigram fallback** (`a.title % p_query`, `pg_trgm` similarity) catches the
  misspellings that FTS misses. Two indexes, one query.
- **Keyset pagination** (`(created_at, id) < (cursor)`) stays O(limit) at page
  500. `OFFSET 20000` does not.
- **`count(*) over ()`** returns the total in the same round trip — no second
  count query.
- Facet counts (tag → count) come from one extra grouped query, cached 60s.

Realistic timing at 100k rows on Supabase's smallest paid instance: GIN lookup
**1–4 ms**, whole RPC **< 15 ms**. The one-second budget is then spent entirely
on network and thumbnail decode — which §6 handles.

---

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
| `PATCH /api/admin/media/:id` | edit title / alt / caption / credit / tags / collection |
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

## 7. Upload pipeline

```
1. Client   hash file with crypto.subtle.digest('SHA-256')
2. Client → POST /api/admin/media/precheck { sha256 }
             ↳ hit  → "Already in your library" + link to it. Zero bytes uploaded.
             ↳ miss → continue
3. Editor   fills Title + Alt + Tags in the upload dialog  ← the real fix
4. Server   sniff true mime (magic bytes, not the client's Content-Type)
            read dimensions, compute blurhash + dominant colour
            build key: <yyyy>/<mm>/<slug>--<hash8>.<ext>
            write original + 400px thumb
5. Server   insert media_assets row (checksum, dims, thumb_url, tags, alt…)
```

**Step 3 is the actual solution to the user-facing problem.** Metadata entered
"later" is never entered. Two fields at upload time — title and 2-4 tags — is
what makes 10,000 assets searchable. Make `alt_text` required for anything
destined for an article body (it is an accessibility and SEO requirement
anyway, and `FeaturedImageManager.tsx:62` already warns about it).

Cheap accelerators so it never feels like data entry:

- Pre-fill tags from context — uploading from the Chandrayaan-3 article editor
  seeds the article's categories/tags.
- Pre-fill title from the original filename, de-slugified and title-cased.
- Suggest existing tags as you type (autocomplete off the facet list) so the
  vocabulary stays clean instead of drifting into `isro`/`ISRO`/`Isro`.

---

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

| Phase | Scope | Unblocks | Rough effort |
|---|---|---|---|
| **1** | Schema + indexes + RPC migration; write a `media_assets` row on **every** upload (Supabase path included) | the whole rest | ~0.5 day |
| **2** | `GET /api/admin/media` reads the RPC; keyset pagination; grid reads it | **the 200-file ceiling and the client-side search both disappear** | ~1 day |
| **3** | Backfill script + `media_usages` + metadata harvest | existing library becomes searchable | ~1 day |
| **4** | Upload dialog (title/alt/tags), dedupe precheck, new key scheme, thumbnails | new uploads stop being the problem | ~1 day |
| **5** | Filter rail, virtualised grid, detail drawer, bulk ops, `⌘K` quick-pick | the "one second" experience | ~2 days |

Phase 1+2 alone fixes the two things that actually break at scale (the 200 cap
and filename-only client-side search). Ship those first; 3–5 are progressive
enhancement and each is independently useful.

---

## 10. Budget at scale

| Assets | RPC (GIN) | Payload / page (48 items) | Notes |
|---|---|---|---|
| 1k | ~1 ms | ~40 KB JSON + 48 thumbs | — |
| 10k | ~2 ms | same | keyset pagination now mandatory |
| 100k | ~4 ms | same | consider `pg_partman` on `created_at` only if writes get heavy |
| 1M | ~10 ms | same | still Postgres; no external search engine needed |

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
