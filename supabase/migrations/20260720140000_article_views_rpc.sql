-- increment_article_views — bump an article's view count without giving the
-- public anon key write access to the articles table.
--
-- The public reader (anon key, embedded in the browser bundle) must NOT be able
-- to UPDATE articles directly. This SECURITY DEFINER function runs with the
-- owner's rights and does exactly one thing — +1 to views for one id — so anon
-- can call it safely while every other write stays blocked by RLS.
--
-- Idempotent: safe to re-run.

create or replace function public.increment_article_views(article_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
     set views = coalesce(views, 0) + 1
   where id = article_id;
$$;

revoke all    on function public.increment_article_views(uuid) from public;
grant  execute on function public.increment_article_views(uuid) to anon, authenticated;
