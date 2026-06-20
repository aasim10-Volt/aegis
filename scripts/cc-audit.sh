#!/usr/bin/env bash
# cc-audit.sh — continuous, deterministic audit for AEGIS.
# Invoked by .claude/settings.json on every Write/Edit/MultiEdit.
# Runs the right checks for the file just touched. Deterministic — it cannot
# hallucinate, unlike a model review. Pair it with the read-only reviewer
# subagents (silent-failure-hunter, python-reviewer) at phase gates.
set -uo pipefail

# --- resolve a working Python interpreter (Windows Git Bash often has only
#     `python`; `python3` may be the Microsoft Store stub that prints and exits) -
PY=""
for cand in python3 python py; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c 'import sys' >/dev/null 2>&1; then
    PY="$cand"; break
  fi
done

# --- resolve the edited file path across Claude Code versions --------------
file="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"
if [ -z "$file" ] && [ ! -t 0 ] && [ -n "$PY" ]; then
  # fall back to stdin JSON: { "tool_input": { "file_path": "..." } }
  file="$("$PY" -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)"
fi
# A silent skip must be observable — never let "ran nothing" look like "passed".
if [ -z "$file" ]; then
  echo "▶ audit: SKIPPED — no file path resolved (interpreter: ${PY:-none})" >&2
  exit 0
fi

fail=0

# Run a tool only if it's on PATH; otherwise say so loudly rather than pass silently.
run() {  # run <label> <cmd...>
  if command -v "$2" >/dev/null 2>&1; then
    "${@:2}" || fail=1
  else
    echo "  SKIPPED: $2 not found on PATH" >&2
    fail=1
  fi
}

case "$file" in
  *.py)
    echo "▶ audit: $file"
    run ruff ruff check "$file"
    run mypy mypy "$file"
    # Engine or tests touched → run the golden suite. A mis-scoring swap pass,
    # a broken C-weighting, or a maximin regression is caught the moment it's written.
    case "$file" in
      *engine*|*tests*) run pytest pytest -q ;;
    esac
    ;;
  *.ts|*.tsx)
    echo "▶ audit: $file"
    run tsc pnpm exec tsc --noEmit
    run eslint pnpm exec eslint "$file"
    ;;
  *)
    echo "▶ audit: $file — no checks for this file type" >&2
    ;;
esac

# Default: surface findings without blocking the coder (audit, not a gate).
# To make a failing engine test HARD-STOP the build instead, change the next
# line to:  [ "$fail" -eq 0 ] || exit 2   ← exit 2 feeds the failure back to Claude.
exit 0
