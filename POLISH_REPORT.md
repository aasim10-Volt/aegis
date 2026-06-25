# POLISH_REPORT.md — token/styling polish pass

**Scope:** styling/tokens/className only — no component structure, routes, data fetching,
`lib/api.ts`, `use-run.ts`, state, props, or `/run` path touched. Violet/indigo accent kept;
semantic colors data-only.
**Checkpoints:** workspace-button committed `aea23ad`; tag **`pre-polish-pass`** @ `aea23ad` is the
clean rollback point. Polish committed as one commit **`a402e01`** — **NOT pushed** (your review).
**Verification after EVERY change (all passed, nothing reverted):** `tsc --noEmit` clean; `/dashboard`,
`/teams` (and all other routes) serve; `/run` = **70/15**. Final broad check: all 8 routes serve, tsc
clean, run 70/15.
**Reverts:** none — every change verified clean.

---

## What changed, per item

**1. Spacing rhythm (4/8/16/24).** Uniform card padding **`p-6` (24px)** — normalized the outliers
`p-5` (StatTile + skeleton + "All clear" card) and `p-7` (TeamCardZoom, student-workspace cards).
Inter-card **grid gaps → `gap-6` (24px)** (were `gap-5`/20px) on the dashboard, teams, and student
grids. *Files:* `components/dashboard.tsx`, `components/student-workspace.tsx`, `app/dashboard/page.tsx`,
`app/teams/page.tsx`.

**2. Card treatment / radius / elevation.** **No change needed** — the `Card` primitive already carries
the consistent calm treatment (`rounded-3xl` + hairline `border-border/60` + soft `shadow-md` +
`transition-shadow`); item 1's uniform padding completes it. Avoided churn.

**3. Type scale.** `--text-2xl` **1.75rem → 1.5rem** (line-height 1.22 → 1.25) in `globals.css`, so page
titles (all `text-2xl` h1s) relate more proportionally to the `text-sm` body (≈1.7:1 instead of 2:1).
One token, applies consistently everywhere.

**4. One-accent restraint.** **No change needed** — swept for semantic-color utility classes
(`text/bg/border/ring-healthy|at-risk|critical|info`): **zero matches.** Health colors are applied only
via CSS vars on data (rings, status badges, alert tints); indigo `primary` is the only decorative accent.

**5. Sidebar / nav + account chip.** Moved the **theme toggle into the sidebar header** (next to the
logo) so the account chip spans the **full sidebar width**; the user **name no longer truncates**
(`truncate` removed — it now wraps and shows in full, so `Judge (Admin view)` is fully visible instead of
`Judg…`). *File:* `components/aegis/app-shell.tsx`.

**6. Account-chip tidy.** Chip padding `p-2.5 → p-3` for a slightly calmer feel; chip is now the sole,
full-width element at the sidebar bottom. *File:* `components/aegis/app-shell.tsx`.

---

## Before / after — dashboard + /teams (exact class deltas)

**Card padding (StatTile — appears on dashboard, /teams, /alerts, /pipeline, /profile):**
- before: `<Card className="flex items-center gap-4 p-5 …">`  → after: `… gap-4 p-6 …`

**Team card breakdown (TeamCardZoom, dashboard + /teams hover):**
- before: `<Card className="flex flex-col gap-5 p-7">` → after: `… gap-5 p-6`

**Dashboard grids (`app/dashboard/page.tsx`):**
- before: `grid … gap-5 md:grid-cols-2 xl:grid-cols-3` and `grid … gap-5 lg:grid-cols-2`
- after: `… gap-6 …` (both)

**Teams grids (`app/teams/page.tsx`):**
- before: `grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3` (skeleton + live)  → after: `… gap-6 …`

**Page titles (all views, e.g. "Allocation overview", "Teams"):**
- before: `text-2xl` = 1.75rem  → after: `text-2xl` = 1.5rem (smaller, calmer relative to body)

**Sidebar (all authenticated views):**
- before: header = `<Logo/>` only; bottom = `[UserCard (flex-1, name truncated)] [ThemeToggle]`
- after: header = `[Logo] … [ThemeToggle]`; bottom = full-width `UserCard`, name wraps & shows in full;
  chip padding `p-2.5 → p-3`

---

## ⚠️ Aesthetic judgment calls — please eyeball (I can't see the rendered result)

1. **Title size (item 3).** 1.75rem → **1.5rem** — I judged the old titles oversized vs body. Confirm
   titles still read as confident/clear and not too small at 1.5rem. (Easy to nudge to 1.625rem if you
   want them a touch larger.)
2. **Account name wrapping (item 5).** Long demo names like **"Judge (Admin view)"** now **wrap to two
   lines** in the chip (no truncation). Confirm the two-line chip looks intentional, not cramped. (If you
   prefer one line, I can truncate-with-tooltip instead — but you asked for full names.)
3. **Theme toggle relocation (item 5).** Moved from the bottom row to the **sidebar header** beside the
   logo. Confirm that placement reads cleanly. (Mobile still has its toggle in the top bar — unchanged.)
4. **Grid gaps 20→24px (item 1).** Slightly more air between cards. Confirm it reads "spacious," not
   "sparse," on the dashboard's 3-up team grid.
5. **Uniform p-6 padding.** TeamCardZoom (hover preview) lost 4px (p-7→p-6) for consistency. Confirm the
   zoomed card still feels generous.

None of these affect function — they're look/hierarchy choices for your eye.

---

## State
- Commit `a402e01` (local only, **not pushed**). Rollback: `git reset --hard pre-polish-pass`.
- To push after review: `git pull --rebase origin master && git push origin master`.
- Engine, live DB, auth, 0006 untouched. Dev servers still up (frontend :3000, backend :8000 live).
- **Hard-refresh** the browser to see the changes; verify the dashboard renders for both a student and
  an admin account before pushing.
