"""Supabase read adapter: live tables -> domain Cohort.

Reads the engine-shaped rows (after 0001+0002+0003 and a data load) via supabase-py
with the service_role key, and maps them into the same immutable Cohort that
``repo_seed`` / ``repo_mock`` produce — so the engine and API are unchanged.

Impure edge: depends on domain + supabase-py. Never imported by ``engine/``. The
pure ``rows_to_cohort`` mapping is unit-testable without a live database; only
``load_db_cohort`` touches the network.
"""

from __future__ import annotations

import os
from typing import Any

from aegis.domain.models import (
    ActivityEvent,
    AllocationResult,
    Cohort,
    Project,
    SkillDeclaration,
    Student,
    TeamMonitoring,
)

Row = dict[str, Any]

# service_role sentinel for backend-authored audit rows (mirrors the SQL triggers).
SERVICE_ACTOR = "00000000-0000-0000-0000-000000000000"


def _str_list(v: Any) -> tuple[str, ...]:
    return tuple(str(x) for x in (v or []))


def rows_to_cohort(
    students: list[Row],
    skills: list[Row],
    projects: list[Row],
    activity: list[Row],
    monitoring: list[Row],
) -> Cohort:
    """Pure mapping from Supabase rows to a Cohort. No I/O — safe to unit-test."""
    skills_by_student: dict[str, list[SkillDeclaration]] = {}
    for r in skills:
        skills_by_student.setdefault(str(r["student_id"]), []).append(
            SkillDeclaration(
                discipline=str(r["discipline"]),
                declared_level=float(r["declared_level"]),
                confidence_basis=str(r["confidence_basis"]),
            )
        )

    student_objs = tuple(
        Student(
            student_id=str(r["id"]),
            name=str(r["name"]),
            email=str(r["email"]),
            capacity_hours=float(r["capacity_hours"]),
            skills=tuple(skills_by_student.get(str(r["id"]), [])),
            preferred_projects=_str_list(r.get("preferred_projects")),
            preferred_teammate_id=(
                None if r.get("preferred_teammate_id") is None else str(r["preferred_teammate_id"])
            ),
            availability=_str_list(r.get("availability")),
            preferred_role=(None if r.get("preferred_role") is None else str(r["preferred_role"])),
        )
        for r in students
    )

    project_objs = tuple(
        Project(
            project_id=str(r["id"]),
            title=str(r["title"]),
            abstract=str(r["abstract"]),
            capacity=int(r["capacity"]),
            required_skills=_str_list(r.get("required_skills")),
            critical_skills=_str_list(r.get("critical_skills")),
            meeting_slots=_str_list(r.get("meeting_slots")),
            supervisor_id=(None if r.get("supervisor_id") is None else str(r["supervisor_id"])),
            total_hours=float(r.get("total_hours") or 0.0),
        )
        for r in projects
    )

    activity_objs = tuple(
        ActivityEvent(
            author_id=str(r["student_id"]),
            sim_day=int(r["sim_day"]),
            event_type=str(r["event_type"]),
            assigned_to=(None if r.get("assigned_to") is None else str(r["assigned_to"])),
            task_id=(None if r.get("task_id") is None else str(r["task_id"])),
        )
        for r in activity
        if r.get("sim_day") is not None and r.get("event_type") is not None
    )

    monitoring_map = {
        str(r["project_id"]): TeamMonitoring(
            tasks_assigned=int(r["tasks_assigned"]),
            tasks_done=int(r["tasks_done"]),
            milestones_due=int(r["milestones_due"]),
            milestones_done=int(r["milestones_done"]),
        )
        for r in monitoring
    }

    return Cohort(
        students=student_objs,
        projects=project_objs,
        activity_log=activity_objs,
        monitoring=monitoring_map,
    )


def _service_client() -> Any:
    """Service-role client — bypasses RLS. Backend only (never the browser)."""
    from supabase import create_client  # imported lazily so seed-only runs need no client

    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def load_db_cohort() -> Cohort:
    """Fetch the cohort from Supabase. Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."""
    client = _service_client()

    def fetch(table: str) -> list[Row]:
        data: Any = client.table(table).select("*").execute().data
        return list(data)

    return rows_to_cohort(
        students=fetch("students"),
        skills=fetch("skills_declared"),
        projects=fetch("projects"),
        activity=fetch("activity_log"),
        monitoring=fetch("team_monitoring"),
    )


# ── write-back: the "allocation writer" the schema expects (service_role) ─────
def save_result(result: AllocationResult, cohort_id: str = "CS-2026") -> dict[str, int]:
    """Persist a computed allocation to Supabase and log the run in the audit chain.

    Idempotent: clears the previous allocation first (this backend IS the single
    allocation writer per 0001's note). The audit_log insert fires the SQL
    audit_chain trigger, so the governance trail is tamper-evident automatically.
    """
    client = _service_client()
    health = {r.team_id: round(float(r.score), 1) for r in result.health}
    team_ids = {t.team_id for t in result.teams}

    # reset prior allocation (alerts first; deleting teams cascades members/tasks).
    client.table("alerts").delete().neq("id", -1).execute()
    client.table("teams").delete().neq("id", "__none__").execute()

    if result.teams:
        client.table("teams").insert(
            [
                {
                    "id": t.team_id,
                    "project_id": t.project_id,
                    "health_score": health.get(t.team_id),
                    "status": "formed",
                }
                for t in result.teams
            ]
        ).execute()

    members = [
        {"team_id": t.team_id, "student_id": mid} for t in result.teams for mid in t.member_ids
    ]
    for i in range(0, len(members), 500):
        client.table("team_members").insert(members[i : i + 500]).execute()

    alert_rows = [
        {
            "team_id": a.team_id if a.team_id in team_ids else None,
            "severity": a.severity,
            "trigger_type": a.trigger_type,
            "detail": a.detail,
        }
        for a in result.alerts
    ]
    if alert_rows:
        client.table("alerts").insert(alert_rows).execute()

    # governance: record the run (audit_chain trigger computes the hash chain).
    client.table("audit_log").insert(
        {
            "actor_id": SERVICE_ACTOR,
            "actor_role": "service_role",
            "action": "allocation_run",
            "target_type": "cohort",
            "target_id": cohort_id,
            "metadata": {
                "teams": len(result.teams),
                "alerts": len(result.alerts),
                "exception_pool": len(result.exception_pool),
            },
        }
    ).execute()

    return {"teams": len(result.teams), "members": len(members), "alerts": len(alert_rows)}


def load_db_audit() -> list[Row]:
    """Live governance audit log, newest first."""
    client = _service_client()
    data: Any = (
        client.table("audit_log")
        .select("id,actor_id,actor_role,action,target_id,reason,created_at,row_hash")
        .order("id", desc=True)
        .execute()
        .data
    )
    return list(data)


def db_integrity() -> dict[str, Any]:
    """Verify the live audit chain via the SQL audit_verify() function."""
    client = _service_client()
    count: int = client.table("audit_log").select("id", count="exact").execute().count or 0
    rows: Any = client.rpc("audit_verify", {}).execute().data
    broken = rows[0]["broken_at"] if rows else None
    return {"verified": broken is None and count > 0, "broken_at": broken, "entries": count}
