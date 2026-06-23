# RLS / Governance Verification (S4) — status + manual runbook

**Autonomous-run status: NOT EXECUTED against live (by policy). Must be run manually.**

I did not run `verify_governance.sql` against the live database during the unattended pass.
Three independent reasons, each sufficient:

1. **It is not read-only.** Despite the `begin … rollback`, the script `INSERT`s synthetic
   profiles/grants/projects/teams and `UPDATE`s a `teams` row and an `audit_log` row. Rollback
   discards the rows, **but sequence values (identity columns) are consumed irreversibly** and the
   hash-chain triggers fire during the transaction. That is a (small, non-restorable) state change —
   it violates the "no live-DB mutation" rule, so I left it alone.
2. **It needs a human at the running system.** Its own header requires the **Supabase SQL Editor
   running as superuser**; there is no `psql` on this box, and connecting to live with `.env`
   credentials while you're away is exactly the "stop before anything that needs a human at the
   running system" line.
3. **It doesn't actually test RLS.** Header lines 8–12 are explicit: the SQL Editor **bypasses RLS**.
   So this script verifies the **governance triggers** (audit chain, override-requires-reason,
   role-immutability, tamper detection) — *not* RLS enforcement. The claim "RLS enforcing on live"
   is substantiated by a **separate anon-key-over-REST** check (below), per `supabase/README.md`.

So S4 is two checks, and **both are yours to run with eyes on the dashboard.** Paste the raw output
into the result blocks below; the one-line interpretation for each is pre-filled.

---

## Check A — governance triggers (`verify_governance.sql`, SQL Editor)

**Run:** Supabase → SQL Editor → New query → paste all of `supabase/verify_governance.sql` → Run →
read the **Notices** pane. (Wraps in a transaction that rolls back; re-runnable.)

**Expected (all four PASS):**
```
PASS 1/4: audit chain intact
PASS 2/4: no-reason override rejected (override requires a reason)
PASS 3/4: role escalation blocked (role is not self-assignable)
PASS 4/4: tamper detected at id <n>
```

**Paste raw output here:**
```
<RESULT — Check A>
```

**Interpretation (one line):** four PASS ⇒ audit chain, no-silent-override, role-immutability, and
tamper-detection triggers are **enforcing on live**; any FAIL names the broken control.

---

## Check B — RLS default-deny + role lock (anon key, over REST) ← this is the real RLS proof

**Run** (Settings → API for the anon key; do **not** print it into the repo):
```bash
# B1 default-deny: anon key, no user JWT → every table returns []  (nothing leaks)
curl 'https://<ref>.supabase.co/rest/v1/students?select=*' -H "apikey: <ANON_KEY>"      # expect []

# B2 C3 role-lock: a signed-in student must NOT be able to self-promote
curl -X PATCH 'https://<ref>.supabase.co/rest/v1/profiles?id=eq.<student-uuid>' \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <STUDENT_JWT>" \
  -H "Content-Type: application/json" -d '{"role":"admin"}'
# expect an error / 0 rows changed — "role is not self-assignable"
```

**Paste raw output here:**
```
<RESULT — Check B1 (expect [])>
<RESULT — Check B2 (expect error / 0 rows)>
```

**Interpretation (one line):** `[]` from B1 + rejection/0-rows from B2 ⇒ RLS is **default-deny and
enforcing on live** (the anon key reads nothing it isn't entitled to, and a student cannot escalate)
— this upgrades the §4 claim from "defined in migrations" to "enforcing on live" (ASVS V4 access
control).

---

## What to do with the result
- **All PASS / [] / rejected** → update Documentation §4 to state RLS + governance triggers are
  *verified enforcing on live* (cite the date you ran it). Optionally drop the raw output into an
  appendix.
- **Any FAIL / non-empty read / role change accepted** → that control is **not** holding; do not
  publish the "enforcing" claim. Capture the message and fix before the demo.

*This file documents the procedure and records that the checks were not auto-run. No live query was
issued during the autonomous pass.*
