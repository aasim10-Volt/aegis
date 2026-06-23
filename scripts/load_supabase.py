#!/usr/bin/env python
"""Load the mock cohort into Supabase (idempotent — safe to re-run).

Reads .env for SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, builds the Cohort from the
uploaded mock students (+ generated projects/activity/monitoring), and writes it to
the tables created by migrations 0001 + 0003. Student ids are mapped to stable UUIDs
(students.id is uuid). Re-runnable: PK tables upsert; per-student append tables
(skills_declared, activity_log) are cleared for the loaded students first, so a
second run replaces rather than duplicates.

    python -m scripts.load_supabase     # run from repo root
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

from aegis.adapters.repo_mock import load_mock_cohort
from aegis.engine import config

NAMESPACE = uuid.UUID("a3e9c0de-0000-4000-8000-000000000a15")  # stable namespace for AEGIS ids
COHORT_NAME = "CS-2026"
COHORT_ID = str(uuid.uuid5(NAMESPACE, COHORT_NAME))            # deterministic uuid for the cohort


def _pid(project_id: str) -> str:
    """Deterministic UUID for a mock project id (projects.id is uuid)."""
    return str(uuid.uuid5(NAMESPACE, project_id))

def _load_env() -> None:
    """Load .env into os.environ. Tries python-dotenv, falls back to a tiny parser."""
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except ModuleNotFoundError:
        pass

    env = Path(".env")
    if env.exists():
        for raw in env.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.split("  #")[0].strip().strip('"').strip("'")
            os.environ.setdefault(key.strip(), value)


def _require_env(*keys: str) -> None:
    """Fail loudly with an actionable message instead of a cryptic KeyError."""
    missing = [k for k in keys if not os.environ.get(k)]
    if missing:
        cwd = Path.cwd()
        env_exists = (cwd / ".env").exists()
        sys.exit(
            "ERROR: missing required environment variable(s): "
            + ", ".join(missing)
            + f"\n  .env present at {cwd}\\.env: {env_exists}"
            + "\n  Fix: create .env in the repo root with:\n"
            "    SUPABASE_URL=https://<ref>.supabase.co\n"
            "    SUPABASE_SERVICE_ROLE_KEY=<service_role key>\n"
            "  Run from the repo root so .env is in the working directory."
        )


def main() -> None:
    _load_env()
    _require_env("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")

    from supabase import create_client

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    cohort = load_mock_cohort()
    student_uuids = [_sid(s.student_id) for s in cohort.students]

    # ── projects (PK id → upsert) ───────────────────────────────────────────
    sb.table("projects").upsert(
        [
            {
                "id": p.project_id,
                "title": p.title,
                "abstract": p.abstract,
                "capacity": p.capacity,
                "required_skills": list(p.required_skills),
                "critical_skills": list(p.critical_skills),
                "meeting_slots": list(p.meeting_slots),
                "total_hours": p.total_hours,
            }
            for p in cohort.projects
        ]
    ).execute()

    # ── cohort row (so students.cohort_id is a valid uuid FK, and lecturer-scope
    #    RLS works in the demo). Guarded: if the cohorts table/column isn't there,
    #    we load without the cohort link rather than hard-failing. ─────────────
    cohort_id: str | None = None
    try:
        sb.table("cohorts").upsert({"id": COHORT_ID, "name": COHORT_NAME, "year": 2026}).execute()
        cohort_id = COHORT_ID
    except Exception as exc:  # noqa: BLE001 — best-effort; missing cohorts infra is non-fatal
        print(f"note: skipping cohort link ({exc.__class__.__name__}); loading students without cohort_id")

    # ── students (PK id → upsert). cohort_id only included when we have a valid one
    #    (avoids the 'CS-2026' text-vs-uuid bug and 'column does not exist'). ──
    student_rows = []
    for s in cohort.students:
        row = {
            "id": _sid(s.student_id),
            "name": s.name,
            "email": s.email,
            "capacity_hours": s.capacity_hours,
            "availability": list(s.availability),
            "preferred_projects": list(s.preferred_projects),
            "preferred_role": s.preferred_role,
        }
        if cohort_id is not None:
            row["cohort_id"] = cohort_id
        student_rows.append(row)
    sb.table("students").upsert(student_rows).execute()

    # ── skills_declared (no natural PK → clear this cohort's rows, then insert) ─
    sb.table("skills_declared").delete().in_("student_id", student_uuids).execute()
    skills = [
        {
            "student_id": _sid(s.student_id),
            "discipline": sk.discipline,
            "declared_level": sk.declared_level,
            "confidence_basis": sk.confidence_basis,
            "adjusted_score": round(sk.declared_level * config.CONFIDENCE[sk.confidence_basis], 2),
        }
        for s in cohort.students
        for sk in s.skills
    ]
    for i in range(0, len(skills), 500):
        sb.table("skills_declared").insert(skills[i : i + 500]).execute()

    # ── activity_log (auto id → clear this cohort's rows, then insert in batches) ─
    sb.table("activity_log").delete().in_("student_id", student_uuids).execute()
    activity = [
        {
            "student_id": _sid(e.author_id),
            "action": e.event_type,
            "sim_day": e.sim_day,
            "event_type": e.event_type,
            "assigned_to": None if e.assigned_to is None else _sid(e.assigned_to),
            "task_id": e.task_id,
        }
        for e in cohort.activity_log
    ]
    for i in range(0, len(activity), 500):
        sb.table("activity_log").insert(activity[i : i + 500]).execute()

    # ── team_monitoring (PK project_id → upsert) ────────────────────────────
    sb.table("team_monitoring").upsert(
        [
            {
                "project_id": pid,
                "tasks_assigned": m.tasks_assigned,
                "tasks_done": m.tasks_done,
                "milestones_due": m.milestones_due,
                "milestones_done": m.milestones_done,
            }
            for pid, m in cohort.monitoring.items()
        ],
        on_conflict="project_id",
    ).execute()

    print(
        f"loaded: {len(cohort.students)} students, {len(cohort.projects)} projects, "
        f"{len(skills)} skills, {len(activity)} activity events, "
        f"{len(cohort.monitoring)} monitoring rows"
        + ("" if cohort_id else "  (cohort_id omitted)")
    )


if __name__ == "__main__":
    main()