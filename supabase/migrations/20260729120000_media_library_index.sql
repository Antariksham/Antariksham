-- Media Library at scale — Phase 1 (see docs/MEDIA_LIBRARY_ARCHITECTURE.md).
--
-- Makes public.media_assets the searchable INDEX OF RECORD for both providers
-- (Supabase Storage + Cloudinary). Before this, the admin library listed
-- Supabase Storage directly with a hard `limit: 200` and filtered filenames in
-- the browser, so the library silently stopped working past ~200 images and
-- could never match on anything but the filename.
--
-- Additive + nullable throughout: every existing column and row is untouched,
-- and both the admin panel and the public read paths degrade gracefully if this
-- has not been applied yet. Idempotent: safe to re-run.

-- ── 0. Columns this migration READS in the generated tsvector ────────────────
-- Documented as already present on the table; guarded so the migration cannot
-- fail on a project where one is missing.
alter table public.media_assets
  add column if not exists title         text,
  add column if not exists file_url      text,
  add column if not exists source_agency text;

-- ── 1. Descriptive metadata, per ASSET ──────────────────────────────────────
-- Today alt/caption/credit live per USAGE (articles.featured_image_meta and
-- missions.details.media), so the same photo is re-described on every reuse and
-- none of it is searchable. These columns are where that moves to.
alter table public.media_assets
  add column if not exists slug            text,
  add column if not exists alt_text        text,
  add column if not exists caption         text,
  add column if not exists credit          text,
  add column if not exists photographer    text,
  add column if not exists source_url      text,
  add column if not exists tags            text[] not null default '{}',
  add column if not exists collection_id   uuid,
  add column if not exists checksum_sha256 text,   -- Phase 4: dedupe on upload
  add column if not exists captured_at     timestamptz,
  add column if not exists thumb_url       text,
  add column if not exists blurhash        text,   -- closes MIGRATION.md §10 blur placeholders
  add column if not exists dominant_color  text,
  add column if not exists usage_count     integer not null default 0,
  add column if not exists last_used_at    timestamptz,
  add column if not exists deleted_at      timestamptz;

comment on column public.media_assets.tags is
  'Flat, many-per-asset subject tags ("mars", "rover", "isro"). Weighted ''A'' in search_vector.';
comment on column public.media_assets.deleted_at is
  'Soft-delete marker. Every index below is partial on `deleted_at is null`, so archived rows cost nothing.';

-- ── 2. Collections — ONE level, deliberately ────────────────────────────────
-- "Where it lives" (one per asset). Tags carry "what it is about". Nested trees
-- look organised for a month and become a filing argument by the third.
create table if not exists public.media_collections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- Admin/service-role only, matching the media_assets policy in
-- 20260720160000_rls_policies.sql (RLS on, no anon policy).
alter table public.media_collections enable row level security;

do $$ begin
  alter table public.media_assets
    add constraint media_assets_collection_fk
    foreign key (collection_id) references public.media_collections (id) on delete set null;
exception when duplicate_object then null;
end $$;

-- ── 3. The search vector ────────────────────────────────────────────────────
-- Weighted so a title/tag hit outranks a stray match in a credit line. The
-- 'english' config is chosen over 'simple' so "rovers" matches "rover"; the
-- explicit ::regconfig cast picks the IMMUTABLE two-argument to_tsvector, which
-- a generated column requires. Slug dashes become spaces so `vikram-lander`
-- indexes as two words.
--
-- Tags need the same stemming as everything else, or the index and the query
-- disagree: a `mars` tag stored verbatim never matches a search for "mars",
-- which the english stemmer reduces to `mar`.
--
-- The obvious `array_to_string(tags, ' ')` cannot be used — it is only STABLE,
-- because in general it depends on the element type's output function, and
-- Postgres rejects non-immutable expressions in a generated column. For text[]
-- specifically there is nothing non-immutable about it, so it is wrapped in an
-- immutable helper. (The generated column depends on this function: change it
-- and the column has to be rebuilt.)
create or replace function public.media_tags_text(p_tags text[])
returns text
language sql
immutable
parallel safe
as $$ select coalesce(array_to_string(p_tags, ' '), '') $$;

