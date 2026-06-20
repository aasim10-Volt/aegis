"""Enforce the one rule that protects the 55 marks: ``engine/`` points inward only.

``engine/`` may import from the standard library, third-party libs, and
``aegis.domain`` / ``aegis.engine`` only. Any import of ``adapters``, ``api``,
``google``, or ``supabase`` means a Drive/DB/HTTP change could silently break
matching — so we fail the build the moment such an import appears.
"""

from __future__ import annotations

import ast
from pathlib import Path

ENGINE_DIR = Path(__file__).resolve().parents[1] / "engine"
FORBIDDEN = ("adapters", "api", "google", "supabase", "fastapi")


def _imported_roots(source: str) -> set[str]:
    roots: set[str] = set()
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                roots.add(alias.name.split(".")[0])
                if alias.name.startswith("aegis."):
                    roots.add(alias.name.split(".")[1])
        elif isinstance(node, ast.ImportFrom) and node.module:
            parts = node.module.split(".")
            roots.add(parts[0])
            if parts[0] == "aegis" and len(parts) > 1:
                roots.add(parts[1])
    return roots


def test_engine_imports_inward_only() -> None:
    engine_files = sorted(ENGINE_DIR.glob("*.py"))
    assert engine_files, "expected engine modules to scan"
    for path in engine_files:
        roots = _imported_roots(path.read_text(encoding="utf-8"))
        leaked = roots & set(FORBIDDEN)
        assert not leaked, f"{path.name} imports forbidden module(s): {sorted(leaked)}"
