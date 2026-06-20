# AEGIS — Phase 2 Build Plan (CIPHER 2.0)
### 6-day prototype · Deadline 26 June 2026, 10:00 AM

This plan is the build contract. It supersedes the screen list and any "build-it-all"
reading of `AEGIS_README_v3.md`. The README is the **documentation** source of truth;
this file is the **build** source of truth. Where they disagree, this file wins for the
prototype scope.

---

## 0. Locked decisions (do not reopen mid-week)

| Decision | Choice | Why |
|---|---|---|
| Language | **Python + FastAPI, end-to-end** | `matching` (SPA) and scikit-learn (TF-IDF) are Python. No two-language split, no Day-5 surprise. |
| SPA ↔ maximin model | **One project = one team.** SPA assigns students→projects (+ oversubscription cascade); maximin swap pass rebalances teams afterward without breaking SPA hard constraints. | SPA does project assignment; maximin does skill balance. They are different objectives, run in sequence. |
| Auth | **Mock role toggle** ("View as Lecturer / Student / Admin") | Slide explicitly skips login/auth. Real auth = 0 marks. |
| Google Drive | **Documented, not built.** `activity_log` is **seeded**. | Drive is OAuth/quota plumbing, not core-logic marks. Phase C must run fully offline. Real Drive = Day-6 stretch only. |
| Persistence | **SQLite (or local Postgres in Docker)** | Removes cloud/network/RLS dependency. Engine reads seed → objects, runs, writes results. DB is an adapter, not a requirement. |
| Health Score | **4-component** (drop `attendance_rate`; engagement absorbs its weight → 0.30) | Integration guide v2 decision. README's 5-component line is stale — fix it. |

### Inconsistencies to fix before coding (viva will catch these)
1. Health score: use the **4-component** formula everywhere. Update the README line that still shows 5 components.
2. README "Prototype Scope" lists Login + Admin panel as screens — **remove** (slide says skip auth).
3. Terminology: "anchor clustering" vs "seed" drifts across docs. Standardise on **seed** in code, PDF, and viva.

---

## 1. Repository structure (layered — dependencies point inward only)

```
aegis/
  domain/                 # pure data types. No logic, no I/O.
    models.py             #   Student, Project, Team, Task, Alert, SkillMatrix, HealthReport
  engine/                 # THE 55 MARKS. Imports NOTHING from adapters/ api/ google/ supabase.
    config.py             #   every weight + threshold lives here. No magic numbers anywhere else.
    phase_a_scoring.py    #   Â = L × C  ;  Fit(i,p)
    phase_b_dedupe.py     #   TF-IDF cosine gate (≥ 0.75 → flag)
    phase_b_match.py      #   Abraham–Manlove SPA, Priority = Fit + RareSkillBonus
    phase_b_teams.py      #   maximin formation: seed → greedy → swap ; exception pool
    phase_b_tasks.py      #   capacity-share allocation, U ≤ 1.2 guard
    phase_c_health.py     #   4-comp health score, ghosting tiers, sympathy carry
    pipeline.py           #   orchestrates A→B→C. Pure. Returns one AllocationResult object.
  adapters/               # impure edges
    repo_seed.py          #   seed.json → domain objects
    repo_db.py            #   (optional) SQLite/Supabase read+write
    drive.py              #   (STRETCH only) provisioning + activity poll
  api/
    main.py               #   FastAPI: POST /run, GET /teams, GET /alerts, GET /students/{id}
  web/                    # plain UI (React/Next or static HTML+fetch). Pretty is optional.
  seed/
    seed.json             #   the demo script, engineered deliberately (see §3)
  tests/
    test_phase_a.py ...   #   golden-file tests against the engineered seed
```

**The one rule that protects functionality:** `engine/` never imports from `adapters/`,
`api/`, `google`, or `supabase`. A Drive or DB change then *cannot* silently break matching.

---

## 2. config.py — single source of all tunables

```python
# engine/config.py
CONFIDENCE = {"verified": 1.0, "portfolio": 0.8, "self_report": 0.6, "contradicted": 0.5}

FIT_WEIGHTS   = {"skill": 0.50, "avail": 0.30, "role": 0.20}
RARE_SKILL_BONUS = 15            # Priority bump when student fills a scarce critical skill
DEDUPE_THRESHOLD = 0.75          # cosine similarity → flag for review

HEALTH_WEIGHTS = {"task_completion": 0.30, "workload_balance": 0.25,
                  "engagement": 0.30, "milestone": 0.15}   # sums to 1.0, 4-component
HEALTH_BANDS   = {"healthy": 75, "at_risk": 50}            # ≥75 healthy, 50–74 at-risk, <50 critical

UTIL_TARGET    = (0.7, 1.0)      # target utilisation band
OVERLOAD       = 1.2             # U > 1.2 → rebalance
SYMPATHY_RATIO = 0.95            # contribution ratio on someone else's task
BURNOUT_MULT   = 2.0             # U(i) ≥ 2× team avg → sympathy-carry risk

GHOST_TIER     = {"tier1_drop": 0.40, "tier2_days": 6, "tier3_days": 10}
TEAM_SIZE      = (4, 5)          # permitted range
```

