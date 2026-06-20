# Gate report — Phase D · API & dashboard (the website)

**Status:** ✅ complete · audits green · reviewers run, BLOCKING fixed · ⚠️ one path limitation
**Date:** 2026-06-21

## What was built
### Backend — `aegis/api/main.py` (FastAPI over `engine.pipeline`)
- `POST /run` → full result; `GET /teams`, `GET /alerts`, `GET /students/{id}`, `GET /health`.
- Pydantic response models; serialises `AllocationResult` (teams+health+members+utilisation,
  alerts, duplicate flags, exception pool, per-student adjusted profiles + rationale).
- `/students/{id}` exposes **Â = L × C** per skill with the `corrected` flag and a placement
  rationale (preference rank, Fit, team health, and the Dunning-Kruger discount line).
- Pure layering preserved: API imports engine+adapters; engine never imports API. Result cached
  (static seed), treated read-only. CORS for the dev origin.

### Frontend — Next.js 15 (App Router) dashboard
- `app/layout.tsx`, `app/page.tsx`, `lib/api.ts`, `lib/utils.ts`; Tailwind v4 via the staged
  `app/globals.css` token layer; the four signature components from `components/aegis/`.
- **3-state flow:** idle → **Run allocation** (PipelineStepper animates Verify→…→Monitor) →
  results. Renders team cards with **HealthRing** (band-coloured), an **EvidenceBar** spotlight
  making the **C=0.5 correction visible**, a **conflict panel** (duplicates + exception pool),
  and an **alert inbox** rail (severity-ranked).

## Verification
```
ruff check aegis      → All checks passed!
mypy aegis            → no issues in 28 source files
pytest -q             → 70 passed (incl. 7 API tests via TestClient)
pnpm exec tsc --noEmit → clean
pnpm exec eslint       → clean
next dev --turbopack   → HTTP 200, dashboard renders (AppShell, stepper, Run)
uvicorn + POST /run    → HTTP 200 from the live server
```

## ⚠️ Path limitation (the `!` you flagged at kickoff)
`next build` (webpack) **cannot run from this directory** — webpack rejects any absolute path
containing `!` (reserved for loader syntax), and the workspace is `…\AEGIS.!`. This is not
fixable by quoting; it's webpack validating the resolved path. **Mitigation applied:** the `dev`
script uses **Turbopack** (`next dev --turbopack`), which tolerates the `!` and serves the
dashboard fine — verified HTTP 200. For a production `next build`, the project must live at a
path without `!` (rename the folder, or build from a `!`-free copy/junction). Flagging rather
than silently working around it.

## Reviewers (read-only, parallel)
Two **BLOCKING** silent-failure traps found and fixed:
- **Dunning-Kruger chip was driven by float-equality** (`confidence === 0.5`) instead of the
  server's authoritative `corrected` flag — a float-drift away from silently turning the amber
  "contradicted" chip grey. Now driven by `SkillView.corrected`; `asConfidence` buckets with
  tolerance.
- **No runtime validation of the `/run` response** — a shape drift would render `undefined` or
  blank-page crash. `lib/api.ts` now validates the response and gives an actionable message on
  unreachable-API / CORS failure.

Also fixed: misleading spotlight fallback to an uncorrected student → explicit empty state;
fragile positional band lookup in `/students/{id}` → keyed by `team_id`; skill views computed
once; read-only-cache invariant documented. Reviewers confirmed clean: layering, serialisation
fidelity, no cross-request mutation, 404 handling, the stepper interval is always cleared.

## How to run it
```
# terminal 1 — API
python -m uvicorn aegis.api.main:app --port 8000
# terminal 2 — dashboard (Turbopack; required because of the ! in the path)
pnpm install   # first time
pnpm dev       # http://localhost:3000
```

## Next — Phase E (Governance, stretch)
Base schema + `supabase/migrations/0002_governance.sql` (hash-chained audit log, RLS, override
triggers); minimal admin console (pending approvals, audit stream, override-watch, integrity
badge via `audit_verify()`). `database-reviewer` on the SQL.
