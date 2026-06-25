# BACKEND_VERIFICATION.md

Read-only backend verification audit for AEGIS. Scope covered: `aegis/engine/`, `aegis/adapters/`, `aegis/api/`, `scripts/`, `supabase/migrations/`, root `.md` docs, `docs/*.md`, and `CIPHER2_theametuers_Documentation.html`.

Commands run were read-only. `SUPABASE_URL` and `AEGIS_PERSIST` were unset for runtime sanity checks, so no live database writeback path was reachable.

Verification evidence:
- `python -m pytest -p no:cacheprovider` -> `93 passed`.
- Seed pipeline direct run -> `12 students`, `8 projects`, `3 teams`, `0 exception_pool`, `5 alerts`, duplicate `P_02/P_03 = 0.9604`, health bands `1 healthy / 1 at_risk / 1 critical`.
- FastAPI in-process sanity via `TestClient` -> `GET /health` returned `{"status":"ok"}` and `POST /run` returned the same seed response shape.

## 1. WORKS-AS-DOCUMENTED

### Engine Algorithms

- Evidence weighting is implemented as documented. `aegis/engine/config.py` defines confidence tiers exactly as `verified=1.0`, `portfolio=0.8`, `self_report=0.6`, `contradicted=0.5`; `aegis/engine/phase_a_scoring.py:17` computes `declared_level * CONFIDENCE[basis]`. The API marks the Dunning-Kruger case with `corrected=True` when `confidence_basis == "contradicted"` in `aegis/api/main.py:166-180`.

- Duplicate detection is implemented as TF-IDF plus cosine similarity. `aegis/engine/phase_b_dedupe.py` uses `TfidfVectorizer(stop_words="english")`, `cosine_similarity`, and flags pairs where `similarity >= config.DEDUPE_THRESHOLD`; the threshold is `0.75` in `aegis/engine/config.py`.

- Matching uses the `matching` library's Abraham-Manlove SPA implementation. `aegis/engine/phase_b_match.py:85-94` constructs `StudentAllocation` with student preferences, project capacities, and supervisor capacities, then solves `optimal="student"`. Preferences are filtered to existing project ids before matching, preventing preference-id drift in the seed path.

- Formation is maximin floor-lifting, not average-maximizing. `aegis/engine/phase_b_teams.py:142-173` accepts a swap only when it raises `min_team_score(...)` and keeps hard constraints valid. It does not accept a swap merely because the average improves.

- Team health is a four-component score in code: `engagement`, `workload_balance`, `task_completion`, and `milestone`. `aegis/engine/config.py` weights them as `0.30 / 0.25 / 0.30 / 0.15`; `aegis/engine/phase_c_health.py:69-99` renormalizes weights when monitoring components are absent.

- Alert triggers match the current engine config: ghosting tier 2 at 6 zero-input days and tier 3 at 10; sympathy-carry at ratio `>= 0.95`; burnout when authored footprint is `>= 2x` team average. The seed run confirms all intended demo mechanisms fire: `health_at_risk`, `sympathy_carry`, `burnout`, `health_critical`, and `ghosting_tier3`.

- The per-member utilization values are equal within a team by design, not an aggregate accidentally stamped onto each member. `aegis/engine/phase_b_tasks.py` assigns hours proportional to member capacity, so `assigned / capacity` is the same ratio for all members of a team unless capped. Values can exceed 100% up to `OVERLOAD = 1.2`; P_05 shows every member at `1.2` with `4.8` unallocated hours. That is correct for the current capacity-proportional allocator, but docs/UI should avoid presenting it as contribution share.

- Engine purity holds. The architecture test scans `aegis/engine/*.py` for forbidden imports (`adapters`, `api`, `google`, `supabase`, `fastapi`), and the full test suite passed. Manual inspection found no engine imports from adapters or API.

### Data Layer And API

- `repo_seed` maps `seed.json` to the same `Cohort` domain shape that `repo_db.rows_to_cohort(...)` returns. The direct adapter unit test covers the row mapping, and runtime seed execution confirms the pipeline consumes it correctly.

