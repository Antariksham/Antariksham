-- Analytics Dashboard (Phase 2, Feature 5)
-- Privacy-friendly page-event collection. No PII: `visitor` is an opaque,
-- browser-generated id (localStorage), `session` a per-visit id; referrer is
-- reduced to a host + a coarse type, device to mobile/tablet/desktop, location
-- to an ISO-2 country only. Rows are written by the /api/analytics/collect
-- endpoint (service role) and read only by the admin dashboard (service role).
-- Safe to run multiple times.

create table if not exists public.article_events (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles (id) on delete cascade,
  type       text not null check (type in ('view', 'read', 'share', 'bookmark')),
  visitor    text,
  session    text,
  device     text,
  ref_type   text,
  referrer   text,
  country    text,
  scroll_pct int  default 0,
  dwell_ms   int  default 0,
  path       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_article_events_created on public.article_events (created_at desc);
create index if not exists idx_article_events_article on public.article_events (article_id);
create index if not exists idx_article_events_type    on public.article_events (type);

-- Lock it down: only the service role (server) reads/writes; no public policies.
alter table public.article_events enable row level security;
