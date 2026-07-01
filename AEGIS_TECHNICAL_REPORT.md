# AEGIS — Technical Report
## Automated Evidence-Guided Intelligent System for Capstone Team Allocation

---

**Team:** Team Amateurs  
**Challenge:** CIPHER 2.0 — Scenario 03  
**Institution:** Informatics Institute of Technology  
**Repository:** https://github.com/ZAID-EHT/Aegis-Workspace.git  
**Date:** 26 June 2026  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Allocation Engine Pipeline](#3-allocation-engine-pipeline)
4. [Monitoring and Alerting](#4-monitoring-and-alerting)
5. [Security Posture](#5-security-posture)
6. [Verification and Test Results](#6-verification-and-test-results)
7. [Known Issues and Deferred Backlog](#7-known-issues-and-deferred-backlog)
8. [Demo Access](#8-demo-access)
9. [Conclusion](#9-conclusion)

---

## 1. Executive Summary

AEGIS is a full-stack, evidence-weighted capstone allocation and governance engine built for the CIPHER 2.0 Scenario 03 challenge. It addresses the core failure modes of group project allocation — mismatched skills, disappearing members, duplicate project ideas, and undetected burnout — by replacing manual guesswork with an explainable, auditable pipeline.

The system comprises two independently deployable components: a Python/FastAPI allocation engine and a Next.js 15 role-based dashboard backed by Supabase Postgres with row-level security. The engine has been run end-to-end against a live cohort of 73 students, forming 15 project teams and one faculty exception pool, raising 6 governance alerts, and detecting one near-duplicate proposal pair with a cosine similarity of 0.911.

The engine passed 93 automated tests. A hard architectural invariant — enforced by a dedicated test — ensures the core engine module imports nothing from adapters, API layers, or any external framework.

---

## 2. System Architecture

AEGIS is split into two independently deployable tiers that communicate over HTTP.

### 2.1 Engine (`aegis/`, Python 3.13 / FastAPI)

The engine is a pure allocation pipeline. Its core (`aegis/engine/`) has no database, no HTTP, and no framework dependencies. All weights and thresholds live in a single configuration file (`aegis/engine/config.py`). The engine receives a `Cohort` domain object from an adapter and returns a fully computed `RunResult`.

```
aegis/
├── engine/       ← pure allocation logic, no external imports
│   ├── config.py           weights, thresholds, tier definitions
│   ├── phase_a_scoring.py  evidence-weighted skill adjustment
│   ├── phase_b_dedupe.py   TF-IDF duplicate detection
│   ├── phase_b_match.py    Abraham-Manlove SPA
│   ├── phase_b_teams.py    maximin team formation
│   ├── phase_b_tasks.py    capacity-proportional task allocation
│   └── phase_c_health.py   four-signal health scoring + alerts
├── adapters/     ← data-source swap (seed JSON ↔ live Supabase)
├── api/          ← thin FastAPI surface, admin auth, serialisation
└── tests/        ← 93 tests including architecture boundary enforcement
```

**Environment switch.** Setting `$SUPABASE_URL` routes the adapter to live Supabase; unsetting it loads the bundled seed cohort. Results are `lru_cached` per process — restart Uvicorn to switch sources. This makes offline development and CI require zero setup.

### 2.2 Dashboard (`app/`, Next.js 15 / React 19 / Tailwind v4 / shadcn)

Role-based screens are served for three personas:

| Role | Scope |
|---|---|
| Student | Own workspace, team health, task view, placement rationale, real-time team chat |
| Lecturer | All supervised teams, alert inbox, one-click allocation trigger |
| Admin | Pending approvals, override log, audit-chain integrity check, governance panel |

Authentication is provided by Supabase Auth with Google OAuth. Route gating is applied in `middleware.ts`. All authorisation is enforced in the database via row-level security, not the frontend. The dashboard calls the engine API for allocation results and subscribes to team chat messages via Supabase Realtime.

### 2.3 Data Layer (Supabase / Postgres)

The schema is defined as six ordered SQL migrations (`0001` through `0006`). Key tables include `profiles`, `students`, `skills_declared`, `projects`, `teams`, `team_members`, `tasks`, `activity_log`, `alerts`, `audit_log`, and `team_monitoring`. RLS policies enforce a three-tier object-scoped access model: students see only their own team data, lecturers see only their assigned cohorts, and admins have full read access.

---

## 3. Allocation Engine Pipeline

The engine runs in four sequential phases. Each phase hands a typed result to the next.

### Phase A — Evidence-Weighted Scoring

A declared skill level is never taken at face value. It is multiplied by a confidence factor derived from how well the claim can be backed up:

```
Adjusted Score  =  Declared Level  ×  Confidence
```

| Basis | Confidence |
|---|---|
| Verified grade | 1.0 |
| Portfolio item | 0.8 |
| Self-report (no evidence) | 0.6 |
| Contradicted by throughput | 0.5 |

When a student's throughput contradicts their declared level the system marks `corrected=True` in the API response (the Dunning-Kruger case), so lecturers can see why a high self-rating was discounted.

### Phase B — Duplicate-Idea Gate

Before matching, project abstracts are compared using TF-IDF cosine similarity (scikit-learn `TfidfVectorizer`, English stop-word removal). Any pair scoring `>= 0.75` is flagged as a `DuplicateFlag` and surfaced to the governance panel for human review. On the live cohort a pair scored `0.911`, which is the highest-priority flag returned by the current run.

### Phase C — Stable Preference Matching

Students and projects submit ordered preference lists. The engine solves allocation using the Abraham-Manlove Student-Project Allocation (SPA) algorithm via the `matching` library with `optimal="student"`. This guarantees a stable matching: no student and project pair exists who would both prefer each other over their current assignment.

### Phase D — Maximin Team Formation

Once projects are allocated, the engine forms teams using a local-search maximin objective. A swap is accepted only if it raises the minimum team score across all teams — never if it merely raises the average. This directly encodes the fairness goal: no team should be left far behind. Hard constraints (capacity limits, role requirements) are checked before every swap is accepted.

### Phase E — Task Allocation

Tasks are assigned proportionally to member capacity with an overload cap of 1.2× (`OVERLOAD` in `config.py`). Unallocated hours are returned per team so lecturers can see slack or overcommitment.

### Live Run Results (June 25, 2026)

| Metric | Live Cohort | Seed Demo |
|---|---|---|
| Students | 73 | 12 |
| Projects | — | 8 |
| Teams formed | 15 | 3 |
| Exception pool | 4 students | 0 students |
| Duplicate cosine | 0.911 | 0.9604 |
| Monitoring alerts | 6 | 5 |
| Health: Healthy | 11 | 1 |
| Health: At Risk | 4 | 1 |
| Health: Critical | 0 | 1 |

---

## 4. Monitoring and Alerting

After team formation the engine evaluates each team's health using four signals with defined weights:

| Signal | Weight |
|---|---|
| Engagement | 0.30 |
| Task completion | 0.30 |
| Workload balance | 0.25 |
| Milestone progress | 0.15 |

Weights are renormalised when monitoring components are absent (early-semester runs with incomplete data). Teams are banded as **Healthy** (`>= 75`), **At Risk** (`>= 50`), or **Critical** (`< 50`).

Three alert trigger types are evaluated against configurable thresholds:

- **Ghosting** — Tier 2 at 6 zero-input days; Tier 3 at 10 days (`GHOST_TIER` in `config.py`).
- **Sympathy carry** — Fired when one member's authored footprint exceeds `0.95` of the team total (`SYMPATHY_RATIO`).
- **Burnout** — Fired when one member's footprint is `>= 2×` the team average (`BURNOUT_MULT`).

Every alert is a review prompt for the supervising lecturer — not an automatic penalty. The dashboard surfaces the alert type, detail, and target team or student. Alerts do not modify a student's academic standing without a faculty override, which is itself recorded in the audit log.

---

## 5. Security Posture

Security controls are applied at the database, API, and deployment layers. Key remediations are mapped to the OWASP API Security Top 10 (2023).

### 5.1 Broken Object-Level Authorisation (OWASP API1:2023) — Remediated

`team_monitoring` and all core tables are protected by object-scoped RLS policies. The default posture is deny: every table has RLS enabled and no anonymous key can read records it is not entitled to. Students' policies join via `team_members`; lecturer policies join via `lecturer_cohorts`. No object can be reached across team or cohort boundaries.

### 5.2 Function-Level Authorisation (OWASP API5:2023) — Remediated

All `/admin/*` routes are mounted under a single `APIRouter` with a uniform `Depends(require_admin)` dependency (`aegis/api/auth.py`). This dependency:
1. Verifies the caller's Supabase JWT.
2. Reads the authoritative `profiles.role` from the database — never from `user_metadata`.
3. Returns `401` for unauthenticated requests and `403` for authenticated non-admins.

The service role key is never exposed to the client. It is used only server-side, never with a `NEXT_PUBLIC_` prefix.

### 5.3 Role Immutability (CIS Control 6)

The `handle_new_user` database trigger hard-forces role assignment from the `staff_directory` allowlist or falls back to `'student'`. A second trigger, `enforce_role_immutable`, blocks any subsequent `UPDATE` to `profiles.role` by a non-service-role caller. Privilege escalation via the client is structurally impossible.

### 5.4 Team Chat RLS (OWASP API1:2023)

The `messages` table (Supabase Realtime) carries three-tier policies: students may insert only where `sender_id = auth.uid()` and read only their own team's messages; lecturers read all messages across their cohorts; admins have full read. Realtime subscriptions respect these policies — a student subscriber cannot receive messages from another team's channel.

### 5.5 Secrets and Repository Hygiene (CIS Control 3)

- `service_role` key: backend-only, gitignored, never in any `NEXT_PUBLIC_` variable.
- Seed data uses synthetic `@aegis.test` identities (RFC 2606 reserved domain) — no real student PII in the repository.
- Git history has been swept for credential patterns (`gitleaks`-compatible scan); no secrets are present in committed history.

---

## 6. Verification and Test Results

### 6.1 Automated Test Suite

The backend test suite runs with `python -m pytest`. All 93 tests pass.

```
python -m pytest -p no:cacheprovider
93 passed
```

Coverage includes unit tests for each engine phase, adapter unit tests for seed and live row mapping, FastAPI integration tests via `TestClient`, and a dedicated architecture boundary test that scans `aegis/engine/*.py` for forbidden imports (`adapters`, `api`, `google`, `supabase`, `fastapi`). The architecture invariant cannot be silently broken.

### 6.2 Seed Pipeline Verification

With `SUPABASE_URL` unset the engine was run directly against the committed seed cohort and confirmed:

- 12 students, 8 projects, 3 teams, 0 exception-pool students
- Duplicate pair `P_02/P_03` at cosine `0.9604`
- Health bands: 1 healthy / 1 at risk / 1 critical (representative scores ~84 / ~69 / ~41)
- 5 alerts fired: `health_at_risk`, `sympathy_carry`, `burnout`, `health_critical`, `ghosting_tier3`

### 6.3 Live API Verification

`POST /run` against the deployed Railway backend (June 25, 2026) returned:

```json
{
  "teams": 15,
  "alerts": 6,
  "exception_pool": 4,
  "students": 73,
  "duplicate_flags": 1
}
```

`GET /health` returns `{"status":"ok"}`. The backend is deployed at Railway; the frontend dashboard is deployed separately and calls the engine via `NEXT_PUBLIC_API_URL` baked into the Next.js build at compile time.

---

## 7. Known Issues and Deferred Backlog

The following issues are documented and tracked. None affect the demo scenario at current scale; all are deferred post-submission.

| ID | Severity | Description |
|---|---|---|
| C2 | High | PostgREST default cap (~1000 rows) can silently truncate large live reads. Safe at 73 students; not safe at institutional scale. |
| S1 | Medium | `set_profile_status` reports success even when zero rows are matched (stale or typo profile ID). |
| S2 | Medium | Governance fallback returns seed data on live read failure — the integrity badge can appear verified when the live check fails. |
| H1 | Medium | Migrations are not fully atomic; `0003_engine_fields.sql` has a type mismatch (`uuid` FK referencing a `text` PK) that would fail on a clean replay. |
| H3 | Medium | Live schema may have drifted from migration files as the only source of truth. |
| S3 | Low | Overlapping RLS policy generations from migrations `0001` and `0004` on the `profiles` table. |

---

## 8. Demo Access

Three pre-seeded judge accounts are available for the evaluation session. These are throwaway accounts on synthetic demo data — no real student PII is accessible through any of them. All three bypass the Google OAuth flow and use email/password login directly.

### 8.1 Login URL

Navigate to the deployed frontend and click **"Sign in with email"** (not the Google button) to use password-based login.

**Frontend:** https://aegis-production.up.railway.app

### 8.2 Judge Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Student | `judge.student@aegis.test` | `AegisJudge-Student-2026` | Own workspace, team health, task view, placement rationale, team chat |
| Lecturer | `judge.lecturer@aegis.test` | `AegisJudge-Lecturer-2026` | All supervised teams, alert inbox, allocation trigger |
| Admin | `judge.admin@aegis.test` | `AegisJudge-Admin-2026` | Monitoring, governance panel, audit log, integrity check, approvals |

### 8.3 Recommended Demo Flow

1. **Student view** — sign in as `judge.student@aegis.test`. The workspace shows the student's team placement, health score, teammates, and the skill-adjusted rationale behind the allocation. The team chat panel is visible in the workspace.

2. **Lecturer view** — open a second incognito window, sign in as `judge.lecturer@aegis.test`. The monitoring dashboard shows all 15 teams, the 6 active alerts (ghosting, burnout, sympathy carry), and the pipeline stepper. Click **Run pipeline** to trigger a live allocation against the 73-student Supabase cohort.

3. **Admin view** — sign in as `judge.admin@aegis.test`. The governance panel shows the hash-chained audit log, pending account approvals, override history, and the integrity check (`verified=true` when the chain is intact).

### 8.4 Backend API

The FastAPI engine is separately accessible for technical review:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Returns `{"status":"ok"}` |
| `/run` | POST | Runs the full allocation pipeline against the live cohort |
| `/teams` | GET | Returns the current team formation result |
| `/alerts` | GET | Returns all active monitoring alerts |

**Backend:** https://aegis-backend-production-1ada.up.railway.app

> **Note:** `/admin/*` endpoints require a valid Supabase JWT from a logged-in admin account. Use the frontend Governance panel to view admin-gated data rather than calling the API directly.

---

## 9. Conclusion

AEGIS delivers a working, tested, and deployed allocation and monitoring system against a live 73-student cohort. The engine produces explainable results — every adjusted score, every alert, and every team placement is derivable from documented weights and thresholds that live in a single configuration file. The governance model keeps a human in the loop for every consequential decision. Security controls are applied at the database layer, not the UI, ensuring they cannot be bypassed by direct API calls.

The system is submission-ready for the CIPHER 2.0 Scenario 03 demo. The seed scenario is fully reproducible from the committed repository with no environment setup. The live scenario is reproducible with `SUPABASE_URL` set to the live Supabase project.

**Repository:** https://github.com/ZAID-EHT/Aegis-Workspace.git

---

*AEGIS — Team Amateurs | CIPHER 2.0 Scenario 03 | Informatics Institute of Technology | June 2026*
