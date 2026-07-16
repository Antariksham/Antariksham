-- =============================================================================
-- Seed 5 test articles — Antariksham (new Supabase project)
-- Paste straight into the Supabase Dashboard → SQL Editor → New query → Run.
--
-- Idempotent: re-running does nothing new (each block guards on slug/name).
-- Only the "ARTICLES" block is required for them to show on /news + homepage;
-- the AUTHOR / CATEGORIES / TAGS blocks are optional niceties.
-- =============================================================================

-- 1) AUTHOR (optional) — one shared test author -------------------------------
insert into public.authors (name, bio, featured)
select 'CosmosDaily Staff', 'Seed author used for local/testing content.', false
where not exists (select 1 from public.authors where name = 'CosmosDaily Staff');

-- 2) ARTICLES (required) ------------------------------------------------------
-- Exactly one is featured=true (matches the "single featured story" rule).
-- Images use picsum so they always resolve while testing.
insert into public.articles
  (title, slug, excerpt, content, featured_image, author_id,
   status, article_type, featured, reading_time, views, published_at)
select
  v.title, v.slug, v.excerpt, v.content, v.featured_image,
  (select id from public.authors where name = 'CosmosDaily Staff' limit 1),
  v.status, v.article_type, v.featured, v.reading_time, v.views, v.published_at
from (values
  (
    'James Webb Spots a Record-Breaking Distant Galaxy',
    'webb-record-breaking-galaxy',
    'JWST pushes the cosmic frontier again, imaging the most distant confirmed galaxy to date.',
    '<p>The James Webb Space Telescope has confirmed a galaxy whose light left it just a few hundred million years after the Big Bang.</p><p>Astronomers say the find reshapes models of how quickly the first galaxies assembled.</p>',
    'https://picsum.photos/seed/webb/1200/675',
    'published', 'analysis', true, 4, 214, now() - interval '1 day'
  ),
  (
    'NASA Sets New Date for Artemis II Crewed Flyby',
    'artemis-ii-new-date',
    'The first crewed mission around the Moon in over 50 years gets an updated launch window.',
    '<p>NASA has announced a revised target window for Artemis II, the first crewed flight of the Orion spacecraft around the Moon.</p><p>The mission is a precursor to a crewed landing later this decade.</p>',
    'https://picsum.photos/seed/artemis/1200/675',
    'published', 'mission-update', false, 3, 172, now() - interval '2 days'
  ),
  (
    'SpaceX Reuses a Booster for the 25th Time',
    'spacex-booster-25th-reuse',
    'A single Falcon 9 first stage notches a new reuse record on a Starlink flight.',
    '<p>SpaceX flew and recovered a Falcon 9 booster for the 25th time, extending its lead in reusable rocketry.</p><p>Rapid reuse continues to drive down the cost of access to orbit.</p>',
    'https://picsum.photos/seed/falcon/1200/675',
    'published', 'breaking-news', false, 2, 356, now() - interval '3 days'
  ),
  (
    'A Hidden Ocean World? New Clues from Europa',
    'europa-hidden-ocean-clues',
    'Fresh data hints at plumes venting from beneath Europa''s icy shell.',
    '<p>Scientists analysing archival and new observations report renewed evidence of water vapour plumes at Jupiter''s moon Europa.</p><p>The findings sharpen the case for a habitable subsurface ocean.</p>',
    'https://picsum.photos/seed/europa/1200/675',
    'published', 'explainer', false, 5, 98, now() - interval '4 days'
  ),
  (
    'How Ion Engines Quietly Power Deep-Space Missions',
    'how-ion-engines-work',
    'The unglamorous thrusters that push probes across the solar system, explained.',
    '<p>Ion propulsion produces tiny thrust but runs for months, letting spacecraft reach velocities chemical rockets cannot match efficiently.</p><p>We break down how they work and why they matter.</p>',
    'https://picsum.photos/seed/ion/1200/675',
    'published', 'guide', false, 6, 61, now() - interval '5 days'
  )
) as v(title, slug, excerpt, content, featured_image,
       status, article_type, featured, reading_time, views, published_at)
where not exists (select 1 from public.articles a where a.slug = v.slug);

-- 3) CATEGORIES (optional) — link each article to an existing category --------
-- No-op if your categories use different names/slugs (the JOIN just matches none).
insert into public.article_categories (article_id, category_id)
select a.id, c.id
from (values
  ('webb-record-breaking-galaxy', 'astronomy'),
  ('artemis-ii-new-date',         'nasa'),
  ('spacex-booster-25th-reuse',   'spacex'),
  ('europa-hidden-ocean-clues',   'discoveries'),
  ('how-ion-engines-work',        'technology')
) as m(art_slug, cat_key)
join public.articles   a on a.slug = m.art_slug
join public.categories c on c.slug = m.cat_key or lower(c.name) = m.cat_key
where not exists (
  select 1 from public.article_categories ac
  where ac.article_id = a.id and ac.category_id = c.id
);

-- 4) TAGS (optional) — create a few tags and attach them ----------------------
insert into public.tags (name, slug)
select x.name, x.slug
from (values
  ('JWST','jwst'), ('Artemis','artemis'), ('Falcon 9','falcon-9'),
  ('Europa','europa'), ('Propulsion','propulsion')
) as x(name, slug)
where not exists (select 1 from public.tags t where t.slug = x.slug);

insert into public.article_tags (article_id, tag_id)
select a.id, t.id
from (values
  ('webb-record-breaking-galaxy', 'jwst'),
  ('artemis-ii-new-date',         'artemis'),
  ('spacex-booster-25th-reuse',   'falcon-9'),
  ('europa-hidden-ocean-clues',   'europa'),
  ('how-ion-engines-work',        'propulsion')
) as m(art_slug, tag_slug)
join public.articles a on a.slug = m.art_slug
join public.tags     t on t.slug = m.tag_slug
where not exists (
  select 1 from public.article_tags at2
  where at2.article_id = a.id and at2.tag_id = t.id
);

-- 5) Confirm what landed ------------------------------------------------------
select title, slug, status, featured, published_at
from public.articles
order by published_at desc
limit 5;
