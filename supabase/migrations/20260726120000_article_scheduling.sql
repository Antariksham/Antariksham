-- Publishing Scheduler (Phase 2, Feature 4)
-- Additive columns for scheduling a future publish and an automatic expiry.
-- The articles.status enum already includes 'scheduled'. The
-- /api/cron/publish endpoint (run by Vercel Cron — see vercel.json) promotes
-- due scheduled articles to 'published' and archives expired ones. Safe to run
-- multiple times.

alter table if exists public.articles add column if not exists scheduled_at timestamptz;
alter table if exists public.articles add column if not exists expire_at    timestamptz;

-- Partial indexes keep the cron's due-now scans cheap even with many articles.
create index if not exists idx_articles_scheduled_at
  on public.articles (scheduled_at) where status = 'scheduled';
create index if not exists idx_articles_expire_at
  on public.articles (expire_at) where expire_at is not null;
