-- Mission translations — same model as article_translations.
--
-- English lives in `missions`; this table holds every OTHER language's
-- translated `name` + `description`, keyed to the same mission (same slug,
-- same shared metadata: agency, status, dates, timeline). Untranslated missions
-- fall back to English. Adding a language = new rows, no schema change.
--
-- NOTE: the mission `timeline` (structured JSON) stays shared/English for now —
-- only name + description are translated. Translating timeline entries can be
-- added later without a schema change to this table (it would be a separate
-- concern on the missions row itself).
--
-- RLS: public read of PUBLISHED translations only; no anon writes.
-- Idempotent: safe to re-run.

create table if not exists public.mission_translations (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references public.missions (id) on delete cascade,
  language_code text not null check (language_code <> 'en'),
  name          text not null,
  description   text,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (mission_id, language_code)
);

create index if not exists mission_translations_lookup_idx
  on public.mission_translations (mission_id, language_code, is_published);

alter table public.mission_translations enable row level security;

drop policy if exists "public reads mission_translations" on public.mission_translations;
create policy "public reads mission_translations" on public.mission_translations
  for select to anon, authenticated using (is_published = true);
