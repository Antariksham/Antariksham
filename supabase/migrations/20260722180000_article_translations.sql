-- Article translations — bilingual (and beyond) articles WITHOUT duplicating them.
--
-- MODEL: English is the default and lives in `public.articles` (title, excerpt,
-- content) alongside every SHARED field — slug, author, categories, tags,
-- featured_image, status, published_at, and crucially `views`. This table holds
-- ONLY the translated text for every OTHER language, keyed to the same article.
--
-- WHY THIS SHAPE:
--   • One article, one URL slug, one row of shared metadata. A translation is a
--     language layer, never a separate article.
--   • VIEW COUNT STAYS COMBINED FOR FREE. The Hindi page still calls
--     increment_article_views(article_id) on the SAME id, so `articles.views`
--     is a single shared counter across every language. No RPC change needed.
--   • Adding Tamil/Bengali/… later = new rows with a new language_code. No
--     schema change.
--
-- SECURITY: RLS on, public read-only, and ONLY published translations are
-- exposed to the anon key. No anon write policy — the admin CMS writes with the
-- service-role key (which bypasses RLS). Mirrors the pattern used across the
-- other public tables.
--
-- Idempotent: safe to re-run.

create table if not exists public.article_translations (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid not null references public.articles (id) on delete cascade,
  language_code  text not null check (language_code <> 'en'),  -- 'en' lives in articles
  title          text not null,
  excerpt        text,
  content        text,
  is_published   boolean not null default false,               -- hide half-written drafts
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (article_id, language_code)
);

-- Fast lookup for the reader (fetch a specific published language for an article)
create index if not exists article_translations_lookup_idx
  on public.article_translations (article_id, language_code, is_published);

-- ── RLS: public reads published translations only; no anon writes ─────────────
alter table public.article_translations enable row level security;

drop policy if exists "public reads article_translations" on public.article_translations;
create policy "public reads article_translations" on public.article_translations
  for select to anon, authenticated using (is_published = true);

-- NOTE: no INSERT / UPDATE / DELETE policy — deliberate. Translations are
-- written by the admin CMS through the service-role key, which bypasses RLS.
