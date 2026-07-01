# PITCH_READY_CHECKLIST — AEGIS (CIPHER 2.0, Scenario 03)

Prepared 2026-07-01 for the July 4 pitch. Team Amateurs.

---

## SECTION 1 — CODE STATUS

- **tsc:** PASS (`tsc --noEmit`, zero errors)
- **pytest:** 93/93 passing (0 failed, 0 errors, 0 skipped)
- **Open issues remaining:**
  - Navbar truncation (Issue C) — FIXED this session (`whitespace-nowrap` on nav links, commit `28e8148`).
  - `nixpacks.toml` still present alongside `railway.toml` (RAILPACK). Redundant, harmless — cleanup deferred.
  - No functional code issues open. Deferred backlog (C2/S1/S2/H1/H3/S3) unchanged; none fire at demo scale.

---

## SECTION 2 — DEPLOYMENT STATUS

- **Railway backend health:** ok — `GET /health` → `{"status":"ok"}` (HTTP 200, verified this session).
- **Railway frontend:** https://aegis-frontend-production-9319.up.railway.app — serving (HTTP 200).
  - **Sample-data banner gone?** **UNVERIFIED** — the banner is client-rendered only when `/run` throws; backend is healthy and `NEXT_PUBLIC_API_URL` is pinned, so it should not appear, but this was not visually confirmed in a browser. **Do one incognito dashboard load before the pitch to confirm.**
- **NEXT_PUBLIC_API_URL:** confirmed set in `.env.production` (git-tracked, committed) →
  `https://aegis-backend-production-1ada.up.railway.app`. This value is inlined into the Next.js build at compile time. If the banner ever shows on Railway, check that this var is also set as a **build-time** variable in the Railway dashboard.

---

## SECTION 3 — DEMO ACCOUNTS

| Role | Email | Password |
|---|---|---|
| Student | `judge.student@aegis.test` | `AegisJudge-Student-2026` |
| Lecturer | `judge.lecturer@aegis.test` | `AegisJudge-Lecturer-2026` |
| Admin | `judge.admin@aegis.test` | `AegisJudge-Admin-2026` |

Use **"Sign in with email"** (not the Google button) for password login. These are throwaway accounts on synthetic `@aegis.test` data — no real student PII.

---

## SECTION 4 — LIVE URLS

- **Frontend:** https://aegis-frontend-production-9319.up.railway.app
- **Backend:** https://aegis-backend-production-1ada.up.railway.app
- **Health:** https://aegis-backend-production-1ada.up.railway.app/health
- **GitHub:** https://github.com/ZAID-EHT/Aegis-Workspace.git

---

## SECTION 5 — WHAT TO DO ON PITCH DAY (July 4)

**30 minutes before:**
- Open the frontend URL in Chrome, full screen.
- Sign in as `judge.admin@aegis.test` and confirm Teams shows 15 teams.
- Open an incognito window and sign in as `judge.student@aegis.test`.
- Send one chat message and confirm it appears on the admin/lecturer side.
- Confirm no yellow "Showing sample data" banner appears (this is the UNVERIFIED item from Section 2).
- Have the demo video file ready as a backup.
- Have the PDF technical report on a USB drive.

**If the Railway backend has gone to sleep:**
- Open the Railway dashboard and click **Deploy** on the backend service.
- Wait ~2 minutes, then retry the health URL until it returns `{"status":"ok"}`.
- Only then re-run the pipeline from the dashboard.

---

## SECTION 6 — REMAINING RISK

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sample-data banner appears on live frontend | Low | Verify with one incognito load before pitch; if it shows, set `NEXT_PUBLIC_API_URL` as a build-time var in Railway and redeploy. Backup: local run with uvicorn + `pnpm dev`. |
| Railway backend cold-start / sleep during demo | Medium | Warm it 30 min before by hitting `/health`; keep the tab open. Redeploy path in Section 5. |
| Doc/number drift: `AEGIS_TECHNICAL_REPORT.md` states 73 students / 4 exception-pool and an old frontend URL (`aegis-production.up.railway.app`); project memory says 70 / 1 pool | Low (cosmetic) | If a judge reads the markdown report, be ready to state the correct live figures. Consider reconciling the report before the pitch. |
| Redundant `nixpacks.toml` confuses the Railway build | Very low | `railway.toml` explicitly sets `builder = "RAILPACK"`, which takes precedence. Remove `nixpacks.toml` post-pitch. |
| Demo admin account lacks `profiles.role='admin'` → Governance 401 | Low | Confirm the admin login reaches the Governance panel during the 30-min warmup, not live in front of judges. |

---

*AEGIS — Team Amateurs | CIPHER 2.0 Scenario 03 | pitch checklist for July 4, 2026*
