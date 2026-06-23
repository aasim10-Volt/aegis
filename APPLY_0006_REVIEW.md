# Pre-apply review pack — `0006_staff_directory.sql`

Eyeball the two invariants below, then follow the ordered apply + test steps. **Not applied by this
pass.** Source: `supabase/migrations/0006_staff_directory.sql` (verbatim excerpts).

---

## Invariant (a) — role sourced ONLY from the directory lookup or hard-coded `'student'`

```sql
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_role   text;
  v_status text;
begin
  -- LOOKUP, not trust: NEW.email is a key against the admin-owned directory.
  -- raw_user_meta_data is deliberately never consulted for role.
  select sd.role into v_role
  from public.staff_directory sd
  where lower(sd.email) = lower(new.email);

  if v_role is null then
    v_role   := 'student';     -- hard-coded default; the ONLY non-directory source of role
    v_status := 'pending';     -- unchanged default lifecycle
  else
    v_status := 'approved';    -- pre-vetted staff are active immediately
  end if;

  insert into public.profiles (id, email, role, cohort_id, status)
  values (new.id, new.email, v_role, null, v_status)
  on conflict (id) do nothing;  -- idempotent: a replayed signup never errors

  return new;
end $$;
```

**✔ Confirm:** `v_role` is assigned from exactly two places — the `staff_directory` lookup keyed on
`lower(new.email)`, or the literal `'student'`. **`new.raw_user_meta_data` is never read.** The email
is a lookup KEY, never a role value. `SET search_path` is pinned (hardening `0004` lacked).

## Invariant (b) — `staff_directory` is admin / service_role write-only

```sql
alter table public.staff_directory enable row level security;

drop policy if exists staff_directory_admin_all on public.staff_directory;
create policy staff_directory_admin_all on public.staff_directory
  for all
  using (public.is_admin())          -- read/identify rows: admin only
  with check (public.is_admin());    -- write rows: admin only  (service_role bypasses RLS)
-- Explicitly NO policy for anon/authenticated non-admins → every
-- SELECT/INSERT/UPDATE/DELETE by them is denied by default. This is the control.
```

**✔ Confirm:** RLS is ON with a single `is_admin()` policy and **no** other policy → non-admin
clients are default-denied for all of SELECT/INSERT/UPDATE/DELETE. Only an admin (or the
service_role backend, which bypasses RLS) can write. This table is the escalation surface — whoever
writes it owns role assignment, so write must stay admin-only.

---

## Ordered steps to apply live (you, at the dashboard)

1. **Pre-check schema.** Confirm the live `profiles` columns are `(id, email, role, cohort_id,
   status)`. If your live `profiles` instead has `full_name`/no `email` (the H3 drift), **fix the
   INSERT column list first** — do not apply against a mismatched schema.
2. **Confirm dependency.** `is_admin()` must already exist (from `0001`/`0004`). The migration's
   guard block raises if it's missing.
3. **Apply to NON-PROD first.** Supabase → SQL Editor → paste all of `0006_staff_directory.sql` →
   Run → expect "Success". Sanity-check: `staff_directory` exists, RLS on, trigger
   `on_auth_user_created` present (`select tgname from pg_trigger where
   tgrelid='auth.users'::regclass and not tgisinternal;`).
4. **Decide on section 4.** It re-asserts the `on auth.users` trigger. Keep it (recommended — closes
   the AUTH_AUDIT §4 gap) unless you don't want `0006` touching `auth.users`; if so, comment it out.
5. **Apply to LIVE** (next migration after `0005`).
6. **Seed staff from a gitignored source.** Copy `supabase/staff_directory_seed.example.sql` →
   `supabase/staff_directory_seed.local.sql` (gitignored), put the real lecturer/admin emails in,
   run it. Verify: `select email, role from public.staff_directory order by role;`.

## Incognito login tests to run immediately after (eyes on the system)

7. **Supervisor path** — in a fresh incognito window, sign up/log in with an email that **is** in
   `staff_directory`:
   - Expect `profiles.role = 'lecturer'` (or `admin`) and `status = 'approved'`.
   - Verify the user lands in the app with the cohort-scoped views, not "pending".
8. **Student path** — separate incognito window, an email **not** in the directory:
   - Expect `profiles.role = 'student'` and `status = 'pending'`.
9. **Escalation spot-check** — confirm a non-admin cannot write the directory:
   ```bash
   curl -X POST 'https://<ref>.supabase.co/rest/v1/staff_directory' \
     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <STUDENT_JWT>" \
     -H "Content-Type: application/json" -d '{"email":"x@y.z","role":"admin"}'
   # expect denied / 0 rows — RLS blocks non-admin writes
   ```
10. **Rollback if needed:** drop the trigger/table/function in reverse, or restore from your pre-apply
    snapshot. Because role now flows through the directory, removing a staff email + the user's
    `profiles` row reverts them to the student default on next signup.

---

## Quick verdict checklist
- [ ] (a) role never from `raw_user_meta_data` — confirmed in the body above.
- [ ] (b) `staff_directory` write = admin/service_role only — confirmed in the policy above.
- [ ] `profiles` column list matches live schema (H3 check).
- [ ] Supervisor email → lecturer/approved; student email → student/pending (incognito).
- [ ] Non-admin cannot write `staff_directory`.
