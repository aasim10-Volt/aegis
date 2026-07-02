# PITCH READY CHECKLIST

## CODE HEALTH

- `tsc`: pass
- `pytest`: 93 of 93 passed
- Open issues:
  - `SESSION_REPORT.md` and `SESSION_START_REPORT.md` are untracked local reports.
  - Sandboxed pytest with `2>&1` cannot access the default Windows temp folder; escalated final baseline passes.
  - Git emits a local warning because `C:\Users\athee/.config/git/ignore` is not readable under the restricted profile.

## LIVE URLS

- Frontend: https://aegis-frontend-production-9319.up.railway.app
- Backend: https://aegis-backend-production-1ada.up.railway.app
- Health: https://aegis-backend-production-1ada.up.railway.app/health
- GitHub: https://github.com/ZAID-EHT/Aegis-Workspace.git

## DEMO ACCOUNTS

- Student: `judge.student@aegis.test` / `AegisJudge-Student-2026`
- Lecturer: `judge.lecturer@aegis.test` / `AegisJudge-Lecturer-2026`
- Admin: `judge.admin@aegis.test` / `AegisJudge-Admin-2026`

## PITCH DAY SEQUENCE (July 4), 30 minutes before

- Open frontend in Chrome full screen.
- Sign in as `judge.admin`, confirm Teams shows 15 teams, no banner.
- Open incognito, sign in as `judge.student`, send a chat message.
- Confirm the message appears on admin Teams view in real time.
- Confirm health URL returns status ok.
- Have demo video backup open, PDF report on USB.
- If backend sleeping: Railway dashboard, click Deploy, wait 2 min.

## JUDGING CRITERIA TO HIT

- Problem understanding: open with the four failure modes before the solution.
- Justify decisions: name each algorithm and why over the simpler alternative.
- Demo: two roles only (student workspace then admin governance) in 8 minutes.
- Impact: close with 73 students, 15 teams, 6 alerts, 0.911 cosine, 93 tests, 0 critical.

## REMAINING RISKS

- Railway sleep - wake before entering, keep health tab open.
- Venue WiFi - recorded video and phone hotspot as backup.
- Production-readiness question - be honest about migration drift and the Google Workspace requirement for live activity ingestion.

