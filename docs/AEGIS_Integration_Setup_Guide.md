# AEGIS — Integration & Setup Guide
### CIPHER 2.0 · Scenario 03 · Phase 2 Prototype Build

This document consolidates every infrastructure, API, and integration decision made before development starts. It's the companion to `AEGIS_README_v3.md` (which covers product logic and formulas) — this one covers **what to actually build, what to mock, and how to set each piece up.**

---

## 1. Tech Stack (Locked)

| Layer | Choice | Notes |
|---|---|---|
| Database | **Supabase (Postgres)** | Relational data model fits team/skill/task joins far better than NoSQL. Free tier covers prototype scale. |
| Auth | **Supabase Auth** (Google provider) | Same project as DB, no separate service. Reuses the Google Cloud OAuth client created for Drive. |
| Backend | FastAPI or Node — **decide before Day 1** | If Node, Drive integration (`googleapis`) and DB client live together. If FastAPI, Drive calls may need a small Node microservice — pick one to avoid a Day 5 surprise. |
| Matching algorithm | Python `matching` library (Abraham–Manlove SPA) | Test standalone with dummy data before wiring into the pipeline. |
| Duplicate detection | scikit-learn `TfidfVectorizer` + `cosine_similarity` | Python-only — factor into backend language decision above. |
| File storage / workspace | **Google Drive API** (service account) | Real integration — see Section 3. |
| Caching | In-memory (`lru_cache` / `lru-cache`) + React Query on frontend | No Redis needed for prototype. See Section 5. |

---

## 2. Database — Supabase

### Why
Postgres relational structure matches AEGIS's actual data shape (teams → members → skills → tasks → alerts, all foreign-keyed). NoSQL (Firebase/Firestore) was considered and rejected — no native joins, and the matching algorithm needs whole-cohort relational queries the Supabase/Postgres route handles natively.

### Core schema (starting point)

```
students (id, name, email, capacity_hours, preferred_teammate_id)
skills_declared (student_id, discipline, declared_level, confidence_basis, adjusted_score)
projects (id, title, abstract, supervisor_id, capacity)
teams (id, project_id, health_score, status)
team_members (team_id, student_id, role)
tasks (id, team_id, assignee_id, hours_estimated, status)
activity_log (id, student_id, file_id, action, timestamp)   -- feeds engagement/health score
alerts (id, team_id, severity, trigger_type, created_at, resolved)
```

### Setup checklist
- [ ] Create Supabase project
- [ ] Enable **Transaction pooler** (PgBouncer) connection string — prevents connection exhaustion under load, zero extra setup cost
- [ ] Define Row Level Security policies once roles exist (lecturer sees only assigned cohort, student sees only own team)

---

## 3. Auth — Supabase Auth + Google OAuth

### Decision
Use Supabase's built-in Auth rather than a separate provider — avoids managing two systems, two key sets, manual user-ID syncing.

### Setup steps
1. Google Cloud Console → **OAuth consent screen** → External → add app name + support email
2. Add scopes: `userinfo.email`, `userinfo.profile`
3. **Add yourself + teammates as Test Users** — skips Google's verification process entirely (not needed for a known-user prototype)
4. **Credentials → OAuth Client ID → Web application** → note Client ID + Secret
5. In Supabase dashboard: **Authentication → Providers → Google** → paste Client ID + Secret
6. Copy Supabase's callback URL → add to Google Cloud OAuth client's **Authorized redirect URIs**
7. Frontend: `supabase.auth.signInWithOAuth({ provider: 'google' })`
8. Create a `profiles` table (`id` references `auth.users`, `role`, `cohort_id`) — populate on first sign-in

### Role handling
- Student: self-registers, default role
- Lecturer / Admin: **not self-assignable** — pre-created or approved by an existing admin, per the system's governance model

### Side benefit
Google login gives you the student's **real email automatically** — solves the "who do I share the Drive folder with" problem without a manual entry field.

---

## 4. Google Drive API — Real Integration

This is the one external integration worth building for real (visible "wow" feature, not just a backend detail).

