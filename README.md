# AEGIS

AEGIS is a capstone team platform built for the CIPHER 2.0 challenge at the Informatics Institute of Technology. It helps a faculty form balanced project teams from real evidence, then keeps an eye on each team through the semester so no single student ends up carrying the group.

The repository holds a working full-stack system: an evidence-weighted allocation **engine** (Python/FastAPI) and a role-based **dashboard** (Next.js) backed by Supabase. The engine has been run end-to-end on a live 70-student cohort, producing 15 teams plus an exception pool, and the dashboard renders that result live.

## What it does

The idea behind AEGIS is simple. Group projects fall apart in predictable ways: one person does everything, someone quietly disappears, two teams pick the same idea, or a student gets placed somewhere that does not match their skills. AEGIS tries to handle each of those problems with a clear, explainable process instead of guesswork.

There are three sides to the product.

Students see their own dashboard: their tasks, their contribution score, their team's health, and the reasoning behind their placement. Everything the system tracks about them is shown to them, and they can appeal a placement if it feels wrong.

Faculty get an overview of every team they supervise, an alert inbox for problems that need attention, and a one-click team formation run. Nothing the system flags turns into a decision on its own. A lecturer reviews it first.

Admins manage users, cohorts, and the scoring rules, and can see the health of the underlying services through a governance and audit view.

## Key features

- Role-based experience for students, faculty, and admins, backed by Supabase Auth and row-level security
- Evidence-weighted skill scoring, where a declared skill is adjusted by how well it can be backed up (`Â = L × C`)
- Team formation using a maximin objective (lift the weakest team) combined with stable preference matching (Abraham–Manlove SPA)
- A duplicate-idea gate (TF-IDF cosine) so two teams do not unknowingly build the same project
- Health monitoring that flags ghosting, uneven workloads, and burnout on a regular cycle
- A hash-chained governance audit log with an integrity check over every allocation run
- A consent step and data-governance model written around Sri Lanka's PDPA No. 9 of 2022
- An appeals window so placements can be challenged before they are final

## Architecture

The system is two pieces that talk over HTTP.

**Engine (`aegis/`, Python 3.13 / FastAPI).** A pure allocation pipeline with no framework or database dependencies in its core, run through phases:

- **Phase A — scoring** (`engine/phase_a_scoring.py`): adjusts each declared skill by a confidence factor (`Â = L × C`).
- **Phase B — formation** (`engine/phase_b_*.py`): duplicate-idea dedupe, stable preference matching, maximin team formation, and task allocation.
- **Phase C — health** (`engine/phase_c_health.py`): ghosting, burnout, and sympathy-carry monitoring over a sprint window.
- **Phase D — API** (`api/main.py`): a thin FastAPI surface that loads a cohort, runs the pipeline, and serialises the result.

A hard architectural invariant keeps the core clean and is enforced by a test (`tests/test_architecture.py`): **`engine/` imports nothing from `adapters/` or `api/`.** All weights and thresholds live in `engine/config.py`.

The engine reads its cohort through an **adapter** (`adapters/`). The data source is chosen at runtime by an environment switch: if `SUPABASE_URL` is set it loads the **live** Supabase cohort; if unset it loads the bundled **seed** cohort, so offline development and tests run with zero setup. Results are cached, so restart the API to switch sources.

**Dashboard (`app/`, Next.js 15 / React 19 / Tailwind v4 / shadcn).** Role-based screens for students, faculty, and admins. Authentication and data go through Supabase (`@supabase/ssr`), with route gating in `middleware.ts` and authorization enforced in the database via row-level security. The dashboard calls the engine API for allocation results and Google Drive (read-only metadata) for activity monitoring.

**Data (`supabase/`).** Postgres schema, RLS policies, and the governance/audit model are defined as ordered SQL migrations (`migrations/0001`–`0006`).

## Tech stack

**Engine**

- Python 3.13, FastAPI + Uvicorn
- scikit-learn (TF-IDF cosine for the duplicate-idea gate)
- `matching` (Abraham–Manlove SPA for preference matching)
- `supabase` (live data adapter)

**Dashboard**

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui, lucide-react, framer-motion
- `@supabase/ssr` + `@supabase/supabase-js` for auth and data
- `googleapis` for Drive activity polling
- pnpm for package management

**Backend services**

- Supabase (Postgres, Auth, row-level security) for data and sign-in
- Google Drive API for activity monitoring, read by metadata only
- Resend for transactional email such as faculty check-ins

See `architecture.md` for the full design and `docs/` for setup, deployment, and integration notes.

## Folder structure

