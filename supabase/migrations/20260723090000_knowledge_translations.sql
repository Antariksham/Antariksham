-- Knowledge (Learn) article translations — same model as article_translations.
--
-- English lives in `knowledge_articles`; this table holds every OTHER language's
-- translated text (title/excerpt/content), keyed to the same knowledge article
-- (same slug, same shared metadata). Untranslated Learn articles fall back to
-- English. Adding a language = new rows, no schema change.
--
-- RLS: public read of PUBLISHED translations only; no anon writes (the admin CMS
-- writes with the service-role key, which bypasses RLS).
--
-- Idempotent: safe to re-run.

create table if not exists public.knowledge_translations (
  id                   uuid primary key default gen_random_uuid(),
  knowledge_article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  language_code        text not null check (language_code <> 'en'),
  title                text not null,
  excerpt              text,
  content              text,
  is_published         boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (knowledge_article_id, language_code)
);

create index if not exists knowledge_translations_lookup_idx
  on public.knowledge_translations (knowledge_article_id, language_code, is_published);

alter table public.knowledge_translations enable row level security;

drop policy if exists "public reads knowledge_translations" on public.knowledge_translations;
create policy "public reads knowledge_translations" on public.knowledge_translations
  for select to anon, authenticated using (is_published = true);
