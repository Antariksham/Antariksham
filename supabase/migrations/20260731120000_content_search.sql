-- ─────────────────────────────────────────────────────────────────────────────
-- Full-text search for public content: articles, knowledge_articles, missions.
--
-- Replaces an ILIKE '%q%' scan over title + excerpt only. That had four
-- problems this fixes: article BODIES were never searched, results were ordered
-- by date rather than relevance, a leading wildcard could not use an index, and
-- the query string was interpolated straight into a PostgREST filter.
--
-- Same shape as 20260729120000_media_library_index.sql, which is already proven
-- on this database: a weighted generated tsvector, a GIN index over it, and
-- pg_trgm for the fuzzy fallback.
--
-- Additive and idempotent. Nothing is dropped, no existing column changes, and
-- the application falls back to the old query path if this has not been run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create extension if not exists pg_trgm;
exception when insufficient_privilege then
  raise notice 'pg_trgm not enabled (insufficient privilege) — enable it in Supabase → Database → Extensions and re-run; fuzzy/typo matching stays off until then';
end $$;

-- ── 1. Generated search vectors ──────────────────────────────────────────────
--
-- The explicit ::regconfig cast picks the two-argument, IMMUTABLE to_tsvector.
-- The one-argument form depends on default_text_search_config and is only
-- STABLE, which a generated column rejects.
--
-- Article and knowledge bodies are HTML, so tags are stripped before indexing —
-- otherwise every article matches "div" and "href". regexp_replace is immutable,
-- so it is legal inside a generated column.
--
-- Weights: A title, B excerpt, C body. ts_rank_cd then puts a headline match
-- above a passing mention in paragraph forty.

