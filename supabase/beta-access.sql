-- ============================================================================
-- Yuval Fit OS — Beta Access System schema (Phase 3.xx)
-- ----------------------------------------------------------------------------
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query) for
-- your project. It creates the approved-users and admins tables, the row-level
-- security (RLS) policies that enforce access, an updated_at trigger, and a
-- SECURITY DEFINER function for best-effort "last seen" tracking.
--
-- SECURITY MODEL
--   * The browser uses only the PUBLIC anon key. Real protection comes from the
--     policies below, evaluated by Postgres on every request.
--   * A regular signed-in user can read ONLY their own approved-users row and
--     can confirm ONLY their own admin status. They cannot list other users,
--     cannot change any status, and cannot read the email of anyone else.
--   * An admin (an email present in beta_admins) can read and manage every row
--     in beta_allowed_users.
--   * The authenticated email is taken from the JWT (auth.jwt() ->> 'email'),
--     never from client input, so it cannot be spoofed.
--
-- This system controls BETA ACCESS ONLY. No workout / nutrition / water /
-- supplement / gym data is stored here — that all stays in each device's
-- localStorage until a future cloud-sync phase.
-- ============================================================================

-- Needed for gen_random_uuid().
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Helper: normalize an email (trim + lowercase). Used by defaults/constraints.
-- ----------------------------------------------------------------------------
create or replace function public.normalize_email(addr text)
returns text
language sql
immutable
as $$
  select lower(btrim(coalesce(addr, '')));
$$;

-- ----------------------------------------------------------------------------
-- Helper: the authenticated user's normalized email, from the JWT.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select public.normalize_email(auth.jwt() ->> 'email');
$$;

-- ----------------------------------------------------------------------------
-- Table: beta_admins — who may manage the beta.
-- IMPORTANT: This table must exist before public.is_beta_admin() is created,
-- because that function reads from public.beta_admins.
-- ----------------------------------------------------------------------------
create table if not exists public.beta_admins (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- Keep admin emails normalized.
create or replace function public.beta_admins_normalize()
returns trigger
language plpgsql
as $$
begin
  new.email := public.normalize_email(new.email);
  return new;
end;
$$;

drop trigger if exists trg_beta_admins_normalize on public.beta_admins;

create trigger trg_beta_admins_normalize
  before insert or update on public.beta_admins
  for each row execute function public.beta_admins_normalize();

-- ----------------------------------------------------------------------------
-- Helper: is the current user an admin? SECURITY DEFINER so that policies on
-- beta_allowed_users can consult beta_admins without recursing through its RLS.
-- ----------------------------------------------------------------------------
create or replace function public.is_beta_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.beta_admins a
    where a.email = public.current_user_email()
  );
$$;

-- ----------------------------------------------------------------------------
-- Table: beta_allowed_users — the approved beta users.
-- ----------------------------------------------------------------------------
create table if not exists public.beta_allowed_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  status        text not null default 'active'
                  check (status in ('active', 'blocked')),
  display_name  text,
  notes         text,
  added_by      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

-- Fast lookups by normalized email (the gate's hot path).
create unique index if not exists beta_allowed_users_email_idx
  on public.beta_allowed_users (email);

-- Normalize email + maintain updated_at on every write.
create or replace function public.beta_allowed_users_touch()
returns trigger
language plpgsql
as $$
begin
  new.email := public.normalize_email(new.email);

  if new.added_by is not null then
    new.added_by := public.normalize_email(new.added_by);
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists trg_beta_allowed_users_touch on public.beta_allowed_users;

create trigger trg_beta_allowed_users_touch
  before insert or update on public.beta_allowed_users
  for each row execute function public.beta_allowed_users_touch();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.beta_admins enable row level security;
alter table public.beta_allowed_users enable row level security;

-- --- beta_admins policies ---------------------------------------------------
-- A user may read ONLY their own admin row (to confirm they are an admin).
-- Nobody manages beta_admins from the client — add admins via SQL.
drop policy if exists "read own admin row" on public.beta_admins;

create policy "read own admin row"
  on public.beta_admins
  for select
  to authenticated
  using (email = public.current_user_email());

-- --- beta_allowed_users policies --------------------------------------------

-- 1) A user may read ONLY their own approved-users row (the access check).
drop policy if exists "read own allowed row" on public.beta_allowed_users;

