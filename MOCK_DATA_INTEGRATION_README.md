# AEGIS Mock Data — Usage & Integration Guide

This explains the 4 mock data files, how they relate to each other, and how to load them into Supabase (or any other system).

---

## Files in this set

| File | What it is | Rows |
|---|---|---|
| `lms_raw_export.csv` | Raw academic records, as if exported directly from a university LMS/SIS. No skill-pillar awareness. | 51 (covers 24/70 students) |
| `module_skill_mapping.csv` | Static config table — maps each module code to an AEGIS skill pillar + weight | 6 |
| `student_profiles.json` | Final verified student profile objects — matches the schema in `AEGIS_README_v3.md` exactly | 70 |
| `student_profiles_flat.csv` | Same data as the JSON, flattened to one row per student for spreadsheet/SQL import | 70 |

---

## How they connect

```
lms_raw_export.csv  ──┐
                       ├──► module_skill_mapping.csv ──► normalize & weight ──► student_profiles.json/.csv
(self-report survey) ──┘
```

- `lms_raw_export.csv` is **only** the source data — 35% of students have entries here (matches the readme's "used where available" design). The rest have none, which is expected and fine.
- `module_skill_mapping.csv` tells you which module feeds which of the 4 skill pillars (`technical_architecture`, `user_experience_design`, `project_management_ops`, `communication_presentation`), and how much weight it carries if a student has multiple modules in the same pillar.
- `student_profiles.json` / `.csv` is the **already-computed output** — i.e. what you'd get *after* running the LMS rows through the mapping and the `S_pillar` / confidence formula from the readme. You don't need to recompute anything for the demo — this is the end state.

In the `basis` field of each skill entry, you'll see exactly which confidence tier produced that number:

| basis | confidence (C) | meaning |
|---|---|---|
| `verified_lms` | 1.0 | came from `lms_raw_export.csv` |
| `portfolio` | 0.8 | student submitted prior work |
| `self_report` | 0.6 | default, no evidence |
| `contradicted` | 0.5 | self-claim didn't match observed performance |

---

## Option A — Quickest: load straight into Supabase as-is

If you just need data on screen for the demo, skip modeling and dump the flat file into one table.

1. Supabase Dashboard → Table Editor → **New Table** → name it `student_profiles_mock`
2. Click **Import data from CSV** → upload `student_profiles_flat.csv`
3. Supabase will auto-detect columns and types. Set `student_id` as the primary key.
4. Done — your dashboard can `SELECT * FROM student_profiles_mock` and render cards/tables directly.

This is enough for Phase 1/2 prototype screens (skill matrix display, capacity, preferences).

---

## Option B — Closer to "real" schema: normalized tables

If you want the demo to actually *show* the LMS → mapping → profile pipeline (good for judging criteria, since it proves the architecture isn't hardcoded):

```sql
-- 1. Raw LMS export table
create table lms_raw_export (
  student_id text,
  module_code text,
  module_name text,
  credit_hours int,
  grade_letter text,
  grade_point numeric,
  grade_percentage numeric,
  assessment_type text,
  semester text,
  completion_date date
);

-- 2. Module -> skill pillar mapping config
create table module_skill_mapping (
  module_code text primary key,
  module_name text,
  maps_to_pillar text,
  weight numeric
);

-- 3. Final student profiles (compiled output)
create table student_profiles (
  student_id text primary key,
  name text,
  skill_matrix_adjusted jsonb,   -- store the nested object as-is
  capacity_allowance_hours numeric,
  preferred_teammate text,
  preferred_projects text[]
);
```

Import order:
1. `module_skill_mapping.csv` → `module_skill_mapping` (CSV import works directly)
2. `lms_raw_export.csv` → `lms_raw_export` (CSV import works directly)
3. `student_profiles.json` → `student_profiles`. Supabase's CSV importer won't handle nested JSON well, so for this one either:
   - Use the **Supabase JS client** to loop and insert (snippet below), or
   - Use `student_profiles_flat.csv` instead and store the 4 pillars as separate flat columns rather than a `jsonb` column.

```js
// Node/JS one-off seed script using @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'
import profiles from './student_profiles.json' assert { type: 'json' }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

for (const p of profiles) {
  const { error } = await supabase.from('student_profiles').insert({
    student_id: p.student_id,
    name: p.name,
    skill_matrix_adjusted: p.skill_matrix_adjusted, // stored as jsonb
    capacity_allowance_hours: p.capacity_allowance_hours,
    preferred_teammate: p.preferred_teammate,
    preferred_projects: p.preferred_projects
  })
  if (error) console.error(p.student_id, error.message)
}
```

Run with `node seed.js` (add `"type": "module"` to `package.json`, or rename to `seed.mjs`).

---

## If you want to actually demo the verification pipeline live

To make the confidence-weighting *visibly compute* in front of judges instead of just displaying pre-baked numbers:

1. Read a row from `lms_raw_export`.
2. Join against `module_skill_mapping` on `module_code` to find `maps_to_pillar` and `weight`.
3. Normalize `grade_percentage` to a 0–10 scale: `skill10 = (grade_percentage / 100) * 10`.
4. If a student has multiple modules mapped to the same pillar, take the weighted average.
5. Compare that against the student's self-reported `declared` value for the same pillar (you'll need a separate self-report/onboarding table — not included in this mock set, since the readme's Phase A survey isn't mocked yet — let me know if you want that generated too).
6. Apply confidence: `C = 1.0` if LMS-backed, else fall back to `0.6 / 0.8 / 0.5` per the readme's table.
7. `adjusted = declared × C`.

This is literally the `Â(i,k) = L(i,k) × C(i,k)` formula from the readme — the mock data already shows you what the *output* of that pipeline looks like, so step 1–6 above is just "show your work" for the demo if you want it animated/computed live rather than static.

---

## Porting to any other system (non-Supabase)

The files are plain CSV/JSON, so:
- **Firebase/Firestore**: import `student_profiles.json` directly as documents keyed by `student_id`.
- **MySQL/Postgres elsewhere**: same `CREATE TABLE` statements above work, just swap `jsonb` → `json` for MySQL.
- **Google Sheets**: `student_profiles_flat.csv` imports cleanly as-is, useful if you want a quick judge-facing data view without touching the DB.

---

## Notes
- All data is synthetic — names, IDs, and grades are randomly generated, not real students.
- `preferred_teammate` is `null`/blank for ~60% of students, matching the readme's "optional" framing for T3.
- `preferred_projects` references `P_01`–`P_15` — if you haven't mocked the projects table yet, generate that next so the IDs resolve to something real on the dashboard.
