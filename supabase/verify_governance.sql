-- ============================================================================
-- AEGIS — governance verification
-- Run this in the Supabase SQL Editor AFTER applying 0001_base_schema.sql and
-- 0002_governance.sql. It exercises the audit chain, the "no silent override"
-- rule, role-escalation blocking, and tamper detection, then ROLLS BACK — so it
-- leaves no trace and is safe to re-run. Read the NOTICES pane for PASS/FAIL.
--
-- Note: the SQL Editor runs as a superuser, which BYPASSES RLS — that is why the
-- tamper UPDATE in step 4 succeeds (a real client cannot, there is no UPDATE
-- policy on audit_log). RLS itself must be checked with the anon key over REST
-- (see supabase/README.md). Triggers fire for everyone, superuser included, so
-- steps 1-3 are valid here.
-- ============================================================================

begin;

-- synthetic actors (discarded on rollback)
insert into profiles(id, full_name, role)
  values ('00000000-0000-0000-0000-0000000000a1', 'Verify Admin', 'admin')
  on conflict (id) do update set role = excluded.role;
insert into profiles(id, full_name, role)
  values ('00000000-0000-0000-0000-0000000000b2', 'Verify Student', 'student')
  on conflict (id) do update set role = excluded.role;

-- impersonate the admin. auth.uid() reads this claim on Supabase. If auth.uid()
-- comes back NULL on your instance, it reads request.jwt.claims (json) instead —
-- set that to '{"sub":"...a1"}' as well.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

-- exercise governed actions; each writes one hash-chained audit row via a trigger
insert into access_grants(grantee_id, grant_type, granted_by)
  values ('00000000-0000-0000-0000-0000000000b2', 'lecturer_role',
          '00000000-0000-0000-0000-0000000000a1');
insert into projects(id, title, abstract, capacity)
  values ('VERIFY_P1', 'Verify project', 'abstract text for verification', 4);
insert into teams(id, project_id, status) values ('VERIFY_T1', 'VERIFY_P1', 'formed');
update teams set override_reason = 'post-review swap', status = 'overridden'
  where id = 'VERIFY_T1';

-- 1) the chain is intact after legitimate writes
do $$ declare b bigint; begin
  select broken_at into b from audit_verify();
  if b is null then raise notice 'PASS 1/4: audit chain intact';
  else raise notice 'FAIL 1/4: chain reports broken at id %', b; end if;
end $$;

-- 2) no silent override: clearing the reason must be rejected
do $$ begin
  update teams set status = 'formed', override_reason = null where id = 'VERIFY_T1';
  raise notice 'FAIL 2/4: a no-reason override was ALLOWED';
exception when others then
  raise notice 'PASS 2/4: no-reason override rejected (%)', sqlerrm;
end $$;

-- 3) role escalation: a student must not be able to self-promote (C3)
do $$ begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
  update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b2';
  raise notice 'FAIL 3/4: student self-escalation was ALLOWED';
exception when others then
  raise notice 'PASS 3/4: role escalation blocked (%)', sqlerrm;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

-- 4) tamper detection: editing any audit row breaks the chain
do $$ declare b bigint; begin
  update audit_log set reason = 'tampered' where id = (select min(id) from audit_log);
  select broken_at into b from audit_verify();
  if b is not null then raise notice 'PASS 4/4: tamper detected at id %', b;
  else raise notice 'FAIL 4/4: tamper was NOT detected'; end if;
end $$;

rollback;  -- discard everything; verification leaves no trace