create policy "read own allowed row"
  on public.beta_allowed_users
  for select
  to authenticated
  using (email = public.current_user_email());

-- 2) Admins may read every row.
drop policy if exists "admins read all" on public.beta_allowed_users;

create policy "admins read all"
  on public.beta_allowed_users
  for select
  to authenticated
  using (public.is_beta_admin());

-- 3) Admins may add approved users.
drop policy if exists "admins insert" on public.beta_allowed_users;

create policy "admins insert"
  on public.beta_allowed_users
  for insert
  to authenticated
  with check (public.is_beta_admin());

-- 4) Admins may update any row (block / reactivate / edit).
drop policy if exists "admins update" on public.beta_allowed_users;

create policy "admins update"
  on public.beta_allowed_users
  for update
  to authenticated
  using (public.is_beta_admin())
  with check (public.is_beta_admin());

-- 5) Admins may remove rows.
drop policy if exists "admins delete" on public.beta_allowed_users;

create policy "admins delete"
  on public.beta_allowed_users
  for delete
  to authenticated
  using (public.is_beta_admin());

-- NOTE: regular users intentionally have NO update/delete policy. This is what
-- prevents a user from un-blocking or self-approving their own row. The only
-- thing they can change is last_seen_at, and only through the function below.

-- ----------------------------------------------------------------------------
-- Best-effort "last seen" stamp. SECURITY DEFINER so a user can update only the
-- last_seen_at of their own row without holding a broad UPDATE policy (which
-- would otherwise let them edit their own status). Updates nothing if the user
-- has no approved row.
-- ----------------------------------------------------------------------------
create or replace function public.touch_beta_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.beta_allowed_users
    set last_seen_at = now()
    where email = public.current_user_email();
end;
$$;

grant execute on function public.touch_beta_last_seen() to authenticated;

-- ============================================================================
-- ACCESS REQUESTS (Phase 3.xx — request access + admin approvals)
-- ----------------------------------------------------------------------------
-- A REQUEST QUEUE only. `beta_allowed_users` remains the single source of truth
-- for entering the app — a row here NEVER grants access by itself. An
-- unapproved signed-in user can file a request; an admin then approves it
-- (which writes an active row into beta_allowed_users) or rejects it.
--
-- SECURITY MODEL
--   * A signed-in user can read ONLY their own request and may INSERT only a
--     request for their own email AND only with status 'pending'. They have NO
--     update/delete policy, so they can never flip their own request to
--     'approved' — and even if they could, it would change nothing, because the
--     gate reads beta_allowed_users, not this table.
--   * Admins can read every request and delete requests. Status changes happen
--     ONLY through the SECURITY DEFINER RPCs below, which re-check is_beta_admin()
--     server-side — so a non-admin cannot approve anyone (including themselves).
-- ============================================================================

create table if not exists public.beta_access_requests (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  display_name  text,
  provider      text,
  notes         text,
  requested_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   text
);

-- Fast lookups by normalized email + filtering the pending queue.
create unique index if not exists beta_access_requests_email_idx
  on public.beta_access_requests (email);
create index if not exists beta_access_requests_status_idx
  on public.beta_access_requests (status);

-- Normalize email/reviewed_by + maintain updated_at on every write.
create or replace function public.beta_access_requests_touch()
returns trigger
language plpgsql
as $$
begin
  new.email := public.normalize_email(new.email);

  if new.reviewed_by is not null then
    new.reviewed_by := public.normalize_email(new.reviewed_by);
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists trg_beta_access_requests_touch on public.beta_access_requests;

