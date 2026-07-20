-- media_assets — unified tracker for media stored outside Supabase Storage.
--
-- The existing Media Library lists Supabase Storage buckets directly, so the
-- Supabase tab needs no table. Cloudinary (and, later, Cloudflare R2) do: we
-- must persist each object's provider identity (public_id / key) to be able to
-- list and delete it. This table is that record.
--
-- The enum intentionally includes 'r2' now even though R2 isn't wired up yet —
-- adding an enum value later requires ALTER TYPE ... ADD VALUE (which can't run
-- inside a transaction on older Postgres), so we reserve the slot up front.
--
-- Idempotent: safe to run more than once.

do $$ begin
  create type media_provider as enum ('supabase', 'cloudinary', 'r2');
exception when duplicate_object then null;
end $$;

create table if not exists public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  provider    media_provider not null,
  -- Identity used to DELETE from the provider:
  --   cloudinary -> public_id,  r2 -> object key,  supabase -> storage path
  storage_key text not null,
  bucket      text,                         -- r2/supabase bucket (null for cloudinary)
  url         text not null,                -- delivery/public URL to render + copy
  filename    text,
  mime_type   text,
  size_bytes  bigint,
  width       int,
  height      int,
  folder      text,                         -- logical group e.g. 'deep-sky'
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (provider, storage_key)
);

comment on table public.media_assets is
  'Tracks media stored in Cloudinary / R2 so the admin Media Library can list and delete it. Supabase Storage is listed directly and is not tracked here.';

-- All reads/writes go through the service-role client inside Server Actions,
-- which bypasses RLS — so no permissive policy is needed (and none is safe to
-- add unless this table is later queried from the browser).
alter table public.media_assets enable row level security;

create index if not exists media_assets_provider_created_idx
  on public.media_assets (provider, created_at desc);
