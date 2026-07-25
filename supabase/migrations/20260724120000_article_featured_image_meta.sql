-- Featured image metadata (newsroom-grade attribution + focal point).
-- Additive + nullable, so existing articles and code paths keep working before
-- and after it is applied. Shape (all keys optional):
--   { alt, caption, credit, photographer, organization, sourceUrl,
--     license, copyright, focalX, focalY }
-- The admin editor writes it; the public reader uses alt/caption/credit/focal.
-- Both read paths fall back gracefully when this column is absent.

alter table public.articles
  add column if not exists featured_image_meta jsonb;

comment on column public.articles.featured_image_meta is
  'Optional featured-image metadata: alt, caption, credit, photographer, organization, sourceUrl, license, copyright, focalX, focalY.';