### ⚠️ Known gotcha — read first
A bare service account has **zero Drive storage of its own**. Two fixes:
- **If IIT gives Workspace access**: use a Shared Drive, add the service account as a Content Manager
- **If not (most likely for a student prototype)**: share a folder from your **personal Google account** with the service account's email, and have it create files inside that folder instead of its own quota

### Setup steps
1. [console.cloud.google.com](https://console.cloud.google.com) → create project
2. **APIs & Services → Library** → enable:
   - Google Drive API
   - Google Docs API (only if editing content programmatically, not required for iframe embedding)
   - Drive Activity API (for telemetry, see Section 7)
3. **Credentials → Create Credentials → Service Account**
4. Service Account → **Keys → Add Key → JSON** → download, store as env secret, **never commit to GitHub**
5. Share your root Drive folder with the service account's email as Editor

### File provisioning (runs once per team at allocation time)

```js
async function provisionTeamWorkspace(teamId, memberEmails, parentFolderId) {
  const folder = await drive.files.create({
    resource: { name: `Team ${teamId}`, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] },
    fields: 'id'
  });

  await Promise.all([
    drive.files.create({ resource: { name: 'Project Report', mimeType: 'application/vnd.google-apps.document', parents: [folder.data.id] } }),
    drive.files.create({ resource: { name: 'Task Tracker', mimeType: 'application/vnd.google-apps.spreadsheet', parents: [folder.data.id] } }),
    drive.files.create({ resource: { name: 'Presentation', mimeType: 'application/vnd.google-apps.presentation', parents: [folder.data.id] } })
  ]);

  for (const email of memberEmails) {
    await drive.permissions.create({
      fileId: folder.data.id,
      resource: { type: 'user', role: 'writer', emailAddress: email },
      sendNotificationEmail: false
    });
  }
}
```

### Embedding (live editing inside the website)

```html
<iframe src="https://docs.google.com/document/d/FILE_ID/edit?embedded=true" width="100%" height="600" />
```

Editing works natively through Google's own UI once the student's browser is logged into the shared account — no proxying edits through the backend needed.

---

## 5. Caching Strategy

| Need | Solution | Why |
|---|---|---|
| Algorithm-internal memoization (compatibility scores during formation) | `lru_cache` (Python) / `lru-cache` (Node) | In-memory, zero infra, kills redundant recomputation during the swap pass |
| Reduce repeated frontend → DB calls (dashboards, health scores) | **React Query / SWR** with `staleTime` | Biggest real load reduction for least effort — health score only changes every 72h anyway |
| Connection exhaustion under load | Supabase's built-in **Transaction pooler** | One connection-string swap |
| Server-side cache for expensive/repeated reads (optional, time-permitting) | **Upstash Redis** | Serverless, free tier, HTTP-based — only add if time remains after core algorithm is done |

**No standalone Redis server, no job queue (BullMQ etc.) for the prototype** — mention as a "Phase 2/3 scaling plan" in the documentation PDF instead of building it.

---

## 6. What's Real vs Mocked (Final Decision)

| Component | Status | Reasoning |
|---|---|---|
| Supabase (DB + Auth) | **Real** | Core infra, low setup cost |
| Google Drive API (provisioning + embedding) | **Real** | Visible differentiator feature |
| Drive Activity API (engagement/edit tracking) | **Real**, feeds health score directly | Same integration as above, just the read side |
| LMS Grade Sync (T1 channel) | **Mocked** | No access to a real LMS; system is designed to work without it (C=0.6 default) |
| Google Calendar API / `attendance_rate` | **Removed entirely** | Folded into `engagement_signal_rate` instead — see Section 7 |
| Email sending (check-in templates) | **`mailto:` link, no API** | Lecturer sends manually from their own client; no automated mail from the platform |
| Notification queue | **Skipped** | Direct/synchronous calls for prototype; mention queueing as scale-up plan in docs only |
| Duplicate detection vectorization | **Real, synchronous** | Runs instantly on submission — dataset is small enough that "off-peak batching" isn't a real constraint at this scale |

---

## 7. Health Score Formula — Updated (Calendar Removed)

**Original (4 components, README v3):**
```
Health_Score = 100 × (w_tc·task_completion + w_at·attendance_rate + w_wb·workload_balance + w_en·engagement_signal_rate + w_mp·milestone_progress)
```

**Updated — `attendance_rate` removed, weight folded into `engagement_signal_rate`:**
```
Health_Score = 100 × (w_tc·task_completion + w_wb·workload_balance + w_en·engagement_signal_rate + w_mp·milestone_progress)
```
Where `w_en` absorbs the old `attendance_rate` weight (0.15 + 0.15 = 0.30).

**Reasoning:** "Attendance" was originally meant to come from Google Calendar RSVP data — which doesn't even measure real attendance (Calendar API only gives RSVP status, not physical presence; true attendance requires Workspace Admin SDK access we don't have). Since contribution is already tracked via Drive edit/upload activity, attendance is redundant — both signals would come from the same source. Removing it simplifies the build and removes an entire API integration with no loss of accuracy.

