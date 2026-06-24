"""Back up the live Supabase Postgres database with pg_dump.

Loads .env (never prints secrets), finds pg_dump automatically, and writes a
timestamped SQL dump to ./backups/ (gitignored). Re-runnable.

CONNECTION STRING (required, in .env):
    Supabase Dashboard -> Project Settings -> Database -> Connection string.
    Prefer the **Session pooler** URI (IPv4, port 5432) — it's the most reliable
    for pg_dump, especially on IPv6/hotspot networks. Paste it into .env as:

        SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

    (DATABASE_URL is also accepted.)

USAGE:
    python scripts/backup_db.py            # dump the public schema (app data)
    python scripts/backup_db.py --full     # attempt every schema
    python scripts/backup_db.py --schema-only   # structure, no rows

RESTORE (into any Postgres / a fresh Supabase project):
    psql "<connection string>" -f backups/aegis_<timestamp>.sql
"""

from __future__ import annotations

import glob
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime


def _load_env(path: str = ".env") -> None:
    try:
        for line in open(path, encoding="utf-8"):
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2).split(" #")[0].strip()
    except FileNotFoundError:
        pass


def _conn_string() -> str:
    for key in ("SUPABASE_DB_URL", "DATABASE_URL"):
        val = os.environ.get(key, "").strip().strip('"').strip("'")
        if val:
            return val
    sys.exit(
        "No database connection string found.\n"
        "Add SUPABASE_DB_URL to .env — get it from the Supabase Dashboard:\n"
        "  Project Settings -> Database -> Connection string -> URI (Session pooler).\n"
        "  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
    )


def _find_pg_dump() -> str:
    # 1) explicit override, 2) PATH, 3) standard Windows install (highest version).
    override = os.environ.get("AEGIS_PG_DUMP", "").strip()
    if override and os.path.exists(override):
        return override
    on_path = shutil.which("pg_dump")
    if on_path:
        return on_path
    candidates = sorted(
        glob.glob(r"C:\Program Files\PostgreSQL\*\bin\pg_dump.exe"), reverse=True
    )
    if candidates:
        return candidates[0]
    sys.exit(
        "pg_dump not found. Install PostgreSQL client tools, or set AEGIS_PG_DUMP "
        "to the full path of pg_dump.exe."
    )


def main() -> None:
    _load_env()
    conn = _conn_string()
    pg_dump = _find_pg_dump()

    args = sys.argv[1:]
    os.makedirs("backups", exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = "schema" if "--schema-only" in args else ("full" if "--full" in args else "public")
    out = os.path.join("backups", f"aegis_{suffix}_{stamp}.sql")

    cmd = [pg_dump, "--no-owner", "--no-privileges", "--dbname", conn, "--file", out]
    if "--full" not in args:
        cmd[1:1] = ["--schema", "public"]
    if "--schema-only" in args:
        cmd[1:1] = ["--schema-only"]

    # Supabase requires SSL; harmless if the URL already specifies it.
    env = {**os.environ, "PGSSLMODE": os.environ.get("PGSSLMODE", "require")}

    print(f"Dumping with {os.path.basename(pg_dump)} -> {out}")
    result = subprocess.run(cmd, env=env)
    if result.returncode != 0:
        sys.exit(f"pg_dump failed (exit {result.returncode}). See the error above.")

    size_mb = os.path.getsize(out) / 1_048_576
    print(f"OK: {out}  ({size_mb:.2f} MB)")
    print(f"Restore with:  psql \"<connection string>\" -f {out}")


if __name__ == "__main__":
    main()