- The environment switch is implemented as documented. `aegis/api/main.py:53-61` uses live Supabase when `SUPABASE_URL` is set and bundled seed data when unset. `_result()` only persists when both `SUPABASE_URL` is set and `AEGIS_PERSIST == "1"` (`aegis/api/main.py:64-80`), so writeback is off by default.

- Seed internal references are consistent. Static verification found no missing project preferences, preferred teammate references, activity authors, activity assignees, or monitoring project ids in the committed seed.

- `/admin/*` is uniformly gated through one `APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])` in `aegis/api/main.py:320`, and mounted once at `aegis/api/main.py:480`. `require_admin` validates a Supabase user token and reads authoritative `profiles.role` via `repo_db.resolve_user_role`, not user metadata.

- Public read/compute routes (`/run`, `/teams`, `/alerts`, `/students/{id}`) are open in code. This matches the documented prototype accepted-risk posture in the HTML documentation, with writeback disabled unless `AEGIS_PERSIST=1`.

### Migrations

- Migration files present: `0001_base_schema.sql`, `0002_governance.sql`, `0003_engine_fields.sql`, `0004_signup_approval.sql`, `0005_drive_workspace.sql`, `0006_staff_directory.sql`.

- `0006_staff_directory.sql` is internally hardened as claimed: it wraps in `begin/commit`, pins `handle_new_user` with `set search_path = public, pg_catalog`, sources role only from `staff_directory` or hard-coded `'student'`, and does not read `raw_user_meta_data`.

## 2. BUGS

### Critical - `scripts/load_supabase.py` cannot run because `_sid` is undefined

- Evidence: `scripts/load_supabase.py:78`, `:112`, `:129`, `:145`, and `:149` call `_sid(...)`; there is no `def _sid` anywhere under `scripts/` or `aegis/`.
- Impact: the documented seed/mock-to-live loader cannot reproduce the live Supabase cohort. This also blocks verification of deterministic forward/inverse student UUID mapping through the committed loader.
- Related inconsistency: `_pid(...)` is defined at `scripts/load_supabase.py:29-31` but unused; projects are upserted as raw ids at `scripts/load_supabase.py:84`.

### Critical - `0003_engine_fields.sql` is type-incompatible with `0001_base_schema.sql`

- Evidence: `supabase/migrations/0001_base_schema.sql:38-39` creates `projects.id text primary key`; `supabase/migrations/0003_engine_fields.sql:29-30` creates `team_monitoring.project_id uuid primary key references projects(id)`.
- Impact: a fresh database applying `0001` then `0003` should fail because a UUID foreign key cannot reference a text primary key. If a live database has `team_monitoring.project_id` working, that is live-vs-repo schema drift and `migrations/` is not a reproducible source of truth.
- Secondary impact: `scripts/load_supabase.py:161` writes raw project ids such as `P_01` into `team_monitoring.project_id`, which is invalid if the repo migration's UUID column exists.

### High - Live adapter does not validate rows like the seed adapter does

- Evidence: `repo_seed` validates disciplines, confidence bases, and preferred roles through `_check(...)`; `aegis/adapters/repo_db.py:46-68` casts live rows directly into domain objects without vocabulary validation.
- Impact: bad live data can either crash later with a context-poor `KeyError` (bad `confidence_basis`) or silently degrade behavior (`preferred_role` outside config scores as "none"). This contradicts `aegis/domain/models.py` comments that the role vocabulary is validated at load.

### High - Opt-in writeback is non-atomic and can leave partial live state

- Evidence: `aegis/adapters/repo_db.py:153-202` deletes alerts and teams, then inserts teams, members, alerts, and audit rows through separate PostgREST calls without a transaction.
- Impact: if `AEGIS_PERSIST=1` and any mid-write call fails, the previous allocation may already be deleted while the replacement is incomplete. `_result()` catches and prints persistence errors at `aegis/api/main.py:72-79`, so callers still receive a successful in-memory `/run` result.

### Medium - Live governance reads fail open to seed data

- Evidence: `aegis/api/main.py:357-390`, `:397-424`, and `:456-476` catch broad exceptions in live mode and return seed governance/audit/integrity data.
- Impact: a broken live audit feed can render as valid static demo data. This is especially dangerous for `/admin/integrity`, where a missing or failing live integrity check can look "verified" if seed integrity verifies.

