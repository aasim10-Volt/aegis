# Backend Backlog — deferred findings (POST-SUBMISSION, non-blocking)

The deferred findings from the code review, ranked as the audit ranked them. **All are
post-submission and non-blocking for the prototype**: at current scale (70 students, seed-equivalent
volumes, single trusted operator) none can fire in a way that affects the demo or the marked
deliverable. Each row is grounded in the actual code so it doubles as viva talking points and §6
content. Effort: S ≈ <½ day, M ≈ ½–1 day, L ≈ multi-day.

| # | Finding | Where | Fix | Effort | Standard |
|---|---|---|---|---|---|
| **C2** | **1000-row pagination → silent data loss.** Supabase/PostgREST caps a `select` at ~1000 rows by default; reads fetch everything with no paging, so beyond 1000 rows the tail is dropped **silently** (no error). Safe at 70 students; bites at institutional scale or once `audit_log` grows. | `aegis/adapters/repo_db.py:128` (`select("*")` in `fetch`), `:207` (`load_db_audit`) | Page with `.range()` in a loop until a short page returns, or set an explicit high limit + assert `count` matches rows fetched; fail loud if truncated. | M | OWASP — completeness / no silent truncation; ASVS V7 (error handling) |
| **S1** | **`set_profile_status` silent no-op.** `update(...).eq("id", id)` returns success even when **zero rows** match (bad/typo id), so the API reports "approved" for an account it never touched. | `aegis/adapters/repo_db.py:243` | Request the updated rows (`returning`/`select`) and raise if the affected count ≠ 1; surface that to the admin UI. | S | ASVS V7.4 (fail securely / verify state change) |
| **S2** | **Governance fallback masks live failure; integrity badge fail-open.** On any live error the admin endpoints `except → print(... using seed)` and serve **seed** governance data, so a broken live audit feed renders as a healthy "Verified" badge. Fail-open on an integrity control. | `aegis/api/main.py:341–359, 379–396, 438–456`; badge `app/admin/page.tsx` | Distinguish "live unavailable" from "verified": on live error return an explicit degraded/error state to the UI (never silently swap to seed for a governance read); badge must fail **closed**. | M | ISO 27001 A.12.4 (logging) / fail-closed integrity; ASVS V1.11 |
| **S3** | **Duplicate / overlapping RLS policy generations on `profiles`.** `0001` creates `profiles_read_own` + `profiles_update_own` + `profiles_admin_write`; `0004` adds `profiles_select_self` + `profiles_admin_update` for the same operations — two generations of policies coexist, which is confusing to audit and risks divergent intent. | `supabase/migrations/0001_base_schema.sql:147–153` vs `0004_signup_approval.sql:74–81` | Consolidate to one canonical policy set in a follow-up migration; `drop policy if exists` the superseded names so only one generation remains. | S | ISO 27001 A.9.4 (access control), change hygiene |
| **H1** | **Non-atomic migrations.** Applied in manual filename order; not all are wrapped in `begin/commit`, and there are no down-migrations, so a failed mid-sequence apply leaves a partially-migrated DB needing manual reconciliation. | `supabase/migrations/*` (e.g. `0001` not transaction-wrapped) | Wrap each migration in `begin/commit`; adopt a migration runner (Supabase CLI `db push`) for ordered, atomic apply; add rollback scripts. | M | ISO 27001 A.12.1.2 (change management) |
| **H3** | **Live-vs-repo schema drift; no down-migrations.** The migration-defined `profiles` (`0001`: `full_name`, `cohort_id text`) diverges from the live shape `0004` targets (`email`, `cohort_id uuid`, `github_username`). The two are maintained in parallel and can silently drift; nothing reproduces live from `migrations/` alone (see also the `auth.users` trigger that lives only in live). | `0001` vs `0004`; `AUTH_AUDIT.md §4` | Make `migrations/` the single source of truth (a fresh `db reset` must reproduce live exactly); add the missing objects (incl. the `on auth.users` trigger — `0006` does this) and down-migrations. | L | ISO 27001 A.12.1.2 (change management) |
| **H2** | **Write-back swallows errors.** Opt-in persistence (`AEGIS_PERSIST=1`) runs in a `try/except` that just `print`s `[write-back] skipped` and returns the in-memory result, so a failed persist is invisible to any caller/UI. | `aegis/api/main.py:61–68` | Return a persistence status in the `/run` response (persisted vs skipped + reason); log at error level; optionally surface a banner. (Read path staying alive on persist failure is correct — just make the failure observable.) | S | ASVS V7 (error handling / observability) |
| **D1** | **Drive provisioning not idempotent.** `POST /api/drive/provision` always creates a new folder; re-posting for a team that already has a workspace creates a duplicate (the route comment states idempotency is the caller's job). | `app/api/drive/provision/route.ts:13`; `lib/google/drive.ts` | Look up `teams.drive_folder_id` (column exists since `0005`) before creating; if set, return the existing workspace instead of provisioning again. | S | OWASP — idempotency / safe retries |
| **P2 / P3** | **Polish-tier items carried from the review.** Listed in the audit at the lowest priority; specifics were not restated in this task, so they are **not** reconstructed here to avoid inventing detail. | (original review notes) | Pull the exact P2/P3 text from the source review and slot in finding/fix/standard before the viva. | S | — (to confirm) |

---

## Framing for §6 / viva
- **Nothing here is a correctness bug in the marked prototype.** They are scale- and
  operations-hardening items that only matter past prototype conditions (≤1000 rows, one trusted
  operator, demo-controlled inputs).
- **Two are worth a sentence each in §6 as honest engineering caveats** you already chose to defer:
  **H1** (non-atomic migrations) and **H3** (schema drift / no down-migrations) — both
  change-management (ISO 27001 A.12.1.2), already noted in the Documentation's Limitations.
- **The integrity fail-open (S2)** is the one to fix first post-submission — it's the only finding
  that could *misreport* a governance control rather than merely lose throughput.

*Doc-only artifact. No code was changed (engine untouched). All findings deferred POST-SUBMISSION.*