alter table public.articles
  add column if not exists search_vector tsvector
  generated always as (
       setweight(to_tsvector('english'::regconfig, coalesce(title,   '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B')
    || setweight(to_tsvector('english'::regconfig,
         regexp_replace(coalesce(content, ''), '<[^>]*>', ' ', 'g')), 'C')
  ) stored;

alter table public.knowledge_articles
  add column if not exists search_vector tsvector
  generated always as (
       setweight(to_tsvector('english'::regconfig, coalesce(title,   '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(excerpt, '')), 'B')
    || setweight(to_tsvector('english'::regconfig,
         regexp_replace(coalesce(content, ''), '<[^>]*>', ' ', 'g')), 'C')
  ) stored;

-- Missions carry their prose in description; name is the headline field.
-- destination and mission_type are short but highly searched ("Mars", "rover").
alter table public.missions
  add column if not exists search_vector tsvector
  generated always as (
       setweight(to_tsvector('english'::regconfig, coalesce(name,        '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(destination, '')), 'B')
    || setweight(to_tsvector('english'::regconfig, coalesce(mission_type,'')), 'B')
    || setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'C')
  ) stored;

-- ── 2. Indexes ───────────────────────────────────────────────────────────────

create index if not exists articles_search_vector_idx
  on public.articles using gin (search_vector);
create index if not exists knowledge_search_vector_idx
  on public.knowledge_articles using gin (search_vector);
create index if not exists missions_search_vector_idx
  on public.missions using gin (search_vector);

-- Trigram indexes back the typo fallback in search_content(). Guarded because
-- they are unusable — and CREATE INDEX fails — without pg_trgm.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists articles_title_trgm_idx
      on public.articles using gin (title gin_trgm_ops);
    create index if not exists knowledge_title_trgm_idx
      on public.knowledge_articles using gin (title gin_trgm_ops);
    create index if not exists missions_name_trgm_idx
      on public.missions using gin (name gin_trgm_ops);
  end if;
end $$;

-- ── 3. The search function ───────────────────────────────────────────────────
--
-- One round trip for all three content types, ranked together so the best match
-- wins regardless of which table it came from. The caller groups the rows.
--
-- websearch_to_tsquery is the whole reason the injection problem disappears:
-- the query arrives as a bound parameter, never as SQL text. It also never
-- raises on malformed input — unlike to_tsquery, which throws on a bare "&" —
-- and it understands quoted phrases, OR, and leading - for exclusion.
--
-- Deliberately NOT security definer: it runs as the caller so row-level security
-- still applies, and unpublished rows stay invisible even if the filters below
-- were ever wrong.

create or replace function public.search_content(
  q           text,
  max_results int default 30
)
returns table (
  kind    text,
  id      text,
  slug    text,
  title   text,
  excerpt text,
  rank    real,
  extra   jsonb
)
language sql
stable
set search_path = public
as $$
  with parsed as (
    select
      websearch_to_tsquery('english', q) as tsq,
      -- Trigram similarity is only consulted when the query is a single word;
      -- on a phrase it produces noise rather than typo tolerance.
      case when q ~ '^\s*\S+\s*$' then btrim(q) else null end as one_word
  ),
  hits as (
    select
      'article'::text as kind,
      a.id::text,
      a.slug,
      a.title,
      a.excerpt,
      ts_rank_cd(a.search_vector, p.tsq) as rank,
      jsonb_build_object(
        'articleType', a.article_type,
        'publishedAt', a.published_at,
        'readingTime', a.reading_time,
        'category',    (select c.name
                          from article_categories ac
                          join categories c on c.id = ac.category_id
                         where ac.article_id = a.id
                         limit 1)
      ) as extra
      from articles a, parsed p
     where a.status = 'published'
       and a.search_vector @@ p.tsq

    union all

    select
      'mission'::text,
      m.id::text,
      m.slug,
      m.name,
      m.description,
      ts_rank_cd(m.search_vector, p.tsq),
      jsonb_build_object(
        'status',      m.status,
        'missionType', m.mission_type,
        'destination', m.destination,
        'agency',      (select sa.short_name
                          from space_agencies sa
                         where sa.id = m.agency_id)
      )
      from missions m, parsed p
     where m.search_vector @@ p.tsq

    union all

    select
      'learn'::text,
      k.id::text,
      k.slug,
      k.title,
      k.excerpt,
      ts_rank_cd(k.search_vector, p.tsq),
      jsonb_build_object(
        'difficultyLevel', k.difficulty_level,
        'icon',            k.icon
      )
      from knowledge_articles k, parsed p
     where k.search_vector @@ p.tsq
  )
  select kind, id, slug, title, excerpt, rank, extra
    from hits
   order by rank desc, title asc
   limit greatest(1, least(max_results, 100));
$$;

comment on function public.search_content(text, int) is
  'Ranked full-text search across published articles, missions and knowledge articles. Query is parsed by websearch_to_tsquery, so it is bound input rather than SQL text.';

-- ── Measured on 50,003 articles (Postgres 16, cold-ish cache, 30 runs) ───────
--
--   selective  ("heat shield",  2 matches)  → 0.57 ms
--   none       ("Perseverance", 0 matches)  → 0.41 ms
--   broad      ("Lunar",   10,000 matches)  → 37 ms
--   pathologic ("telemetry", 50,000 = all)  → 166 ms
--
-- Cost tracks the number of MATCHED rows at roughly 3.3 µs each, not the size of
-- the table: the GIN index finds the matches quickly (0.13 ms for the index scan
-- itself), then every match must be scored by ts_rank_cd and sorted before the
-- LIMIT can apply. That is inherent to ordering by relevance — capping the
-- candidate set first would be fast but would silently return something other
-- than the best matches, which is worse than being slow.
--
-- Not a problem at the corpus sizes this site will see for a long time (a common
-- term across a few thousand articles is single-digit milliseconds). Revisit if
-- a common query starts matching more than ~15,000 rows: the options then are a
-- RUM index (orders by rank inside the index, but needs the extension) or moving
-- search to a dedicated engine. Do not "fix" it by truncating candidates.
--
-- Note also that `set search_path` above prevents this function from being
-- inlined into the calling query, so plans show a bare "Function Scan". That is
-- accepted deliberately — the pinned search_path is worth more than the inlining
-- here, and the index is still used inside (verified with EXPLAIN on the body).

-- ── 4. Fuzzy fallback for a single misspelt word ─────────────────────────────
--
-- Split out rather than folded into search_content: mixing a similarity scan
-- into the main query would cost a trigram lookup on every successful search,
-- and the caller only needs this when full-text found nothing at all.

create or replace function public.search_content_fuzzy(
  q           text,
  max_results int default 10
)
returns table (
  kind  text,
  id    text,
  slug  text,
  title text,
  sim   real
)
language sql
stable
set search_path = public
as $$
  -- word_similarity (<%), not similarity (%). similarity() compares the query
  -- against the WHOLE title, so a short misspelt word scored against a long
  -- headline falls under the threshold and matches nothing — "Starshp" never
  -- found "Starship Completes Orbital Flight". word_similarity scores the query
  -- against the best-matching word inside the title, which is the actual
  -- question being asked. Operand order matters: query first, haystack second.
  select * from (
    select 'article'::text, a.id::text, a.slug, a.title, word_similarity(q, a.title) as sim
      from articles a where a.status = 'published' and q <% a.title
    union all
    select 'mission'::text, m.id::text, m.slug, m.name, word_similarity(q, m.name)
      from missions m where q <% m.name
    union all
    select 'learn'::text, k.id::text, k.slug, k.title, word_similarity(q, k.title)
      from knowledge_articles k where q <% k.title
  ) s(kind, id, slug, title, sim)
  order by sim desc
  limit greatest(1, least(max_results, 50));
$$;

comment on function public.search_content_fuzzy(text, int) is
  'Trigram "did you mean" fallback, for when search_content returns nothing. Requires pg_trgm.';
