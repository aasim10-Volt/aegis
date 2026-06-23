# CLAUDE.md — AEGIS project memory

## Project
AEGIS — automated capstone allocation + governance engine. CIPHER 2.0, Scenario 03,
Team Amateurs. Deadline **26 Jun 10:00**. Stack: Python/FastAPI engine (`aegis/`) +
Next.js 15 / Tailwind / shadcn dashboard (`app/`) + Supabase (Postgres, RLS).

## Architecture invariants (never violate)
- `aegis/engine/` imports nothing from `aegis/adapters/` or `aegis/api/`. All weights/thresholds
  live in `aegis/engine/config.py` (`CONFIDENCE`, `DEDUPE_THRESHOLD`, `MONITORING_WINDOW_DAYS`,
  `GHOST_TIER`, `SYMPATHY_RATIO`, `BURNOUT_MULT`).
- **Env-switch:** `$env:SUPABASE_URL` set → live `repo_db`; unset → seed. Restart uvicorn to
  switch — results are `lru_cached`. There is **no** "adapter active" log line; confirm the cohort
  by **student count** (live = 70, seed = 12).
- `service_role` is **backend-only** — never `NEXT_PUBLIC_`, never client-side (SECURITY_REVIEW C1/C3).

## Current state
Engine proven on the live 70-student cohort → **15 teams + 1 exception pool**; dashboard renders
live. C1 (seed-vs-live doc reconciliation) done; PDF current. **Two runs — never cross-attribute:**
- **Seed (demo scenario):** 12 students, STU_*/P_* IDs, dup **0.96**, bands **84/69/41**, cases
  STU_08 / STU_07 / STU_01↔STU_05. Source of truth = `aegis/seed/seed.json`.
- **Live (scale result):** 70 students, UUIDs (no STU_ IDs), dup **0.911**, 15 teams + 1 pool.
  Source = live Supabase `/run` (your reported values).

PDF: `CIPHER2_theametuers_Documentation.pdf` (rendered from the throwaway `.html` via headless
Chrome — command at top of `BUILD_NOTES_PDF.md`). Live health bands for §5.2 not yet filled.

## Security posture (OWASP / PTES / NIST 800-115 / ISO 27001 / MITRE / CIS)
- `team_monitoring` BOLA (OWASP API1:2023) remediated → object-scoped RLS.
- RLS verified three-tier (toggle ≠ policy ≠ enforces); default-deny on every table.
- `handle_new_user` hard-forces role; role NEVER from `raw_user_meta_data` (privilege-escalation
  control, CIS Control 6). `enforce_role_immutable` trigger blocks self-assignment.
- `0006_staff_directory` (DRAFTED, **not applied**) adds admin/service_role-write-only allowlist;
  re-asserts the `auth.users` trigger idempotently so it stops being live-only.
- CIS Control 3: no secrets in git history (pattern-swept); synthetic `@aegis.test` seed only (RFC 2606).
- **FastAPI `/admin/*` function-level authorization (OWASP API5:2023) — REMEDIATED in code.**
  A uniform `require_admin` dependency (`aegis/api/auth.py`) gates every admin route: live path
  requires a token-verified identity whose authoritative `profiles.role='admin'` (never client
  metadata), or the service_role key (constant-time compared); seed path serves static demo data
  as public read-only (grants no admin identity). Unauth→401, non-admin→403 (tested). Frontend
  (`lib/api.ts`) sends the logged-in user's Supabase JWT on `/admin/*`. Demo prereq: the demo
  Google account must have `profiles.role='admin'` or Governance 401s.

## Remaining (mine — hands-on-system; see GO_LIVE.md / NEXT_STEPS.md)
1. **Live capture** (`CAPTURE_SESSION.md`): verify 0.911 / 15 teams + 1 pool, record health-band
   distribution; capture FIG 1 (live), FIG 2/3 (seed).
2. **Fill bands + re-render**: live distribution into HTML §5.2 + `BUILD_NOTES_PDF.md` framing
   table; drop 3 PNGs; re-render PDF. If live cosine ≠ 0.911, update — invent nothing.
3. **Apply 0006**: read the BEFORE-YOU-APPLY header, confirm live `profiles` columns match the
   INSERT list, apply non-prod first then live (modifies live auth — apply watching, ISO 27001
   A.12.1.2). Seed real staff via `staff_directory_seed.local.sql` (gitignored).
4. **Incognito login tests** both roles; T-minus-30 checklist (GO_LIVE STEP 4); commit + push.

## Deferred backlog (post-submission, non-blocking — `BACKEND_BACKLOG.md` / §6)
- **C2** repo_db ~1000-row PostgREST cap → silent data loss (`aegis/adapters/repo_db.py`).
- **S1** `set_profile_status` silent no-op on zero-row match.
- **S2** governance fallback masks live failure; integrity badge fail-open (**fix first**).
- **H1/H3** non-atomic migrations + live↔repo schema drift, no down-migrations.
- **S3** duplicate/overlapping `profiles` RLS policy generations (0001 vs 0004).
None can fire at current scale (70 students, single trusted operator, demo-controlled inputs).

## Working rules
- Don't touch engine logic (`aegis/engine/`) without flagging.
- Show migrations before applying to live; audit-first on the live DB.
- Commit a checkpoint before risky changes; everything reversible behind git.
- Don't read `.env` / `.env.local`. Don't cross-attribute seed and live numbers.
