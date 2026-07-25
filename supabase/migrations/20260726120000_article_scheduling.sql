-- Publishing Scheduler (Phase 2, Feature 4)
-- Additive columns for scheduling a future publish and an automatic expiry, plus
-- a Postgres-native cron (pg_cron) that performs the transitions — no external
-- cron needed (Vercel Hobby only allows daily crons). The articles.status enum
-- already includes 'scheduled'. Safe to run multiple times.

alter table if exists public.articles add column if not exists scheduled_at timestamptz;
alter table if exists public.articles add column if not exists expire_at    timestamptz;

-- Partial indexes keep the transition scans cheap even with many articles.
create index if not exists idx_articles_scheduled_at
  on public.articles (scheduled_at) where status = 'scheduled';
create index if not exists idx_articles_expire_at
  on public.articles (expire_at) where expire_at is not null;

-- The transition itself: promote due scheduled articles to published, and
-- archive published articles past their expiry. Callable from pg_cron below and
-- from the /api/cron/publish endpoint (manual "run now"). SECURITY DEFINER so
-- the scheduled job runs with the owner's rights regardless of the caller.
create or replace function public.run_scheduled_publishing()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.articles
     set status = 'published', published_at = now(), scheduled_at = null
   where status = 'scheduled' and scheduled_at is not null and scheduled_at <= now();

  update public.articles
     set status = 'archived'
   where status = 'published' and expire_at is not null and expire_at <= now();
end;
$fn$;

-- Schedule it every minute with pg_cron. Best-effort: if the extension can't be
-- enabled from a migration (permissions), the columns + function are still
-- created and this only raises a NOTICE — enable pg_cron in the Supabase
-- dashboard (Database → Extensions), then re-run this migration (or run the
-- cron.schedule call below manually).
do $setup$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'antariksham-scheduled-publishing',
    '* * * * *',
    $job$ select public.run_scheduled_publishing(); $job$
  );
exception when others then
  raise notice 'pg_cron not scheduled (%). Enable pg_cron in Supabase, then run: select cron.schedule(''antariksham-scheduled-publishing'', ''* * * * *'', $$select public.run_scheduled_publishing();$$);', sqlerrm;
end;
$setup$;