### Medium - Large live reads can silently truncate at the PostgREST default cap

- Evidence: `aegis/adapters/repo_db.py:128-130` fetches live tables with `.select("*").execute()` and no paging; `load_db_audit` likewise uses a single `.select(...).order(...).execute()`.
- Impact: safe for the current small cohort, but institutional-size tables or a growing audit log can silently drop rows beyond the API cap. This is already tracked as C2 in `BACKEND_BACKLOG.md`.

### Medium - `set_profile_status` can report success for zero updated rows

- Evidence: `aegis/adapters/repo_db.py:243-247` updates `profiles` by id but does not check affected row count or returned rows.
- Impact: an admin approval/rejection request for a typo or stale `profile_id` can return `{"status":"approved"}` even when no account changed.

## 3. DOC-CODE MISMATCHES

### Submission-critical mismatches

- `CIPHER2_theametuers_Documentation.html:96` claims "6 governed monitoring alerts" for the live 70-student run. I could not verify live data in this read-only audit; the committed seed produces exactly 5 alerts. If 6 is a live-only claim, it needs live evidence in the capture artifacts.

- `CIPHER2_theametuers_Documentation.html:163` says "the API never returns data the caller is not entitled to." This overstates the code. The same document later correctly says `/run`, `/teams`, `/alerts`, and `/students/{id}` are not individually authenticated (`:182`). The sentence at `:163` should be scoped to Supabase RLS/client paths or admin governance, not the open FastAPI read routes.

- `CIPHER2_theametuers_Documentation.html:181` says UI authorization reads authoritative `profiles.role`, never `user_metadata`. The actual frontend role provider reads `user.user_metadata.role` in `components/auth/user-provider.tsx:23-30`, and signup writes role metadata in `app/signup/page.tsx:40-45`. The backend admin gate is authoritative, but the dashboard role rendering claim is not supported by current code.

- `CIPHER2_theametuers_Documentation.html:176` claims an independent live browser audit confirmed the three-tier boundary. I did not find local executable evidence in the backend scope for that claim; it depends on live browser verification outside this audit.

- `README.md:181` says signup forces `student`. In the database trigger from `0004`, role is indeed hard-coded to `student`, but the frontend still sends user metadata `{ role }` from the signup form. The backend is safe for authoritative role, but the sentence is incomplete unless it clarifies "database profile role".

- `docs/AEGIS_README_v3.md:133` says duplicate similarity "locks the project portal and forces the group to change." Code does not lock or block; it returns `DuplicateFlag` rows for review. The newer HTML doc gets this right in places by saying "flagged/held for review."

- `docs/AEGIS_README_v3.md:139-147` describes rare-skill seeding plus greedy expansion. Current code uses SPA first, then forms project teams, then local maximin swaps. Rare skill is a +15 project priority bonus inside SPA, not an explicit seeding phase followed by greedy expansion.

- `docs/AEGIS_README_v3.md:234-247` documents a five-component health formula including `attendance_rate`. Current engine has four components and intentionally folds attendance into engagement. `aegis/engine/config.py` documents this deviation, and `CIPHER2_theametuers_Documentation.html` now describes four signals, but `docs/AEGIS_README_v3.md` is stale.

- `docs/AEGIS_README_v3.md:518-524` documents automated role assignment with `RoleFit`. Current engine does not assign team roles; roles only influence fit/team score. `docs/AEGIS_README_v3.md:157-159` says role assignment is student-led, so the same document contradicts itself.

- `docs/AEGIS_README_v3.md:530-557` documents `TaskFit` and task-by-task assignment. Current `phase_b_tasks.py` does capacity-proportional hour allocation with an overload cap; it does not score individual tasks by skill/role/learning/current load.

- `docs/AEGIS_README_v3.md:707-780` says Drive uses a single service account, files are embedded in the student workspace, per-student Drive Activity signals feed health, and provisioning scales in parallel. Current backend uses OAuth-as-user when a refresh token exists, has a service-account fallback, does not expose folder/file ids in `/run` or `/teams`, and the current Drive Activity path skips unattributed events on the personal-account prototype path. `WORKSPACE_GAP.md` is more accurate than this older doc.