alter table public.media_assets
  add column if not exists search_vector tsvector
  generated always as (
       setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, public.media_tags_text(tags)), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(alt_text, '')), 'B')
    || setweight(to_tsvector('english'::regconfig, coalesce(caption, '')), 'C')
    || setweight(to_tsvector('english'::regconfig,
           coalesce(credit, '')       || ' ' ||
           coalesce(photographer, '') || ' ' ||
           coalesce(source_agency, '')), 'C')
    || setweight(to_tsvector('english'::regconfig, replace(coalesce(slug, ''), '-', ' ')), 'D')
  ) stored;

-- ── 4. Indexes — this is where "one second at 50k" comes from ───────────────
create index if not exists media_assets_search_idx
  on public.media_assets using gin (search_vector);

create index if not exists media_assets_tags_idx
  on public.media_assets using gin (tags);

-- Default sort + keyset pagination. Partial, so soft-deleted rows are not even
-- in the index.
create index if not exists media_assets_recent_idx
  on public.media_assets (created_at desc, id desc)
  where deleted_at is null;

-- The library always scopes by provider (+ bucket for Supabase Storage).
create index if not exists media_assets_scope_recent_idx
  on public.media_assets (provider, bucket, created_at desc, id desc)
  where deleted_at is null;

create index if not exists media_assets_collection_idx
  on public.media_assets (collection_id)
  where deleted_at is null and collection_id is not null;

-- Phase 4 dedupe: same bytes uploaded twice = one asset.
create unique index if not exists media_assets_checksum_uidx
  on public.media_assets (checksum_sha256)
  where checksum_sha256 is not null and deleted_at is null;

-- Replaces the equivalent index from 20260720130000_media_assets.sql, adding
-- `deleted_at is null` so a soft-deleted row never blocks re-uploading a key.
drop index if exists public.media_assets_provider_key_uidx;
create unique index if not exists media_assets_provider_key_uidx
  on public.media_assets (provider, storage_key)
  where storage_key is not null and deleted_at is null;

-- pg_trgm accelerates the ILIKE substring fallback in the RPC below (gin_trgm_ops
-- indexes LIKE/ILIKE). Guarded: if the extension cannot be installed the search
-- still returns correct results, just without the index on the fallback branch.
do $$ begin
  create extension if not exists pg_trgm;
exception when others then
  raise notice 'pg_trgm unavailable — substring search will work but will not be indexed';
end $$;

-- BOTH ILIKE branches of the search need an index. An OR branch that cannot be
-- indexed forces a sequential scan over the whole table regardless of how good
-- the other indexes are, so storage_key gets one too.
do $$ begin
  create index if not exists media_assets_title_trgm_idx
    on public.media_assets using gin (title gin_trgm_ops);
  create index if not exists media_assets_storage_key_trgm_idx
    on public.media_assets using gin (storage_key gin_trgm_ops);
exception when others then
  raise notice 'skipping trigram indexes (pg_trgm not installed)';
end $$;

-- ── 5. The query ────────────────────────────────────────────────────────────
-- Mirrors the 20260720140000_article_views_rpc.sql pattern. Search is full-text
-- first (ranked, stemmed, handles `mars -curiosity` and quoted phrases via
-- websearch_to_tsquery) with an ILIKE substring fallback so partial words and
-- raw storage keys still match.
--
-- Pagination is KEYSET on (created_at, id): O(limit) at page 500, unlike OFFSET.
--
-- Two rules keep these functions fast, both learned by reading EXPLAIN at 50k
-- rows rather than by inspection:
--
--   1. The body must be a single flat SELECT — no CTE, no cross join. A SQL
--      function shaped that way is INLINED into the caller, so the planner sees
--      the arguments as constants and can turn `search_vector @@ …` and the two
--      ILIKE branches into a BitmapOr across the GIN indexes. With the search
--      terms hidden behind a CTE the planner cannot push them into an index
--      condition and falls back to a sequential scan: 84 ms instead of 0.3 ms.
--
--   2. The row total lives in its own function. Returning it as
--      `count(*) over ()` beside the rows reads well but makes every page walk
--      the whole matching set — it turned a 48-row page into a 37,500-row scan
--      and cancelled out the keyset index scan. The API asks for the count
--      once, on the first page, in parallel with the search.
--
-- The two functions share one WHERE clause; they must be kept in step.