Tuning never means editing formula code. "Where do the weights live?" → one file.

---

## 3. seed.json — engineer it, don't randomise it

The seed **is** the demo. Build the cases that make each formula visibly fire:

- **Confidence spread:** ≥2 students at C=1.0, ≥2 at C=0.8, ≥3 at C=0.6, **1–2 at C=0.5**
  (the Dunning-Kruger correction — most convincing demo moment).
- **One C=0.5 hero:** declares 5/5 with no evidence → engine discounts to ~2.5 → placement
  reflects real ability. Show before/after on screen.
- **Project abstracts:** 8–10 as full paragraphs (TF-IDF needs real text), with **one deliberate
  near-duplicate pair** to trip the ≥0.75 gate on camera.
- **Activity (seeded into `activity_log`):** one **ghosting** case (0 activity 10+ sim-days → Tier 3),
  one **sympathy-carry** case (one student covers >95% of a teammate's tasks), plus 2–3 healthy
  baselines for contrast.
- **One rare-skill holder** the SPA cascade must place first, to demo the RareSkillBonus.

---

## 4. Six-day schedule

### Day 1 — Lock + scaffold (no engine logic yet)
- Apply all §0 decisions; fix the three doc inconsistencies.
- Scaffold the §1 tree; put every weight in `config.py`.
- Write `seed.json` to the §3 spec.
- Stand up `repo_seed.py` (seed → domain objects) and a smoke test that loads it.

### Day 2 — Phase A + dedupe (pure, tested)
- `Â = L × C` scoring incl. C=0.5 correction; `Fit(i,p)`.
- TF-IDF cosine gate (~15 lines, scikit-learn).
- Golden tests: 5/5-no-evidence → ~2.5; duplicate pair flags.

### Day 3 — Phase B match + teams (the hero feature)
- Wire `matching` SPA for project assignment + oversubscription cascade (Priority = Fit + RareSkillBonus).
- Hand-roll maximin formation: seed rare skills → greedy expansion → local-search swap (accept only if it raises the **minimum** team score) → exception pool.
- Tests: maximin raises min team score; over-capacity cascades; exception pool populates.

### Day 4 — Phase C + tasks
- Capacity-share task allocation (`Task_Share = cap(i)/Σcap`), U ≤ 1.2 rebalance.
- 4-component health score → Healthy/At-Risk/Critical bands.
- Ghosting 3-tier classifier; sympathy-carry (≥0.95) + burnout (≥2× avg) flags → Alert objects.
- Tests: ghosting case → Tier 3; sympathy case → flag.

### Day 5 — API + plain UI + demo narrative
- FastAPI: `POST /run`, `GET /teams`, `GET /alerts`, `GET /students/{id}` (adjusted profile + rationale).
- 3-state UI: cohort input → **Run Allocation** → results (teams + allocation rationale + **conflict/alert panel**).
- Make these **visible** (zero-cost wow): Dunning-Kruger before/after, flagged duplicates, exception pool, alert queue.
- Record demo video (Drive link, shared access).

### Day 6 — Docs + submission + buffer
- `CIPHER2_[TeamName]_Documentation.pdf` (3–5 pp): problem, solution, **core logic**, architecture, limitations — pull straight from README; add the "documented, not built" scaling section.
- Public repo + README (setup/usage). **Check the exact filename** — naming errors lose marks.
- Submit via portal (latest resubmit = final).
- **Stretch only if green:** real Drive provisioning + iframe embed as a live flourish.

---

## 5. Conflict detection — make it a first-class, visible output

"Conflict detection" is its own slide column. Surface all four conflict types in the alert panel,
each traceable to a seed case:

| Conflict | Engine source | Visible as |
|---|---|---|
| Duplicate projects | `phase_b_dedupe` cosine ≥ 0.75 | "2 projects flagged for review" + similarity score |
| Over-subscription | SPA capacity cascade | rejected students cascading to next preference |
| Unplaceable student | hard-constraint break | exception pool with full context |
| Disengagement / overload | `phase_c_health` | Tier 1/2/3 ghosting + sympathy-carry alerts |

---

## 6. Marking criteria → where the marks come from

| Criterion | Marks | Covered by |
|---|---|---|
| Functionality | 30 | Spine runs end-to-end on seed, no crashes, clear input→output |
| Algorithm & Logic | 25 | SPA + maximin + evidence weighting + dedupe, each golden-tested |
| Feasibility & Impact | 20 | PDF scaling section + PDPA/ethics policy (already written) + realistic data-collection story |
| Technical Implementation | 15 | Layered architecture, config-driven, test suite |
| Innovation & Presentation | 10 | Dunning-Kruger correction firing live + transparent conflict panel + demo narrative |

**55 of 100 marks are the pure engine.** Protect it: build the spine first, keep `engine/`
dependency-free, test against the engineered seed, and relegate everything else to the PDF.
