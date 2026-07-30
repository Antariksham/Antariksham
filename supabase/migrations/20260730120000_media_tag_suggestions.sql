-- Media Library Phase 4 — tag autocomplete.
--
-- The upload dialog suggests tags that already exist so the vocabulary stays
-- one spelling per subject: `isro`, not isro/ISRO/Isro spread across three
-- filters nobody can use.
--
-- PostgREST cannot express `unnest` + `group by` through the REST select
-- syntax, so this is a function. Idempotent: safe to re-run.

create or replace function public.media_tag_suggestions(
  p_prefix   text default null,
  p_provider text default null,
  p_limit    int  default 12
)
returns table (tag text, uses bigint)
language sql
stable
as $$
  select t.tag, count(*) as uses
  from public.media_assets a
  cross join lateral unnest(a.tags) as t(tag)
  where a.deleted_at is null
    and (p_provider is null or a.provider = p_provider::media_provider)
    and (
      nullif(btrim(coalesce(p_prefix, '')), '') is null
      or t.tag like lower(
           replace(replace(replace(btrim(p_prefix), '\', '\\'), '%', '\%'), '_', '\_')
         ) || '%'
    )
  group by t.tag
  order by count(*) desc, t.tag asc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

comment on function public.media_tag_suggestions is
  'Existing media tags matching a prefix, most-used first. Powers tag autocomplete in the upload dialog.';

do $$ begin
  grant execute on function public.media_tag_suggestions(text, text, int) to service_role;
exception when others then null;
end $$;
