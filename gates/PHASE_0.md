# Gate report — Phase 0 · Scaffold & seed

**Status:** ✅ complete · audit hook green · reviewers run, no blocking findings open
**Date:** 2026-06-20

## What was built
- **Layered package `aegis/`** (deps point inward only):
  - `domain/models.py` — pure dataclasses: `Student`, `Project`, `SkillDeclaration`,
    `ActivityEvent`, `Cohort` (inputs, frozen); `Team`, `Task`, `Alert`, `HealthReport`,
    `SkillMatrix`, `DuplicateFlag`, `AllocationResult` (outputs). Vocab tuples
    `DISCIPLINES`, `CONFIDENCE_BASES`. No I/O, no third-party imports.
  - `engine/config.py` — **single source of every weight/threshold** (mirrors build plan §2):
    `CONFIDENCE`, `FIT_WEIGHTS`, `DEDUPE_THRESHOLD`, `RARE_SKILL_BONUS`, `TEAM_SIZE`,
    `UTIL_TARGET`, `OVERLOAD`, `HEALTH_WEIGHTS` (4-component), `HEALTH_BANDS`,
    `SYMPATHY_RATIO`, `BURNOUT_MULT`, `GHOST_TIER`.
  - `adapters/repo_seed.py` — `seed.json` → domain objects; required keys enforced
    (no silent degenerate objects); explicit coercions (no `Any` leak).
  - `api/`, `engine/`, `adapters/` packages stubbed; phase modules land in their phases.
- **`aegis/seed/seed.json`** — engineered demo (synthetic PII only): 12 students, 8 projects.
  Cases: C=0.5 hero (STU_08 tech 5→2.5), near-duplicate pair (P_02/P_03), pure ghost
  (STU_07, zero authored events), sympathy-carry (STU_01 authors 100% of STU_08's tasks;
  STU_08 present via pings so not a ghost), burnout (STU_01, 11 events), rare-skill seed
  (STU_03 UX), oversubscription (5 students rank P_01, cap 4). `_meta` documents every case.
- **Tooling:** `pyproject.toml` (ruff + mypy `disallow_untyped_defs` + pytest `pythonpath`).
- **Tests (12, all green):** seed load, exact confidence-tier counts (3/3/4/2), C=0.5 hero,
  closed disciplines, confidence vocab in sync (domain↔config), ghosting, **ownership-based
  sympathy-carry (non-tautological)**, duplicate pair, oversubscription, 4-component health
  weights sum to 1.0, and an **architecture test** enforcing engine-imports-inward-only.

## Test results
```
ruff check aegis      → All checks passed!
mypy aegis            → Success: no issues found in 12 source files
pytest -q             → 12 passed
audit hook (stdin JSON) → runs ruff+mypy+pytest, exit 0
```

## Reviewers (read-only, parallel)
Named subagents (`python-reviewer`, `silent-failure-hunter`) are **not registered** in this
environment; ran both mandates via `general-purpose` agents.

Resolved findings:
- **BLOCKING** `total_hours` defaulted to 0.0 on missing key → now a required key.
- **BLOCKING** sympathy-carry test was a tautology → rewritten ownership-based; can now fail.
- `repo_seed` lenient `.get` on `skills`/`required_skills` → made required.
- Confidence-tier test loosened to ranges → pinned to exact counts.
- Vocab drift domain↔config unguarded → added `test_confidence_vocab_in_sync`.
- STU_08 double-flag (ghost + carried) and STU_09 accidental Tier-2 → seed corrected.
- Audit hook could report success having run nothing → visible SKIPPED diagnostics + per-tool
  PATH guards added.

Deferred (non-blocking, noted): strict unknown-key rejection in the seed parser;
`int(capacity)` truncation guard.

## Harness changes made (flagging — these touched your files)
- `scripts/cc-audit.sh`: (1) resolve a real Python interpreter (`python3`→`python`→`py`);
  on this machine `python3` is the Microsoft Store stub, which made the hook a silent no-op.
  (2) Loud SKIPPED diagnostics when a tool/interpreter/file is missing.

## Next — Phase A (Verify)
`Â = L × C` scoring (incl. C=0.5 → 2.5) and `Fit(i,p)`; TF-IDF cosine dedupe gate (≥0.75 flag).
Golden tests: 5/5-no-evidence → ~2.5; P_02/P_03 flags. New dep: scikit-learn.

## Open question for you
This workspace is **not a git repo** (`git init` never run), so the DoD's "committed (no
secrets)" can't be satisfied yet. `.gitignore` is already in place and merged. Say the word
and I'll `git init` + make the first commit (gitignore is pre-staged, no secrets present).