- `docs/AEGIS_Policies_v2.md` repeatedly describes LMS attendance, Calendar, GitHub, chat, peer evaluation, quality signals, and live Drive activity as monitored sources. The current engine consumes seeded `activity_log` plus `team_monitoring`; GitHub/chat/peer/quality/calendar attendance are not implemented. Treat this as policy/target-state prose, not current backend behavior.

### Live-result claims that are not reproducible from committed code/data alone

- README and HTML/PDF docs claim a live 70-student cohort with 15 teams plus 1 exception pool, duplicate cosine `0.911`, and `11/4/0` health bands. Those values are not derivable from committed seed data; with `SUPABASE_URL` unset, the real reproducible result is 12 students, 3 teams, 0 pool, duplicate `0.9604`, and one team in each band.

- `BUILD_NOTES_PDF.md` correctly labels `0.911` and `15 teams + 1 exception pool` as live values that "could not be cross-checked against committed data." That caveat is accurate and should remain attached to all live-headline numbers.

### Backend backlog and audit docs

- `BACKEND_BACKLOG.md` is mostly accurate and still current for C2, S1, S2, S3, H1, H2, H3, and D1. Some line references are stale because files have moved, but the issues remain real.

- `ENGINE_AUDIT.md` accurately calls out the undefined `_sid`, live adapter validation gaps, non-atomic writeback, id mapping divergence, and writeback error swallowing. Those findings remain current.

- `WORKSPACE_GAP.md` accurately describes the Drive workspace state: provisioning code exists, `drive_folder_id` is persisted by the provisioner, the API/client do not expose it, no UI opens it, and the Drive-to-health loop is built but inert for attributed live engagement on the personal-account path.

- `AUTH_AUDIT.md`, `RLS_VERIFICATION.md`, `APPLY_0006_REVIEW.md`, `MORNING_RUNLIST.md`, `GO_LIVE.md`, `NEXT_STEPS.md`, and `WHATS_LEFT.md` correctly mark several live validations and `0006` application as user/live tasks rather than completed by committed code. They should not be rewritten as completed evidence unless live outputs are pasted in.

- Older broad product/design docs (`AEGIS_BUILD_PLAN.md`, `AEGIS_DESIGN_DIRECTION.md`, `PRODUCT.md`, `DESIGN_SYSTEM.md`, `architecture.md`, `setup.md`, `deployment.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `KICKOFF.md`, `MOCK_DATA_INTEGRATION_README.md`) are not all precise current-code specifications. Where they describe target features such as richer role assignment, task decomposition, or Drive embeds, they should be treated as design/product background, not verified backend implementation.

## 4. KNOWN-DEFERRED

- Open data routes are an accepted prototype risk: `/run`, `/teams`, `/alerts`, and `/students/{id}` are not currently authenticated. Docs now acknowledge this and state production should apply the same token-verified dependency used by `/admin/*`.

- PostgREST pagination/C2 is deferred. Safe at the current 70-student scale, not safe as an institutional-scale invariant.

- Governance fallback/S2 is deferred but should be fix-first before relying on the live integrity badge as production evidence.

- Non-atomic migrations/H1 and live-vs-repo schema drift/H3 are deferred, but the `0003` text-vs-UUID mismatch is severe enough that migrations are not currently a reproducible backend definition.

- `0006_staff_directory.sql` is drafted and internally well-hardened, but docs correctly say it is not applied. Applying it remains a live change-management task.

- Drive provisioning idempotency/D1 is deferred. The endpoint remains admin-only but unsafe for retries.

- Drive activity attribution is deferred. On the personal-account path, actors are not resolved to student emails, so live Drive polling mostly skips attribution and health remains representative/seed-backed unless Workspace domain delegation is added.

- `set_profile_status` no-op detection and writeback observability are deferred backend hardening items.

## Backend Submission-Readiness Verdict

Backend engine logic is submission-ready for the committed seed demo, but the live/backend submission story is not fully reproducible from the repo until the loader `_sid` bug and the `0003` project-id type mismatch are fixed or explicitly documented as live-only drift with evidence.
