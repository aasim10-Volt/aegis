# REMAINING_WORK_PLAN.md — 1-day-to-submission audit & plan

**Pass type:** AUDIT + PLAN ONLY. No code/doc/DB changed. Engine untouched. 0006 not applied.
**Baseline:** clean working tree at `c79e50b` (pushed). Nothing to checkpoint — already on a clean commit.
**Method:** live API probes (servers up, live mode) + two read-only reviewer subagents (auth/role-routing; repo_db live behaviors + Drive). Browser-login steps are yours (OAuth can't be driven headless) — flagged below.
**Note:** `SECURITY_AUDIT_CODEX.md` referenced earlier does not exist in the repo; findings here are from live tracing, not that file.

---

## VERDICT (read this first)

**The two-role demo flow essentially works TODAY — with the password judge accounts** (`judge.admin`, `judge.lecturer`, `judge.student`), because those were provisioned with BOTH `user_metadata.role` *and* the authoritative `profiles.role` set. Live data renders: 70 students → 15 teams + 1 pool, the admin gate 401s correctly, the student workspace resolves a real team.

**There is ONE real demo-risk** and it's about *which account you log in with*, not a missing view:
> The dashboard decides your role from **`user_metadata.role`** (client-supplied at signup, fallback `"Member"`), while the backend authorizes from **`profiles.role`** (DB truth). For the password judge accounts these agree. But a **Google-login admin** whose `profiles.role='admin'` was set via SQL — but whose `user_metadata.role` was never set — will land on the **STUDENT workspace** (UI sees role `"Member"` → treated as student), even though the backend would authorize admin calls. That silently sends your admin to the wrong view.

Everything else is either already working, already documented as deferred, or a known accepted trade-off (frontend-only gating). No rebuild is needed. No new view needs to be built — the student workspace and the staff/admin monitoring views all exist and render live.

---

## PART 1 — MAP OF WHAT EXISTS

### Pages (`app/`) — role + live-data status

| Route | Shows | Who sees it | Works w/ live data? |
|---|---|---|---|
| `/` (`page.tsx`) | Landing | Public | n/a |
| `/login`, `/signup` | Auth forms (Google + email/pw) | Public; logged-in users bounced to `/dashboard` (`middleware.ts:44`) | ✅ (login verified earlier) |
| `/auth/callback` | OAuth callback → redirects to `?next` or `/dashboard` (`route.ts:9,14`) | Public | ✅ — **no role-based redirect; everyone → `/dashboard`** |
| `/dashboard` | **Branches by role** (`page.tsx:38-57`): student → `StudentWorkspace` (own team only); staff/admin → full "Allocation overview" (all teams, health, alerts, run button) | All logged-in; content differs by role | ✅ live via `/run` (verified 70/15/1/6) |
| `/profile` | Student's skill evidence + fit + preference (`SkillCheck`) | Student only (`useAccessGuard("profile")`) | ✅ live via `/run` |
| `/settings` | Account card, theme, sign out | All roles (`account`) | ✅ (reads session) |
| `/teams` | All teams + health bands | Staff/admin only (guard redirects students) | ✅ live |
| `/alerts` | Triaged alert inbox | Staff/admin only | ✅ live (6 alerts) |
| `/pipeline` | Pipeline stepper + run stats | Staff/admin only | ✅ live |
| `/admin` (Governance) | Audit log, approvals, overrides, integrity badge | **Admin only** (nav hidden for lecturer; `useAccessGuard("settings")`) | ⚠️ live-or-seed (see §Governance below) |

### API endpoints (`aegis/api/main.py`) — gate + live status

| Endpoint | Shows | Gate | Live probe result |
|---|---|---|---|
| `GET /health` | liveness | none | ok |
| `POST /run` | full allocation (teams, alerts, dupes, pool, student_profiles) | **none (open)** | ✅ 70/15/1/6 |
| `GET /teams` | teams + health | **none (open)** | ✅ 15 |
| `GET /alerts` | triaged alerts | **none (open)** | ✅ 6 |
| `GET /students/{id}` | one student's profile + rationale | **none (open)** | ✅ returns real name |
| `GET /admin/audit` | live `audit_log` else seed | `require_admin` | ✅ 401 unauth / 401 bogus token |
| `GET /admin/approvals` | pending profiles else seed | `require_admin` | (gated) |
| `POST /admin/approvals/{id}` | approve/reject (service_role write) | `require_admin` | (gated; live DB required) |
| `GET /admin/overrides` | seed overrides | `require_admin` | (gated) |
| `GET /admin/integrity` | hash-chain verify (live RPC else seed) | `require_admin` | (gated) |
| `POST /api/drive/provision` (Next route) | create team Drive workspace | admin-only (`profiles.role='admin'`) | optional — NOT in demo path |
| `POST /api/drive/poll` (Next route) | poll Drive activity | scheduler secret | optional — NOT in demo path |

### Role routing — how a user reaches their view
- **Decision point: client-side, in `/dashboard`** (`app/dashboard/page.tsx:39-57`). The OAuth callback and middleware send *everyone* to `/dashboard`; the page then branches on `isStudent(user?.role)`.
- **Role source for the UI: `user_metadata.role`** (`components/auth/user-provider.tsx:25`, fallback `"Member"`). **Role source for the backend: authoritative `profiles.role`** (`auth.py` → `repo_db.resolve_user_role`, reads `profiles.role`; `lib/google/guard.ts:14-19` same). These can disagree (the gap in the Verdict).
- **Middleware does login-vs-not only** (`middleware.ts:37-42`) — no role routing. Role gating is client-side guards (`useAccessGuard`) + the backend admin gate.
- **Lecturer ≠ admin:** `require_admin` requires `role=='admin'` (`auth.py:100`). A lecturer gets **403** on `/admin/*` and the Governance nav item is hidden (`navKeysFor` excludes `settings` for lecturer). Lecturers see teams/health/alerts (open routes), **not** governance.

---

## PART 2 — TWO-ROLE FLOW TEST (against live)

### Student path (`judge.student@aegis.test`, mapped to real student Nadeesha Perera)
| Step | Result |
|---|---|
| Login (email/pw) | ✅ `signInWithPassword` works |
| Role resolved | ✅ `user_metadata.role='student'` + `student_id` set (by `map_demo_student.py`) |
| Lands on workspace | ✅ `/dashboard` → `StudentWorkspace` (student branch) |
| Team shown | ✅ `/run` returns her team; client matches `student_id` → "Smart Timetable Optimiser" |
| Team health shown | ✅ ring + health bar + component breakdown (team health 57, at-risk) |
| Own details | ✅ `/profile` shows skills/evidence, fit 45%, #1 preference |
| Sees nothing admin | ✅ nav = workspace/profile/settings only; `/teams`,`/admin` redirect to `/dashboard` |

**Student path: PASS** (after the earlier API-base + CORS fix — needs a hard-refresh in the browser if a stale bundle is cached).

### Lecturer/Admin path
| Step | Admin (`judge.admin`) | Lecturer (`judge.lecturer`) |
|---|---|---|
| Login | ✅ | ✅ |
| Role resolved | ✅ metadata+profiles `admin` | ✅ metadata+profiles `lecturer` |
| Monitoring (teams/health/alerts) | ✅ full overview, `/teams`, `/alerts`, `/pipeline` live | ✅ same (open routes) |
| Governance (audit/approvals/integrity) | ✅ gate passes (admin JWT) — **content is live-or-seed** | ⛔ **by design**: nav hidden, `/admin/*` → 403 |

**Admin path: PASS** for monitoring; governance **renders but may show seed/empty** (see below). **Lecturer path: PASS** for monitoring; **lecturer does not get governance** — that's the intended security model. **Demo governance with the ADMIN account, not the lecturer.**

### Simultaneous two-account use
**PASS.** Each browser holds its own Supabase session; the backend is stateless + read-only `lru_cache`. No cross-session conflict. Two devices on different accounts work concurrently.

### BOLA / data-exposure flags (you asked to flag these honestly)
- 🟠 **Open data routes leak cross-team data over the wire.** `/run`, `/teams`, `/students/{id}` are unauthenticated and return **all** teams/students. The student UI *filters to their own team client-side*, but the student's browser actually **receives every team's health and every student's details** — a student could read another team's data via devtools or a direct API call. This is the known "frontend gating only" trade-off you chose. **Not visible in the UI and contained for the demo** by port isolation (`:8000`, CORS limited to localhost/private-LAN), single trusted operator, demo-controlled inputs. **Real fix = backend auth on the data routes (post-submission).**
- ✅ **No UI path** sends a student into an admin/lecturer view *when accounts are correctly roled* — guards redirect. The exception is the metadata/profiles mismatch in the Verdict (an admin landing on the *student* view), which is a wrong-view bug, not a privilege leak.

### Answers to your known-open items
- **Do the data routes being unauthenticated matter / does the dashboard rely on it?** Yes — the dashboard relies on it. `runPipeline()` (`lib/api.ts:173`) sends **no** auth header; only `/admin/*` calls attach the JWT. **Gating `/run`/`/teams`/`/alerts`/`/students/{id}` today would 401 both the student workspace and the staff overview** until `lib/api.ts` is updated to send the session JWT on those calls. So: do **not** gate them in the next 24h.
- **Is 0006 needed for a lecturer to land on the monitoring view?** **No.** 0006 only automates role assignment from a staff-email directory at signup. **Manual role-setting suffices for the demo** — your judge accounts already have `profiles.role` set, and a Google account can be roled with one SQL `update`. 0006 is the production auto-assignment path, **optional for the demo**, and it touches live `auth.users` — defer unless you specifically want directory-based roling.

### Governance content caveat (admin view)
`/admin/audit`, `/approvals`, `/integrity` **try live, then silently fall back to SEED on any error** (`main.py:376,413,471` — backlog **S2**, fail-open). So the admin Governance panel will show: live data if those tables are populated; **seed data silently** if the live read errors; and the integrity badge shows **`verified=False` for an empty live `audit_log`** (correct) but could show a green seed badge on a live error. For the demo, **verify what `/admin` actually renders as admin** so you know whether it's live or seed — it won't error, but it may not be live.

---

## PART 3 — MINIMAL PLAN (ranked, 1-day budget)

### 🔴 MUST-FIX-TODAY (or the demo flow misbehaves)

**M1 — UI must read the authoritative `profiles.role`, not `user_metadata.role`.**
- *What's wrong:* role landing depends on client metadata; a Google-login admin (or any account roled only in `profiles`) lands on the **student** view. Fallback label `"Member"` masks it.
- *Smallest fix:* in `components/auth/user-provider.tsx`, after `getUser()`, do one `supabase.from("profiles").select("role,status").eq("id", uid).single()` and use `profiles.role` for `role` (keep `student_id` from metadata; keep metadata role only as a pre-load hint). ~15-30 lines, client-only.
- *Effort:* ~1-2h. *Files:* `components/auth/user-provider.tsx` (only). *Live auth/DB:* **no** — read-only query via the user's own session (RLS already allows reading own profile, `0004`).
- *Zero-code alternative (if you only demo with the password judge accounts):* already satisfied — those have both fields set. Then M1 becomes **VERIFY-ONLY**. **Decision needed: are you demoing admin via Google login or the password `judge.admin` account?** Google → do M1. Password judge only → skip M1, just verify.

**M2 — VERIFY (hands-on, you): both roles land correctly, live, simultaneously.**
- Incognito #1: `judge.student` → workspace shows their team + health. Incognito #2 (or 2nd device): `judge.admin` → full overview + `/teams` + `/alerts` + `/admin` governance loads. Confirm no 401/blank.
- If using the Google admin account: confirm its `profiles.role='admin'` **and** (if you skip M1) its `user_metadata.role='admin'`.
- *Effort:* ~20 min. *Touches live:* read-only (plus the one-time role `update` if needed — you apply that watching).

### 🟡 NICE (do if time remains; not demo-breaking)

**N1 — Open-redirect fix (CWE-601) in `app/login/page.tsx`** (from the prior triage). `redirect` param flows unvalidated into `router.push`. Smallest fix: a `safeRedirect()` helper (allow only `/`-rooted, non-`//`, non-scheme paths). ~30 min, client-only, no live touch. Security hygiene; not in the demo's happy path.

**N2 — Confirm `/admin` governance shows what you want (live vs seed).** If you want it clearly *live*, ensure the live governance tables have rows (e.g., the audit chain). No code; data/verification only. If it shows seed, that's acceptable but know it for the viva.

**N3 — Doc reconcile (§4/§6)** with the open-data-route finding + compensating controls, and add the S2/Drive-idempotency caveats (from the prior triage). Documentation only, no code. ~30 min.

### ⚪ POST-SUBMISSION (document, don't build today)
- **Backend auth on data routes** (real fix for the BOLA/over-exposure flag) — needs `require_authenticated` + router wiring + `lib/api.ts` sending the JWT on `/run` etc. ~½ day; coordinated FE+BE; **do not attempt in the last 24h**. Document as accepted with compensating controls.
- **S2 governance fail-open → fail-closed 503** (backlog).
- **Drive provisioning idempotency** (check `drive_folder_id` first) — not in demo path (backlog **D1**, not yet listed).
- **0006 staff_directory** auto-roling — optional; touches live `auth.users`; apply only if you want directory-based roles, watching.
- **C2 1000-row pagination**, **S1 silent no-op**, **H1/H3 migrations/drift** — backlog, safe at 70 students.
- Real **student↔`students.id` link** in `profiles` (so any real student — not just the mapped judge account — resolves to a team). Demo uses the mapped `judge.student`.

### Subagent recommendation
- For the remaining work, **subagents are not needed** — the surface is small and well-mapped. If you greenlight M1 + N1, I'd do them inline (two tiny client edits). If you later want the post-submission backend-auth change, that's worth one **builder** subagent + one **reviewer** to verify the FE/BE contract, but **not in the 1-day window**.

---

## ORDERED SEQUENCE FOR YOUR REMAINING DAY

**Decision gate (you, now):** demoing admin via **Google login** or the **password `judge.admin`**? → determines whether M1 is a fix or a verify.

1. **YOU (5 min):** confirm the live backend is in live mode (`/run` = 70 students) and the frontend is up. *(Verified during this audit — still good.)*
2. **ME (if approved, ~1-2h):** M1 (UI reads `profiles.role`) + N1 (open-redirect fix + small test). Both client-only, reversible, no live touch. I show diffs before applying (your standing rule).
3. **YOU (watching, ~10 min, only if needed):** set the demo admin account's role on live — `update public.profiles set role='admin', status='approved' where email='<demo-admin>'`. (Touches live DB — you apply.)
4. **YOU (~20 min):** M2 two-role login test, both accounts, two browsers/devices simultaneously. Confirm student=own team only; admin=full monitoring + governance loads.
5. **YOU (~15 min):** N2 — glance at `/admin` governance live; note live-vs-seed.
6. **OPTIONAL (you, watching):** 0006 — **skip for the demo** unless you want directory auto-roling. Manual roles already work.
7. **YOU:** capture/figures already largely done (70/15/0.911, bands 11/4/0); finalize PDF if not already. Commit + push.

**0006, live-auth changes, and backend data-route gating are explicitly NOT in today's critical path.**

---

## STOP
No changes applied. Engine untouched. 0006 not applied. This file is the only artifact (untracked — not committed). Tell me: **(a)** Google-admin or password-admin demo (sets M1 = fix vs verify), and **(b)** which of M1 / N1 / N3 to apply. I apply nothing until you choose.
