-- Row-Level Security for public-facing tables.
--
-- WHY: the public site reads through NEXT_PUBLIC_SUPABASE_ANON_KEY, which ships
-- in the browser bundle. RLS is therefore the ONLY thing stopping anyone with
-- that key from reading/writing your database directly via the Supabase REST
-- API. This enables RLS and adds anon/authenticated SELECT policies that match
-- exactly what the public site reads — and NO write policies, so the anon key
-- can never INSERT/UPDATE/DELETE.
--
-- The admin CMS uses the service-role key, which BYPASSES RLS, so admin CRUD is
-- unaffected. `increment_article_views` is SECURITY DEFINER, so the view
-- counter works without an anon UPDATE policy.
--
-- ⚠️ TEST THIS. Apply on a Supabase branch/staging first, then load the public
-- site — home, an /articles/:slug page (author + categories + tags), /missions,
-- /learn. If a section is blank, that table's SELECT policy is missing/too
-- strict. Idempotent: safe to re-run.

-- ── articles: only published rows are public ──────────────────────────────────
alter table public.articles enable row level security;
drop policy if exists "public reads published articles" on public.articles;
create policy "public reads published articles" on public.articles
  for select to anon, authenticated using (status = 'published');

-- ── missions + knowledge: all rows are public ─────────────────────────────────
alter table public.missions enable row level security;
drop policy if exists "public reads missions" on public.missions;
create policy "public reads missions" on public.missions
  for select to anon, authenticated using (true);

alter table public.knowledge_articles enable row level security;
drop policy if exists "public reads knowledge" on public.knowledge_articles;
create policy "public reads knowledge" on public.knowledge_articles
  for select to anon, authenticated using (true);

-- ── reference / join tables embedded in the reads above (all public data) ─────
do $$
declare t text;
begin
  foreach t in array array[
    'authors', 'categories', 'tags', 'space_agencies',
    'article_categories', 'article_tags', 'seo_metadata', 'homepage_sections'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "public reads %1$s" on public.%1$I;', t);
    execute format($f$create policy "public reads %1$s" on public.%1$I
                     for select to anon, authenticated using (true);$f$, t);
  end loop;
end $$;

-- ── media_assets: admin/service-role only — enable RLS, add NO anon policy ────
-- Locked to the public. If you later render media_assets fields on a PUBLIC page
-- via the anon key, add a matching SELECT policy here.
alter table public.media_assets enable row level security;

-- NOTE: no INSERT / UPDATE / DELETE policies are defined anywhere above — that
-- is deliberate. It blocks all writes from the anon key. Do not add write
-- policies unless you intend the public to write to that table.