`engagement_signal_rate(i) = active_events(i) / expected_baseline_events_for_week`, sourced from `activity_log`.

---

## 8. Mock Dataset Spec (Seed Data)

To be built as `seed.json` (or `seed.sql`), re-runnable on every DB reset.

### Student records — required spread
Not random data — deliberately engineered to demonstrate the evidence-weighting formula:

| Confidence tier | Count | Demonstrates |
|---|---|---|
| C = 1.0 (verified LMS grade) | ≥ 2 students | Verified claims aren't punished |
| C = 0.8 (portfolio submitted) | ≥ 2 students | Mid-tier evidence |
| C = 0.6 (self-report only, default) | ≥ 3 students | Baseline/no-evidence case |
| C = 0.5 (claim contradicted by throughput) | ≥ 1–2 students | The Dunning-Kruger correction firing — most convincing demo case |

Each student needs, per skill discipline (Technical, UX, Management, Communication):
- `declared_level` (1–5)
- `lms_grade` (nullable)
- `portfolio_submitted` (boolean)
- `survey_score`

Plus: `student_id`, `name`, `email`, `capacity_allowance_hours`, `preferred_teammate_id`, `preferred_projects` (ranked array).

### Project abstracts
- 8–10 written as full paragraphs (TF-IDF needs real text, not titles)
- **One deliberate near-duplicate pair** to trigger the ≥0.75 cosine similarity threshold on camera

### Behavioral/activity seed data (for Phase C demo)
- Fake commit/edit timestamps across simulated weeks
- **One engineered sympathy-carry case**: one student's edits cover >95% of a teammate's assigned tasks
- **One engineered ghosting case**: zero activity for 10+ simulated days → triggers Tier 3 alert
- A few baseline "healthy" students for contrast
- `meetings_scheduled` / `meetings_attended` no longer needed (see Section 7 — attendance removed)

---

## 9. Documentation Talking Points (for the PDF, not the build)

Things to mention as "Phase 2/3 scaling considerations" rather than actually building this week:
- Upstash Redis for server-side caching at scale
- Notification queue (BullMQ) for high-volume alert dispatch
- Off-peak batch re-similarity sweeps across the full cohort (vs per-submission checks)
- Real LMS integration once institutional API access exists
- Calendar/Meet attendance as a *supplementary* signal, explicitly noting it would measure RSVP intent, not physical presence

Being upfront about these in the documentation satisfies **Feasibility & Scalability (20 marks)** without costing build time.

---

## 10. Pre-Dev Checklist

- [ ] Backend language decided (Node vs FastAPI) — affects Drive integration + matching lib placement
- [ ] Supabase project created, pooler enabled, schema migrated
- [ ] Google Cloud project created, Drive API + Drive Activity API enabled
- [ ] Service account created, JSON key secured, root folder shared
- [ ] OAuth consent screen set up, test users added, Client ID/Secret in Supabase
- [ ] `matching` library tested standalone
- [ ] `seed.json` built with the required confidence-tier spread, duplicate project pair, and engineered sympathy-carry/ghosting cases
- [ ] Health Score formula updated in code to drop `attendance_rate`
