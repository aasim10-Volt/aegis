"""API tests — FastAPI endpoints over the engine pipeline."""

from __future__ import annotations

from fastapi.testclient import TestClient

from aegis.api.main import app

client = TestClient(app)


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_run_returns_full_result() -> None:
    body = client.post("/run").json()
    assert {t["project_id"] for t in body["teams"]} == {"P_01", "P_04", "P_05"}
    assert len(body["student_profiles"]) == 12
    assert body["exception_pool"] == []
    assert any(
        {d["project_a"], d["project_b"]} == {"P_02", "P_03"} for d in body["duplicate_flags"]
    )
    triggers = {a["trigger_type"] for a in body["alerts"]}
    assert {"ghosting_tier3", "sympathy_carry", "burnout"} <= triggers


def test_run_has_five_pipeline_stages() -> None:
    stages = client.post("/run").json()["stages"]
    assert [s["key"] for s in stages] == ["verify", "dedupe", "match", "form", "monitor"]


def test_teams_have_bands_and_members() -> None:
    teams = client.get("/teams").json()
    assert len(teams) == 3
    bands = {t["project_id"]: t["band"] for t in teams}
    assert bands == {"P_01": "at_risk", "P_04": "healthy", "P_05": "critical"}
    assert all(len(t["members"]) == 4 for t in teams)


def test_alerts_sorted_critical_first() -> None:
    severities = [a["severity"] for a in client.get("/alerts").json()]
    rank = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    assert severities == sorted(severities, key=lambda s: rank[s])


def test_student_profile_shows_dunning_kruger_correction() -> None:
    body = client.get("/students/STU_08").json()
    tech = next(s for s in body["skills"] if s["discipline"] == "technical")
    assert tech["declared"] == 5.0
    assert tech["adjusted"] == 2.5
    assert tech["corrected"] is True
    assert "discounted" in body["rationale"]


def test_unknown_student_404() -> None:
    assert client.get("/students/NOPE").status_code == 404
