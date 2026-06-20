"""Seed adapter: ``seed.json`` -> immutable domain objects.

This is an impure edge (file I/O). It depends on ``domain/`` only and is never
imported by ``engine/``. Conversions are explicit so no ``Any`` from ``json``
leaks into the typed domain objects.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from aegis.domain.models import (
    ActivityEvent,
    Cohort,
    Project,
    SkillDeclaration,
    Student,
)

DEFAULT_SEED: Path = Path(__file__).resolve().parents[1] / "seed" / "seed.json"


def _skill(raw: dict[str, Any]) -> SkillDeclaration:
    lms = raw.get("lms_grade")
    survey = raw.get("survey_score")
    return SkillDeclaration(
        discipline=str(raw["discipline"]),
        declared_level=float(raw["declared_level"]),
        confidence_basis=str(raw["confidence_basis"]),
        lms_grade=None if lms is None else float(lms),
        portfolio_submitted=bool(raw.get("portfolio_submitted", False)),
        survey_score=None if survey is None else float(survey),
    )


def _student(raw: dict[str, Any]) -> Student:
    teammate = raw.get("preferred_teammate_id")
    role = raw.get("preferred_role")
    return Student(
        student_id=str(raw["student_id"]),
        name=str(raw["name"]),
        email=str(raw["email"]),
        capacity_hours=float(raw["capacity_hours"]),
        skills=tuple(_skill(s) for s in raw["skills"]),  # required — no skill-less student
        preferred_projects=tuple(str(p) for p in raw.get("preferred_projects", [])),
        preferred_teammate_id=None if teammate is None else str(teammate),
        availability=tuple(str(a) for a in raw.get("availability", [])),
        preferred_role=None if role is None else str(role),
    )


def _project(raw: dict[str, Any]) -> Project:
    supervisor = raw.get("supervisor_id")
    return Project(
        project_id=str(raw["project_id"]),
        title=str(raw["title"]),
        abstract=str(raw["abstract"]),
        capacity=int(raw["capacity"]),
        required_skills=tuple(str(s) for s in raw["required_skills"]),  # required for Fit/match
        critical_skills=tuple(str(s) for s in raw.get("critical_skills", [])),
        meeting_slots=tuple(str(s) for s in raw.get("meeting_slots", [])),
        supervisor_id=None if supervisor is None else str(supervisor),
        total_hours=float(raw["total_hours"]),  # required — no legitimate 0-hour project
    )


def _event(raw: dict[str, Any]) -> ActivityEvent:
    assigned = raw.get("assigned_to")
    task = raw.get("task_id")
    return ActivityEvent(
        author_id=str(raw["author_id"]),
        sim_day=int(raw["sim_day"]),
        event_type=str(raw["event_type"]),
        assigned_to=None if assigned is None else str(assigned),
        task_id=None if task is None else str(task),
    )


def load_cohort(path: str | Path = DEFAULT_SEED) -> Cohort:
    """Load and validate the seed file into an immutable :class:`Cohort`."""
    data: Any = json.loads(Path(path).read_text(encoding="utf-8"))
    return Cohort(
        students=tuple(_student(s) for s in data["students"]),
        projects=tuple(_project(p) for p in data["projects"]),
        activity_log=tuple(_event(e) for e in data.get("activity_log", [])),
    )
