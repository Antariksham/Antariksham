-- admin_users — who may access the /admin CMS, and in what role.
--
-- Admin auth moved from a single shared password to Supabase Auth. A person can
-- reach /admin only if (a) they are a Supabase Auth user AND (b) they have an
-- active row here. `role` defaults to 'admin' and exists so team roles
-- (editor, etc.) can be added later without a schema change.
--
-- Idempotent: safe to run more than once.

create table if not exists public.admin_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text        not null default 'admin',
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Grants /admin CMS access to Supabase Auth users. role is the hook for future team roles.';

-- Lock the table down. The app checks membership with the service-role key
-- (which bypasses RLS), so no permissive policy is required for that path. The
-- self-select policy below just lets a signed-in user read their own row.
alter table public.admin_users enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_users'
      and policyname = 'admin_users_self_select'
  ) then
    create policy admin_users_self_select
      on public.admin_users
      for select
      using (auth.uid() = id);
  end if;
end $$;

-- ── Bootstrap the first admin (run manually, ONCE) ────────────────────────────
-- After you create your login in the Supabase dashboard (Authentication → Users,
-- or an invite), grant yourself access by running this with your own email:
--
--   insert into public.admin_users (id, email)
--   select id, email from auth.users where email = 'you@example.com'
--   on conflict (id) do update set is_active = true;
--
-- Add teammates the same way. Revoke access with:
--   update public.admin_users set is_active = false where email = 'them@example.com';
