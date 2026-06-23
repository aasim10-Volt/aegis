"""Function-level authorization for the admin console (OWASP API5:2023).

The /admin/* governance endpoints run on the service_role backend, which
bypasses RLS. Left unauthenticated, they let any caller who can reach the API
read governance/audit data and approve accounts. This dependency restores the
RLS model at the API edge: it resolves a *real authenticated identity* and
requires the same authoritative ``profiles.role = 'admin'`` that SQL
``is_admin()`` checks — the API must not be a way around RLS.

Accepted identities (``Authorization: Bearer <token>``):
  1. A Supabase user access token whose ``profiles.role = 'admin'``. The token
     is validated against Supabase Auth; the role is then read from ``profiles``
     (the authoritative column, not client-supplied metadata).
  2. The ``service_role`` key itself — the documented trusted-backend path.
     Holding service_role already grants full DB access, so accepting it here is
     not a weakening; it is compared in constant time, and it is a real secret,
     not a static header password.

Scope: the gate is enforced only when a live database is configured
(``SUPABASE_URL`` set) — the production path this finding is about. In seed-only
mode the endpoints serve static demo data with no secrets and perform no DB
writes (``post_approval`` already refuses), and offline dev/tests carry no
credentials, so the gate is inert there by design.
"""

from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, status


class AdminIdentity:
    """The resolved caller permitted to use /admin/*."""

    def __init__(self, subject: str, role: str) -> None:
        self.subject = subject  # auth.uid, "service_role", or "seed"
        self.role = role


def _bearer(authorization: str | None) -> str | None:
    """Extract a Bearer token from an Authorization header, or None."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def require_admin(authorization: str | None = Header(default=None)) -> AdminIdentity:
    """FastAPI dependency: allow only an admin identity through.

    Raises 401 for a missing/invalid credential, 403 for an authenticated
    non-admin. Inert in seed-only mode (no SUPABASE_URL) so offline dev, tests,
    and the static-seed demo keep working without credentials.
    """
    if not os.environ.get("SUPABASE_URL"):
        # No live data to protect; static seed governance only.
        return AdminIdentity(subject="seed", role="admin")

    token = _bearer(authorization)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="admin endpoints require a Bearer access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # (1) Trusted backend: the service_role key itself (constant-time compare).
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if service_key and hmac.compare_digest(token, service_key):
        return AdminIdentity(subject="service_role", role="service_role")

    # (2) A real Supabase user: validate the JWT, then resolve the authoritative
    #     profiles.role (the same column RLS is_admin() trusts).
    from aegis.adapters.repo_db import resolve_user_role

    resolved = resolve_user_role(token)
    if resolved is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    uid, role = resolved
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="admin role required",
        )
    return AdminIdentity(subject=uid, role=role)
