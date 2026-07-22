-- Add a URL slug to authors so they get a public profile page at /authors/:slug.
--
-- Backfills existing rows from the name (falls back to the id for names that
-- slugify to empty, e.g. non-latin). Idempotent.
--
-- NOTE: the unique index fails if two authors slugify to the same value. Authors
-- are few and names are normally distinct; if it fails, disambiguate one slug
-- (e.g. append a suffix) and re-run.

alter table public.authors add column if not exists slug text;

update public.authors
   set slug = nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '')
 where slug is null or slug = '';

update public.authors
   set slug = id::text
 where slug is null or slug = '';

create unique index if not exists authors_slug_key on public.authors (slug);
