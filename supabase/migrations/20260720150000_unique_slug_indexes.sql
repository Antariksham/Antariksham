-- Unique slug indexes — the database's final guard against duplicate slugs.
--
-- The admin app already pre-checks slugs before saving (see
-- modules/admin/services/adminErrors.ts), but that has a small race window.
-- These unique indexes make the database the ultimate authority, and let the
-- app map the resulting 23505 error to a friendly "slug already in use" message.
--
-- ⚠️ This FAILS if duplicate slugs already exist. Check FIRST:
--
--   select slug, count(*) from public.articles           group by slug having count(*) > 1;
--   select slug, count(*) from public.missions           group by slug having count(*) > 1;
--   select slug, count(*) from public.knowledge_articles group by slug having count(*) > 1;
--
-- Resolve any duplicates in the admin (rename the older one's slug), then run this.

create unique index if not exists articles_slug_key            on public.articles           (slug);
create unique index if not exists missions_slug_key            on public.missions           (slug);
create unique index if not exists knowledge_articles_slug_key  on public.knowledge_articles (slug);
