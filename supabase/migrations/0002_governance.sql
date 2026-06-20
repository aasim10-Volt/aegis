-- ============================================================================
-- AEGIS — Governance & Access Monitoring (Supabase / Postgres)
-- Enforce, don't trust: the DB writes the audit trail via triggers, RLS makes
-- it admin-readable and append-only. An action cannot happen unlogged.
--
-- NOTE: audit_log (governance: who did what to the SYSTEM) is deliberately
-- separate from activity_log (student workspace telemetry → health score).
-- ============================================================================

create extension if not exists pgcrypto;   -- for sha256 digest (hash chain)

-- ── governed action vocabulary ──────────────────────────────────────────────
do $$ begin
  create type gov_action as enum (
    'lecturer_approved','lecturer_revoked','cohort_assigned','cohort_unassigned',
    'role_changed','allocation_run','recommendation_overridden','appeal_decided',
    'data_exported','alert_acknowledged','login'
  );
exception when duplicate_object then null; end $$;

-- ── 1. AUDIT LOG (append-only, hash-chained) ────────────────────────────────
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid not null,                 -- auth.users.id
  actor_role  text not null,
  action      gov_action not null,
  target_type text,
  target_id   text,
  reason      text,                          -- REQUIRED for overrides/appeals (see trigger)
  metadata    jsonb not null default '{}'::jsonb,
  prev_hash   text,                          -- tamper-evidence: chain of sha256
  row_hash    text,
  created_at  timestamptz not null default now()
);

-- hash chain: each row commits to the previous one. Any edit/delete breaks the chain.
create or replace function audit_chain() returns trigger
language plpgsql security definer as $$
declare prev text;
begin
  select row_hash into prev from audit_log order by id desc limit 1;
  new.prev_hash := coalesce(prev, 'GENESIS');
  new.row_hash  := encode(digest(
      new.prev_hash || new.actor_id::text || new.action::text ||
      coalesce(new.target_id,'') || coalesce(new.reason,'') ||
      new.metadata::text || new.created_at::text, 'sha256'), 'hex');
  return new;
end $$;

drop trigger if exists trg_audit_chain on audit_log;
create trigger trg_audit_chain before insert on audit_log
  for each row execute function audit_chain();

-- integrity check the admin console calls: returns the first broken row, or NULL if intact
create or replace function audit_verify() returns table(broken_at bigint)
language plpgsql security definer as $$
declare r record; prev text := 'GENESIS'; calc text;
begin
  for r in select * from audit_log order by id loop
    calc := encode(digest(prev || r.actor_id::text || r.action::text ||
            coalesce(r.target_id,'') || coalesce(r.reason,'') ||
            r.metadata::text || r.created_at::text, 'sha256'), 'hex');
    if calc <> r.row_hash or r.prev_hash <> prev then
      broken_at := r.id; return next; return;
    end if;
    prev := r.row_hash;
  end loop;
end $$;

-- ── 2. ACCESS GRANTS (who granted whom what) ────────────────────────────────
create table if not exists access_grants (
  id          uuid primary key default gen_random_uuid(),
  grantee_id  uuid not null,
  grant_type  text not null,                 -- 'lecturer_role' | 'cohort_assignment'
  scope_id    text,                          -- cohort_id for assignments
  granted_by  uuid not null,
  granted_at  timestamptz not null default now(),
  revoked_by  uuid,
  revoked_at  timestamptz
);

-- ── 3. RLS: append-only audit, admin-gated reads ────────────────────────────
alter table audit_log     enable row level security;
alter table access_grants enable row level security;

-- admin reads everything; a user may read only their own audit events.
create policy audit_read on audit_log for select using (
  (select role from profiles where id = auth.uid()) = 'admin'
  or actor_id = auth.uid()
);
-- NO update/delete policies → default-deny makes the log append-only for everyone.
-- (Inserts arrive via SECURITY DEFINER trigger functions below, not direct client writes.)

create policy grants_admin_all on access_grants for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
) with check (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ── 4. ENFORCEMENT TRIGGERS (the "can't forget to log" part) ────────────────

-- a) lecturer override of an engine recommendation (highest-value governance event)
--    assumes teams has columns: status, override_reason
create or replace function log_override() returns trigger
language plpgsql security definer as $$
begin
  if new.override_reason is null or btrim(new.override_reason) = '' then
    raise exception 'override requires a reason';   -- policy: no silent overrides
  end if;
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (auth.uid(),
          coalesce((select role from profiles where id = auth.uid()), 'unknown'),
          'recommendation_overridden', 'team', new.id::text, new.override_reason,
          jsonb_build_object('from', old.status, 'to', new.status));
  return new;
end $$;

drop trigger if exists trg_log_override on teams;
create trigger trg_log_override after update on teams
  for each row when (new.override_reason is distinct from old.override_reason)
  execute function log_override();

-- b) role change (ties to security finding C3: only admin, and always audited)
create or replace function log_role_change() returns trigger
language plpgsql security definer as $$
begin
  if (select role from profiles where id = auth.uid()) <> 'admin' then
    raise exception 'only an admin may change a role';
  end if;
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, metadata)
  values (auth.uid(), 'admin', 'role_changed', 'profile', new.id::text,
          jsonb_build_object('from', old.role, 'to', new.role));
  return new;
end $$;

drop trigger if exists trg_log_role on profiles;
create trigger trg_log_role after update on profiles
  for each row when (new.role is distinct from old.role)
  execute function log_role_change();

-- c) lecturer approval / cohort assignment mirror into the audit log
create or replace function log_grant() returns trigger
language plpgsql security definer as $$
begin
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, metadata)
  values (coalesce(new.granted_by, auth.uid()), 'admin',
          case new.grant_type when 'lecturer_role' then 'lecturer_approved'
                              else 'cohort_assigned' end,
          'user', new.grantee_id::text,
          jsonb_build_object('grant_type', new.grant_type, 'scope', new.scope_id));
  return new;
end $$;

drop trigger if exists trg_log_grant on access_grants;
create trigger trg_log_grant after insert on access_grants
  for each row execute function log_grant();

-- d) allocation runs and appeal decisions are app-level events — record them
--    explicitly from the backend with service_role:
--    insert into audit_log(actor_id, actor_role, action, target_type, target_id, reason, metadata) ...
-- ============================================================================
