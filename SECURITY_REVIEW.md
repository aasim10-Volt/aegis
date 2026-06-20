# AEGIS — Security Review

**Scope.** This reviews the *documented* backend — the Supabase/Auth/Drive
decisions in the Integration Setup Guide, the env layout you shared, and the
data model — plus env-file placement. It is **not** a source-code audit: no
backend code was provided. Attach the repo (or the `engine/`, `api/`, and
Supabase `migrations/` folders) for a line-level pass.

**Context that raises the stakes.** The submission requires a **public GitHub
repo**, and AEGIS processes **student personal data under PDPA**. So a leaked
key here is not a bug — it is a data-protection breach. The single most
important security outcome this week: *nothing sensitive reaches the public repo.*

First, the reassuring part: what you pasted earlier (Supabase project URL, Drive
folder ID, and a `<your service role key>` **placeholder**) contained **no live
secret** — the URL is public by design and the folder ID is just an identifier.
The two things that *are* dangerous (the real `service_role` key and the Drive
service-account JSON) were never pasted. Keep it that way.

---

## Findings by severity

### 🔴 CRITICAL

**C1 — `service_role` key / Drive JSON must be backend-only and gitignored.**
`service_role` bypasses RLS entirely; the Drive service-account JSON can read and
write every team's workspace. If either lands in the client bundle or the public
repo, it's full compromise. Fixes: backend env only, never a `NEXT_PUBLIC_`/`VITE_`
prefix, file path (not inlined key) for the JSON, and the `.gitignore` in this
bundle. Add a pre-commit secret scan (`gitleaks` or `trufflehog`) — you've done
`git filter-repo` scrubbing before, so this is familiar ground. If either secret
was *ever* committed or shared, rotate it (Supabase → new service key; GCP → new
SA key) — rotation is the only real remediation for a leaked credential.

**C2 — RLS is the load-bearing control; it must be ON for every table, default-deny.**
The anon key is safe *only* because RLS protects the data. The integration guide
lists RLS as a checkbox "once roles exist" — that ordering is the risk. Enable RLS
on **every** table (`students`, `skills_declared`, `projects`, `teams`,
`team_members`, `tasks`, `activity_log`, `alerts`, `profiles`) before any real
data exists. One table left unprotected = the anon key reads the whole cohort.

**C3 — Role escalation via `profiles.role`.** The model says lecturer/admin are
"not self-assignable," but if `profiles.role` is client-writable, a student can
`update profiles set role = 'admin'`. This must be blocked at the database, not
the UI:

```sql
alter table profiles enable row level security;

-- a user may read their own profile
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- a user may update their own profile BUT NOT their role
create policy "update own profile, not role" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));
```

Role changes happen only via `service_role` / an admin-only RPC.

### 🟠 HIGH

**H1 — Authorization must live in RLS, not the frontend.** "Lecturer sees only
assigned cohort," "student sees only own team" are authz rules. If they exist only
as UI filtering, anyone can call the REST/PostgREST endpoint directly with the anon
key and read everything. Encode them as policies, e.g.:

```sql
-- students: a student sees only teammates; a lecturer sees only their assigned cohort
create policy "team or cohort scope" on students
  for select using (
    exists (select 1 from team_members tm
            where tm.student_id = students.id
              and tm.team_id in (select team_id from team_members where student_id = auth.uid()))
    or exists (select 1 from lecturer_cohorts lc
               where lc.lecturer_id = auth.uid() and lc.cohort_id = students.cohort_id)
  );
```

**H2 — The mock auth toggle must never elevate DB access.** Per the build plan
you're using a "View as Lecturer/Student" toggle instead of real auth. Keep it
**frontend state only**. A mock that reaches for `service_role` on the client to
"just make it work" would be catastrophic and would ship in the public bundle.
Demo data goes through the anon key + RLS, or through a backend endpoint — never a
client-side service key.

**H3 — Public repo hygiene.** Beyond keys: scrub real student PII from `seed.json`
(use synthetic names/emails — your seed is engineered anyway), and make sure no
`.env`, `*.json` credential, or `DATABASE_URL` with a password is in git history,
not just the working tree. `git log -p | grep -iE 'service_role|BEGIN PRIVATE KEY|supabase.*key'` as a quick check.

### 🟡 MEDIUM

**M1 — Drive least privilege.** Every team folder is a child of one root folder
shared with the service account as Editor, so a compromised SA exposes *all*
teams. Acceptable for a seed-data prototype; for production, scope per-team and
rotate the SA key. Set `GOOGLE_APPLICATION_CREDENTIALS` to a path under
`./secrets/` (gitignored), not the repo root.

**M2 — Actor-to-student mapping is spoofable.** Drive Activity returns
`people/123`; matching by display name (the guide's mock shortcut) can be spoofed.
Fine for the demo; for real data, resolve via the People API and match on verified
email, not name.

**M3 — OAuth redirect + iframe surface.** Keep the OAuth redirect URI allowlist
exact (no wildcards). The Google Docs iframe embeds expose file IDs in the DOM —
the README's rule "never expose another team's file ID" is the right one; enforce
it server-side. Add a CSP `frame-src https://docs.google.com` rather than `*`.

**M4 — Transaction pooler / DB exposure.** `DATABASE_URL` uses the pooler (port
6543) — good for connection limits. Ensure direct Postgres (`listen_addresses`)
isn't exposed publicly; route through Supabase, not a raw public Postgres port.
(You deferred `postgres listen_addresses` hardening on your VPS — same principle.)

---

## Pre-submission security checklist

- [ ] `.gitignore` (this bundle) committed **before** the first `git add`.
- [ ] `git log -p` clean of `service_role`, `PRIVATE KEY`, `DATABASE_URL` passwords.
- [ ] `gitleaks detect` / `trufflehog git file://.` runs clean.
- [ ] RLS **enabled + default-deny** on all tables; tested by hitting the REST API with only the anon key.
- [ ] `profiles.role` not client-writable (C3 policy in place).
- [ ] Cohort/team scoping enforced in RLS, verified by querying as a non-member.
- [ ] Mock auth toggle is frontend-only; no `service_role` in any client code.
- [ ] `seed.json` uses synthetic PII only.
- [ ] Drive SA JSON under `./secrets/`, referenced by path, gitignored.
- [ ] If any secret was ever exposed → rotated.

**Bottom line for the 6 days:** running on seed data with no real students, your
live-data attack surface is small. The real, present risk is the **public repo
leaking a key or PII**. Nail C1–C2 and the checklist; treat M1–M4 as the Phase-3
hardening you document (which also feeds your Feasibility marks).
