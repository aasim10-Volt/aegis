# AEGIS — Claude Code Kickoff

You are building the AEGIS capstone-allocation engine and dashboard for CIPHER 2.0.
Work **phase by phase**, read before you write, and **stop at every gate** for my
go-ahead. Terse, technical, no filler.

---

## Operating rules

1. **Read before writing.** Complete the READ phase below before any code.
2. **Stop at gates.** End each phase with: what you built, test results, what's
   next — then STOP. Do not roll into the next phase without my "go".
3. **The engine is the hero.** 55 of 100 marks are the algorithm. Build the spine
   end-to-end on seed data; everything else is secondary.
4. **Use my harness.** At each phase gate, dispatch `python-reviewer` and
   `silent-failure-hunter` in parallel (read-only) on the diff; `database-reviewer`
   for any SQL. The PostToolUse audit hook runs ruff/mypy/pytest on every save —
   keep it green.

## Source of truth — read all of these first

- `AEGIS_BUILD_PLAN.md` — the build contract: locked decisions, architecture, schedule.
- `SECURITY_REVIEW.md` — env placement, RLS, secrets. Non-negotiable.
- `DESIGN_SYSTEM.md` + `design-system/` — dashboard tokens and signature components.
- `docs/AEGIS_README_v3.md` — engine logic and **all formulas** (Â=L×C, SPA, maximin, health).
- `docs/AEGIS_Integration_Setup_Guide.md` — infra/Supabase/Drive decisions.
- `docs/AEGIS_Policies_v2.md` — PDPA governance basis.
- `docs/CIPHER2_theametuers_CaseAnalysis_Main.pdf` — the **submitted** spec; viva language must match it.
- `supabase/migrations/0002_governance.sql` — admin audit/governance spine.

*(Adjust paths to wherever I placed these. If a doc is missing, ask.)*

## Hard rules (do not violate)

- **Layered architecture.** `engine/` imports NOTHING from `adapters/`, `api/`,
  `google`, or `supabase`. Dependencies point inward only.
- **One config.** Every weight/threshold lives in `engine/config.py`. No magic
  numbers anywhere else.
- **Golden tests.** Each engine phase is tested against the engineered `seed.json`.
  Tests must pass before the next phase.
- **Python end-to-end** (FastAPI). Drive (if touched) uses `google-api-python-client`,
  not Node.
- **Security.** `.gitignore` before the first `git add`. No secret in the repo. RLS
  default-deny; `profiles.role` not client-writable. Seed data is synthetic PII only.

## Decisions to surface at the first gate (don't guess — ask me)

1. **Health score components:** README + case-analysis show **5** (with
   `attendance_rate`); the integration guide drops it to **4** (engagement absorbs
   the weight, 0.30). The submitted PDF froze 5. Recommend 4 + a one-line note;
   confirm which I want.
2. **SPA ↔ maximin model:** propose "one project = one team; SPA assigns
   students→projects + oversubscription cascade; maximin swap pass rebalances after,
   without breaking SPA hard constraints." Confirm.
3. **DB access:** Prisma vs raw Supabase client for the engine's data adapter.
4. Standardise vocabulary on **"seed"** (not "anchor") in code, and drop login/admin
   from the prototype screen list (auth is unmarked).

---

## Phases

### READ — understand & plan (no code)
Read everything above. Output: (a) a short plain-language description of the engine
pipeline, (b) the four decisions above with your recommendation, (c) your file tree
for `engine/ adapters/ api/ seed/ tests/`. **STOP.**

### Phase 0 — Scaffold & seed
`.gitignore` first. Scaffold the layered tree. `engine/config.py` with all weights.
`seed.json` engineered per the build plan: confidence-tier spread (incl. a C=0.5
hero), one near-duplicate project pair, one ghosting case, one sympathy-carry case.
Smoke test loads it. **STOP.**

### Phase A — Verify
`Â = L × C` scoring (incl. C=0.5 correction) and `Fit(i,p)`. TF-IDF cosine dedupe
gate (≥0.75 → flag). Golden tests: 5/5-no-evidence → ~2.5; duplicate pair flags.
Dispatch reviewers. **STOP.**

### Phase B — Match & form
Abraham–Manlove SPA for project assignment + oversubscription cascade
(Priority = Fit + RareSkillBonus). Maximin team formation: seed rare skills → greedy
→ local-search swap (accept only if it raises the minimum team score) → exception
pool. Capacity-based task allocation, U ≤ 1.2 guard. Tests: maximin raises the min
team score; over-capacity cascades; exception pool populates. Dispatch reviewers. **STOP.**

### Phase C — Monitor
4-component (or 5, per decision 1) health score → Healthy/At-Risk/Critical.
3-tier ghosting classifier; sympathy-carry (≥0.95) + burnout (≥2× avg) flags →
Alert objects. All off the seeded `activity_log` — no live Drive needed. Tests:
ghosting case → Tier 3; sympathy case → flag. Dispatch reviewers. **STOP.**

### Phase D — API & dashboard
FastAPI: `POST /run`, `GET /teams`, `GET /alerts`, `GET /students/{id}` (adjusted
profile + rationale). Next 15 dashboard using `design-system/`: AppShell +
PipelineStepper wired to `/run`, HealthRing, EvidenceBar, alert inbox. Make the
C=0.5 correction and conflict detection **visible**. **STOP.**

### Phase E — Governance (stretch)
Base schema, then `0002_governance.sql`. Minimal admin console: pending approvals,
audit stream, override-watch, integrity badge (`audit_verify()`). `database-reviewer`
on the SQL. **STOP.**

---

## Per-phase definition of done
Tests green · reviewers run with no blocking findings · audit hook clean ·
gate report written · committed (no secrets).
