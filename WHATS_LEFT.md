# WHAT'S LEFT — final state report

Snapshot after the autonomous RLS-verify + doc-finalization pass. Everything below the line is
**yours** (needs eyes on the running system or values only your live run produces). Everything above
is done and committed.

## ✅ Done (committed this pass)
- **Doc finalization (TASK 2).** Confirmed no stale single-run / "0.96 live" language in
  `BUILD_NOTES_PDF.md` or §5.2 — both already on the two-run framing. **PDF re-rendered cleanly:**
  exit 0, **194 KB** (~190 KB target), FIG placeholders intact and run-labeled (FIG1 → live §5.2,
  FIG2/FIG3 → seed §5.1). Glyphs render via the verified Chrome path + named entities. Live
  health-band cell left as **"not separately reported"** (awaiting your capture values).
- **RLS verification status (TASK 1).** `RLS_VERIFICATION.md` written — documents that the check was
  **not** auto-run (it mutates-then-rolls-back so it isn't read-only; needs the superuser SQL Editor;
  and it tests governance *triggers*, not RLS — real RLS proof is the anon-key REST test). Includes
  the manual runbook + PASS/FAIL placeholders + interpretation.
- **Backend backlog (TASK 3).** `BACKEND_BACKLOG.md` — C2/S1/S2/S3/H1/H2/H3 grounded in the actual
  code with fix/effort/standard, ranked as the audit did, all marked POST-SUBMISSION non-blocking.
  P2/P3 carried as polish-tier (specifics to confirm from the source review — not invented).
- **0006 review pack (TASK 4).** `APPLY_0006_REVIEW.md` — verbatim `handle_new_user` body + RLS
  policy with both invariants called out, plus ordered apply steps and incognito login tests.
- **Prior passes (already in repo):** `CAPTURE_SESSION.md`, `AUTH_AUDIT.md`, `NEXT_STEPS.md`,
  `GO_LIVE.md`, `0006_staff_directory.sql` (DRAFT, not applied), `staff_directory_seed.example.sql`,
  gitignore rules (incl. `scripts/seed_demo_users.py`).

## ⛔ Remaining — yours (needs the running system / your live data)
1. **Live capture session** (`CAPTURE_SESSION.md`): start backend+frontend, confirm live cohort via
   **student count = 70**, run `/run`, verify **cosine 0.911** + **15 teams + 1 exception pool**,
   record the **health-band distribution**.
2. **Three FIG screenshots**: FIG1 from the **live** run; FIG2 + FIG3 from the **seed** run (restart
   uvicorn without `SUPABASE_URL` to switch). Crop per `CAPTURE_SESSION.md §4`.
3. **Fill live bands + re-render**: drop the distribution into §5.2 + the `BUILD_NOTES_PDF.md`
   framing table ("not separately reported" cell), insert the 3 PNGs into the `.figbox` blocks,
   re-render the PDF. If cosine ≠ 0.911, update the number everywhere (invent nothing).
4. **Run RLS/governance verification** (`RLS_VERIFICATION.md`): Check A in the SQL Editor (4× PASS),
   Check B anon-key REST (`[]` + role-lock rejected). Paste outputs; then upgrade §4 to "enforcing
   on live".
5. **Apply 0006** (`APPLY_0006_REVIEW.md`): schema pre-check → non-prod → live → seed staff from the
   gitignored `*.local.sql`.
6. **Login tests** (incognito): one supervisor email (→ lecturer/approved) + one student email
   (→ student/pending); spot-check non-admin cannot write `staff_directory`.
7. **Judge access** (`GO_LIVE.md` T-30): every judge email in **both** consent Test users and
   `staff_directory`; confirm the two password fallback accounts work.
8. **Final commit + push** to the public repo (confirm `.env*`, `*_seed.local.sql`, and
   `scripts/seed_demo_users.py` stay ignored).

## Decision still open
- **Live health bands** — still "not separately reported". Supply the distribution from step 1 and I
  (or you) fill §5.2 + the framing table; otherwise it ships truthfully as-is.

## Guardrails honoured this pass
No live-DB mutation · no migration applied · engine (`aegis/`) untouched · `.env` never printed ·
all artifacts reversible and committed.
