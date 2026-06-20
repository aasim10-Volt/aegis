"""Shared fixtures: the engineered seed cohort."""

from __future__ import annotations

import pytest

from aegis.adapters.repo_seed import load_cohort
from aegis.domain.models import Cohort


@pytest.fixture(scope="session")
def cohort() -> Cohort:
    return load_cohort()
