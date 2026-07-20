-- Extends the EXISTING public.media_assets table so the admin Media Library can
-- track and DELETE assets stored in Cloudinary (and, later, Cloudflare R2)
-- alongside the table's existing rights metadata (title, file_url, copyright,
-- license, attribution_required, source_agency, editor_verified…).
--
-- This ALTERs the table that already exists in the project — it does NOT drop or
-- redefine your columns or data. RLS is intentionally left untouched (the app
-- reads/writes this table with the service-role client, which bypasses RLS).
-- Idempotent: safe to re-run.

do $$ begin
  create type media_provider as enum ('supabase', 'cloudinary', 'r2');
exception when duplicate_object then null;
end $$;

alter table public.media_assets
  add column if not exists provider    media_provider,
  add column if not exists storage_key text,   -- cloudinary public_id / r2 key (needed to delete)
  add column if not exists bucket      text,
  add column if not exists folder      text,
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null;

-- Categorize any pre-existing rows. Kept nullable on purpose so existing insert
-- paths (if any) are never broken; the app always sets provider on new rows.
update public.media_assets set provider = 'supabase' where provider is null;

-- One row per provider object; applies only once storage_key is set, so existing
-- manually-added rows (storage_key null) are unaffected.
create unique index if not exists media_assets_provider_key_uidx
  on public.media_assets (provider, storage_key)
  where storage_key is not null;

create index if not exists media_assets_provider_created_idx
  on public.media_assets (provider, created_at desc);
