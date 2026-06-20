# AEGIS — Supabase schema & governance

Two migrations, applied **in order**:

| File | What it does |
|---|---|
| `migrations/0001_base_schema.sql` | Core tables + Row Level Security (default-deny on every table), role-immutability trigger (C3), cohort/team scoping (H1) |
| `migrations/0002_governance.sql` | Append-only, hash-chained `audit_log` + `audit_verify()`, enforcement triggers (override-requires-reason, admin-only role change, grant mirroring) |

`0002` depends on objects `0001` creates (`profiles.role`, `teams.status`/`teams.override_reason`, the referenced tables), so order matters. On real Supabase the `auth` schema and `auth.uid()` already exist — no shim needed.

> ⚠️ These migrations have **not** been executed locally (this dev box has no `psql` and Docker was unavailable). They were reviewed logically twice. **Run them once on a real project before submission** using either route below.

---

## Route A — Cloud SQL Editor (simplest, no Docker)

1. Create a project at [supabase.com](https://supabase.com) → note the project ref + DB password.
2. **SQL Editor → New query** → paste all of `migrations/0001_base_schema.sql` → **Run** (expect "Success").
3. New query → paste all of `migrations/0002_governance.sql` → **Run**.
4. New query → paste all of `verify_governance.sql` → **Run** → read the **Notices** pane (see below).

Confirm in the dashboard: Table Editor shows the 10 tables; Database → Functions shows
`is_admin`, `enforce_role_immutable`, `audit_chain`, `audit_verify`, `log_override`,
`log_role_change`, `log_grant`.

## Route B — Supabase CLI

Needs Docker running, and **run it from a copy of the repo at a path without `!`** — the CLI
mounts the repo into Docker and the `!`/space in `AEGIS.!` will break the mount (same hazard that
blocks `next build`). Copy the repo to e.g. `C:\dev\aegis` first.

```bash
# interactive — run yourself:
#   ! supabase login
supabase link --project-ref <ref>   # link to your cloud project
supabase db push                    # apply migrations/ in order to the linked DB
# fully local instead (Docker up):  supabase start && supabase db reset
```
`supabase db reset` replays every file in `migrations/` from scratch — the cleanest apply-order test.

---

## Verify behaviour, not just syntax

### 1. Governance (`verify_governance.sql`)
Run the bundled script in the SQL Editor. It wraps everything in a transaction that **rolls back**
(side-effect-free, re-runnable) and prints four assertions to the Notices pane:

```
PASS 1/4: audit chain intact
PASS 2/4: no-reason override rejected (override requires a reason)
PASS 3/4: role escalation blocked (role is not self-assignable)
PASS 4/4: tamper detected at id <n>
```
Any `FAIL` means the corresponding control isn't working — send me the message.

> The SQL Editor runs as a superuser, which **bypasses RLS** (that's why the script's tamper
> `UPDATE` on `audit_log` succeeds — a real client can't, there's no UPDATE policy). Triggers fire
> for everyone, so the override/role-change checks are valid here. RLS itself is checked next.

### 2. RLS default-deny + role lock (anon key, over REST)
RLS can't be tested from the SQL Editor (superuser bypasses it). Use the **anon key**
(Settings → API):

```bash
# default-deny: with only the anon key (no user JWT), every table returns [] — nothing leaks
curl 'https://<ref>.supabase.co/rest/v1/students?select=*' -H "apikey: <ANON_KEY>"     # expect []

# C3: a signed-in student must NOT be able to make themselves admin
curl -X PATCH 'https://<ref>.supabase.co/rest/v1/profiles?id=eq.<student-uuid>' \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <STUDENT_JWT>" \
  -H "Content-Type: application/json" -d '{"role":"admin"}'
# expect an error / 0 rows changed — "role is not self-assignable"
```

---

## Success criteria
- Both migrations apply with **no errors**.
- `verify_governance.sql` prints **PASS 1–4**.
- Anon-key table reads return `[]`; a student cannot set their own role.

## Notes / production hardening (documented, not built)
- Revocations (`access_grants.revoked_*`) are not yet audited — the grant trigger is insert-only.
- App-level events (login, allocation_run, appeal_decided, data_exported) are logged explicitly by
  the backend with `service_role`, per the note at the end of `0002` — not by triggers.
- The Python `aegis/governance/` module mirrors `audit_verify()` for the **offline** admin console;
  this SQL is the **production** enforcement layer.