```
.
├── aegis/                     The Python allocation engine + API
│   ├── engine/                Pure pipeline: phases A–C + config (weights/thresholds)
│   ├── api/                   FastAPI surface (phase D)
│   ├── adapters/              Cohort loaders: seed, live Supabase (repo_db), mock
│   ├── domain/                Core data models
│   ├── governance/            Hash-chained audit log + integrity check
│   ├── seed/                  Bundled demonstration cohort (seed.json, governance.json)
│   └── tests/                 pytest suite (incl. the engine-isolation guard)
├── app/                       Next.js dashboard (student / faculty / admin routes)
├── components/                React UI (aegis, dashboard, shadcn ui)
├── lib/                       Frontend helpers: api client, supabase, google, nav
├── middleware.ts              Route-gating + session refresh
├── supabase/
│   ├── migrations/            Ordered SQL: schema, governance, RLS, auth (0001–0006)
│   └── INTEGRATION.md         Backend integration notes
├── scripts/                   Data loaders + Drive/OAuth utilities
├── pyproject.toml             Python project + tooling (ruff, mypy, pytest)
├── package.json               Dashboard dependencies + scripts
└── aegis-platform-v2.html     Earlier single-file UI concept (superseded by app/)
```

## Setup

You need two processes: the engine API and the dashboard.

### Requirements

- Python 3.13+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and pnpm
- (Optional, for live data) a Supabase project, a Google Cloud project with the Drive API, and a Resend account

### 1. Run the engine API

The engine runs from the repo root (no packaging step needed — `pyproject.toml` puts the root on the path). Install the dependencies with uv, then start Uvicorn:

```bash
# from the repo root
uv venv                              # create a virtual environment
uv pip install -e .                  # install aegis + its dependencies
uv run uvicorn aegis.api.main:app --reload
```

With no environment configured, the API serves the **bundled seed cohort** — no database needed. To run against **live** Supabase data, set `SUPABASE_URL` (and the service role key) before starting Uvicorn; restart to switch sources.

`POST /run` executes the full A→B→C pipeline. Other endpoints: `GET /teams`, `GET /alerts`, `GET /students/{id}`, `GET /health`, and the admin/governance set (`/admin/audit`, `/admin/approvals`, `/admin/overrides`, `/admin/integrity`).

### 2. Run the dashboard

```bash
pnpm install
pnpm dev                  # Next.js dev server on http://localhost:3000
```

Point the dashboard at the engine API and Supabase through the environment variables below.

Full instructions are in `docs/setup.md`. Database setup (applying the migrations) is in `supabase/INTEGRATION.md`.

## Environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key for the browser client |
| `NEXT_PUBLIC_API_URL` | URL of the engine API the dashboard calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key, **never** exposed to the browser |
| `SUPABASE_URL` | Set for the engine to read the live cohort (unset → bundled seed) |
| `GOOGLE_OAUTH_CLIENT_ID` | Sign-in with the institutional Google account |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth secret, server only |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | Service account JSON for Drive activity polling |
| `RESEND_API_KEY` | Email delivery for faculty check-ins |
| `APP_BASE_URL` | Public URL of the deployed app |

`service_role` bypasses RLS — keep it backend-only, never with a `NEXT_PUBLIC_` prefix. `.env*` and `*_seed.local.sql` are gitignored.

## Development commands

**Engine** (drop the `uv run` prefix if the venv is already activated)

```bash
uv run pytest             # run the test suite (engine, adapters, api, governance)
uv run ruff check .       # lint
uv run mypy aegis         # type-check
```

**Dashboard**

```bash
pnpm dev                  # start the dev server (Turbopack)
pnpm build                # production build
pnpm start                # serve the production build
pnpm lint                 # eslint
pnpm typecheck            # tsc --noEmit
```

## Security & governance

- **Row-level security is the load-bearing control.** Every table is RLS-protected, default-deny; cohort/team scoping is enforced in the database, not the UI.
- **Roles are not self-assignable.** Signup forces `student`; role changes happen only via an admin or the service-role backend, enforced by a database trigger.
- **No secrets or real PII in the repo.** The seed cohort uses synthetic `@aegis.test` identities (RFC 2606); credentials live in gitignored env files only.

See `SECURITY_REVIEW.md`, `AUTH_AUDIT.md`, and `RLS_VERIFICATION.md` for the full posture and the known pre-demo items.

## Future improvements

- Authenticate the engine's `/admin/*` endpoints (currently trusted-operator/backend-private)
- Page large reads to remove the PostgREST ~1000-row ceiling at institutional scale
- Make `supabase/migrations/` the single source of truth (down-migrations; a fresh reset reproduces live exactly)
- Distinguish "live unavailable" from "verified" so the integrity badge fails closed
- Add a dark theme that respects the system setting
- Run a full accessibility audit and add keyboard support to every interactive element

## Team

AEGIS was built by Team Amateurs for CIPHER 2.0 at the Informatics Institute of Technology.

## License

Released under the MIT License. See `LICENSE`.
