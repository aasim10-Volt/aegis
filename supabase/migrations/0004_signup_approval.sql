-- ============================================================================
-- AEGIS — 0004: signup approval + auth.users delete-cascade
-- Fits the LIVE profiles schema: (id uuid pk, email, role default 'student',
-- cohort_id uuid, github_username). Adds an approval lifecycle, keeps the
-- role-hardening control in handle_new_user, and fixes the FK so auth users can
-- be deleted. Idempotent + transactional; safe to re-run.
-- ============================================================================
begin;

-- ── 0. admin check (self-contained; harmless if it already exists) ───────────
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public, pg_catalog as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── 1. approval status + one-time backfill ───────────────────────────────────
-- The add + backfill run ONLY when the column is first created. On a re-run the
-- column already exists, so genuinely-pending signups are never auto-approved.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'status'
  ) then
    alter table public.profiles
      add column status text not null default 'pending'
      check (status in ('pending', 'approved', 'rejected'));
    -- every account that exists at install time is already active — don't lock them out
    update public.profiles set status = 'approved';
  end if;
end $$;

-- ── 2. signup trigger: create the profile PENDING, role hard-forced 'student' ─
-- Faithful to your live function — the ONLY change is appending status='pending'
-- (same SECURITY DEFINER, same insert columns incl. cohort_id, no on-conflict).
-- PRIVILEGE-ESCALATION CONTROL preserved exactly: role is hard-coded 'student' and
-- is never read from raw_user_meta_data. The trigger on auth.users is untouched.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, cohort_id, status)
  values (new.id, new.email, 'student', null, 'pending');
  return new;
end $$;

-- ── 3. fix the FK: cascade deletes (resolves "Database error deleting user") ──
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- ── 4. approval is admin-only ────────────────────────────────────────────────
-- RLS is ROW-level and cannot scope a single column, so the rule "only an admin
-- may change status" is enforced by a BEFORE UPDATE trigger (mirrors the role
-- immutability pattern). The RLS policies gate row visibility/updates; the
-- service_role backend (auth.uid() IS NULL) is the trusted approver.
create or replace function public.enforce_status_admin_only() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'approval status is admin-only';
  end if;
  return new;
end $$;

drop trigger if exists trg_status_admin_only on public.profiles;
create trigger trg_status_admin_only before update on public.profiles
  for each row execute function public.enforce_status_admin_only();

alter table public.profiles enable row level security;

-- a user may read their own profile; an admin reads all (for the approvals list).
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- only an admin may update a profile through the client (approve/reject).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

commit;