-- Escaped, wrapped LIKE pattern. Immutable and parameter-only, so it is folded
-- to a constant before planning; `%` typed into the search box stays literal.
create or replace function public.media_like_pattern(p_query text)
returns text
language sql
immutable
parallel safe
as $$
  select '%' || replace(replace(replace(
           btrim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;

create or replace function public.search_media_assets(
  p_query      text        default null,
  p_provider   text        default null,
  p_bucket     text        default null,
  p_tags       text[]      default null,
  p_collection uuid        default null,
  p_cursor_ts  timestamptz default null,
  p_cursor_id  uuid        default null,
  p_limit      int         default 48
)
returns table (
  id            uuid,
  provider      text,
  storage_key   text,
  bucket        text,
  file_url      text,
  thumb_url     text,
  title         text,
  slug          text,
  alt_text      text,
  caption       text,
  credit        text,
  tags          text[],
  collection_id uuid,
  width         int,
  height        int,
  file_size     bigint,
  file_type     text,
  created_at    timestamptz,
  usage_count   int
)
language sql
stable
as $$
  select
    a.id,
    a.provider::text,
    a.storage_key,
    a.bucket,
    a.file_url,
    a.thumb_url,
    a.title,
    a.slug,
    a.alt_text,
    a.caption,
    a.credit,
    a.tags,
    a.collection_id,
    a.width::int,
    a.height::int,
    a.file_size::bigint,
    a.file_type,
    a.created_at,
    a.usage_count::int
  from public.media_assets a
  where a.deleted_at is null
    and (
      nullif(btrim(coalesce(p_query, '')), '') is null
      or a.search_vector @@ websearch_to_tsquery('english'::regconfig, btrim(p_query))
      or a.title       ilike public.media_like_pattern(p_query)
      or a.storage_key ilike public.media_like_pattern(p_query)
    )
    -- The PARAMETER is cast to the enum, not the column: casting the column
    -- (`a.provider::text = p_provider`) makes it unindexable and throws away
    -- media_assets_scope_recent_idx.
    and (p_provider   is null or a.provider      = p_provider::media_provider)
    and (p_bucket     is null or a.bucket        = p_bucket)
    and (p_tags       is null or a.tags         @> p_tags)
    and (p_collection is null or a.collection_id = p_collection)
    and (
      p_cursor_ts is null
      or (a.created_at, a.id) < (p_cursor_ts, p_cursor_id)
    )
  order by a.created_at desc, a.id desc
  limit greatest(1, least(coalesce(p_limit, 48), 200));
$$;

comment on function public.search_media_assets is
  'Media Library search: weighted FTS + indexed ILIKE fallback, provider/bucket/tag/collection filters, keyset pagination on (created_at, id). Row total comes from count_media_assets. Body must stay a single flat SELECT so it can be inlined.';

-- Same filters, no cursor and no limit.
--
-- Returns a one-row TABLE rather than a bare bigint on purpose: a scalar SQL
-- function is never inlined, so it plans blind to its arguments and falls back
-- to a sequential scan (190 ms at 50k rows). Declared set-returning and called
-- from the FROM clause, it inlines like the search does and drops to ~1 ms.
-- `create or replace` cannot change a return type, so an earlier scalar-bigint
-- version of this function has to go first.
drop function if exists public.count_media_assets(text, text, text, text[], uuid);

create or replace function public.count_media_assets(
  p_query      text   default null,
  p_provider   text   default null,
  p_bucket     text   default null,
  p_tags       text[] default null,
  p_collection uuid   default null
)
returns table (total bigint)
language sql
stable
as $$
  select count(*)
  from public.media_assets a
  where a.deleted_at is null
    and (
      nullif(btrim(coalesce(p_query, '')), '') is null
      or a.search_vector @@ websearch_to_tsquery('english'::regconfig, btrim(p_query))
      or a.title       ilike public.media_like_pattern(p_query)
      or a.storage_key ilike public.media_like_pattern(p_query)
    )
    and (p_provider   is null or a.provider      = p_provider::media_provider)
    and (p_bucket     is null or a.bucket        = p_bucket)
    and (p_tags       is null or a.tags         @> p_tags)
    and (p_collection is null or a.collection_id = p_collection);
$$;

comment on function public.count_media_assets is
  'Row total for a search_media_assets query — same filters, no cursor. Kept in step with search_media_assets by hand.';

-- The app calls these with the service-role client, which bypasses RLS; the
-- grants are explicit so the functions are never accidentally left unreachable.
do $$ begin
  grant execute on function public.search_media_assets(
    text, text, text, text[], uuid, timestamptz, uuid, int
  ) to service_role;
  grant execute on function public.count_media_assets(
    text, text, text, text[], uuid
  ) to service_role;
exception when others then null;
end $$;