create trigger trg_beta_access_requests_touch
  before insert or update on public.beta_access_requests
  for each row execute function public.beta_access_requests_touch();

alter table public.beta_access_requests enable row level security;

-- 1) A user may read ONLY their own request (to show pending/rejected state).
drop policy if exists "read own request" on public.beta_access_requests;

create policy "read own request"
  on public.beta_access_requests
  for select
  to authenticated
  using (email = public.current_user_email());

-- 2) A user may file ONLY a request for their own email, and only as 'pending'.
--    (No update/delete policy for users — they cannot self-approve.)
drop policy if exists "insert own request" on public.beta_access_requests;

create policy "insert own request"
  on public.beta_access_requests
  for insert
  to authenticated
  with check (
    email = public.current_user_email()
    and status = 'pending'
  );

-- 3) Admins may read every request.
drop policy if exists "admins read requests" on public.beta_access_requests;

create policy "admins read requests"
  on public.beta_access_requests
  for select
  to authenticated
  using (public.is_beta_admin());

-- 4) Admins may delete requests. Status changes go through the RPCs below.
drop policy if exists "admins delete requests" on public.beta_access_requests;

create policy "admins delete requests"
  on public.beta_access_requests
  for delete
  to authenticated
  using (public.is_beta_admin());

-- ----------------------------------------------------------------------------
-- Approve a request: SECURITY DEFINER, admin-only. Atomically upserts the user
-- into beta_allowed_users as 'active' (reactivating a previously-blocked user)
-- and marks the request 'approved'. Raises if the caller is not an admin.
-- ----------------------------------------------------------------------------
create or replace function public.approve_beta_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r           public.beta_access_requests;
  admin_email text := public.current_user_email();
begin
  if not public.is_beta_admin() then
    raise exception 'not authorized';
  end if;

  select * into r from public.beta_access_requests where id = p_request_id;
  if not found then
    raise exception 'request not found';
  end if;

  insert into public.beta_allowed_users (email, status, display_name, added_by, notes)
  values (r.email, 'active', r.display_name, admin_email, 'Approved from access request')
  on conflict (email) do update
    set status       = 'active',
        display_name = coalesce(public.beta_allowed_users.display_name, excluded.display_name);

  update public.beta_access_requests
    set status      = 'approved',
        reviewed_at = now(),
        reviewed_by = admin_email
    where id = p_request_id;
end;
$$;

grant execute on function public.approve_beta_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Reject a request: SECURITY DEFINER, admin-only. Marks the request 'rejected'
-- and does NOT add the user to beta_allowed_users. Raises if not an admin.
-- ----------------------------------------------------------------------------
create or replace function public.reject_beta_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text := public.current_user_email();
begin
  if not public.is_beta_admin() then
    raise exception 'not authorized';
  end if;

  update public.beta_access_requests
    set status      = 'rejected',
        reviewed_at = now(),
        reviewed_by = admin_email
    where id = p_request_id;
end;
$$;

grant execute on function public.reject_beta_request(uuid) to authenticated;

-- ============================================================================
-- FIRST ADMIN SETUP
-- ----------------------------------------------------------------------------
-- First admin for Yuval Fit OS beta access.
-- This email is also approved as an active beta user, so the admin can use the
-- app itself and not only the admin panel.
-- ============================================================================

insert into public.beta_admins (email)
values ('yuvalzakay26@gmail.com')
on conflict (email) do nothing;

insert into public.beta_allowed_users (email, status, display_name, added_by)
values ('yuvalzakay26@gmail.com', 'active', 'Yuval', 'system')
on conflict (email) do nothing;

-- ============================================================================
-- OPTIONAL CHECKS
-- ----------------------------------------------------------------------------
-- After running the script, you can run these manually to confirm:
--
-- select * from public.beta_admins;
-- select * from public.beta_allowed_users;
-- select * from public.beta_access_requests order by requested_at desc;
-- ============================================================================